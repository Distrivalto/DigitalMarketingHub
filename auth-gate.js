/* ==========================================================================
   DIGITAL MARKETING HUB — Auth Gate
   Login individual por persona + carga de datos compartidos desde Supabase
   antes de arrancar app.js, más suscripción en tiempo real a cambios de
   cualquier otro miembro del equipo.
   ========================================================================== */

(function () {
  'use strict';

  var config = window.__SUPABASE_CONFIG || {};
  var gateEl = document.getElementById('authGate');
  var shellEl = document.querySelector('.app-shell');
  var form = document.getElementById('authForm');
  var emailInput = document.getElementById('authEmail');
  var passwordInput = document.getElementById('authPassword');
  var errorEl = document.getElementById('authError');
  var successEl = document.getElementById('authSuccess');
  var submitBtn = document.getElementById('authSubmitBtn');

  if (!config.url || config.url.indexOf('PASTE_YOUR') === 0) {
    showError('El HUB todavía no tiene credenciales de Supabase configuradas. Revisa supabase-config.js.');
    return;
  }

  var supabase = window.supabase.createClient(config.url, config.anonKey);
  window.__hubSupabase = supabase;
  var currentUser = null;
  var appScriptLoaded = false;

  // Vistas que un rol "contributor" (todo el equipo salvo el admin) sí
  // puede editar, las que ya alimentan ellos mismos. Todo lo demás queda
  // de solo lectura, reforzado también en las políticas de Supabase.
  // Los catálogos del Activation Framework (Digital, Trade, Brand, Media
  // Kit) quedan de solo lectura para el equipo (los administra Claudio, como
  // el Inventory), pero el Registro de Campañas sí es de todo el equipo:
  // ahí es donde se arman y quedan registradas las campañas reales.
  var TEAM_EDITABLE_KEYS = [
    'dmg_content_inputs_v1', 'dmg_briefs_v1', 'dmg_calendar_posts_v1',
    'dmg_af_campaigns_v1',
  ];
  var TEAM_EDITABLE_VIEW_IDS = ['view-contentInputs', 'view-briefs', 'view-calendar', 'view-activationFramework'];
  // Dentro de view-activationFramework hay tabs mixtos: Digital/Trade/Brand/
  // Media Kit quedan de solo lectura para el equipo, Packs es estático, y
  // Registro de Campañas es editable por todos. Por eso la vista completa no
  // entra al banner genérico de "solo lectura" (ver TEAM_EDITABLE_VIEW_IDS
  // arriba); en vez de eso, applyReadOnlyBanners() le pone el aviso solo a
  // esos cuatro sub-paneles de catálogo.
  var AF_READONLY_PANEL_IDS = ['afPanel-catalog', 'afPanel-trade', 'afPanel-brand', 'afPanel-mediakit', 'afPanel-packs'];
  var ALL_VIEW_IDS = [
    'view-dashboard', 'view-projects', 'view-tasks', 'view-objectives',
    'view-activationFramework', 'view-briefs', 'view-contentInputs', 'view-calendar', 'view-inventory', 'view-access',
    'view-audit', 'view-quickwins', 'view-reports', 'view-notes', 'view-timeline',
    'view-settings', 'view-docs',
  ];

  window.__hubCanEditKey = function (key) {
    return window.__hubRole === 'admin' || TEAM_EDITABLE_KEYS.indexOf(key) !== -1;
  };

  function showToast(msg) {
    var el = document.createElement('div');
    el.className = 'hub-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('hub-toast-visible'); });
    setTimeout(function () {
      el.classList.remove('hub-toast-visible');
      setTimeout(function () { el.remove(); }, 250);
    }, 3200);
  }

  window.__hubDenyEdit = function () {
    showToast('No tienes permiso para editar esta sección. Pídele acceso al Digital Marketing Specialist si lo necesitas.');
  };

  function applyReadOnlyBanners() {
    if (window.__hubRole === 'admin') return;
    ALL_VIEW_IDS.forEach(function (id) {
      if (TEAM_EDITABLE_VIEW_IDS.indexOf(id) !== -1) return;
      var view = document.getElementById(id);
      if (!view || view.querySelector('.hub-readonly-banner')) return;
      var banner = document.createElement('div');
      banner.className = 'hub-readonly-banner';
      banner.textContent = 'Solo lectura. Los cambios en esta sección los hace el Digital Marketing Specialist.';
      view.insertBefore(banner, view.firstChild);
    });
    AF_READONLY_PANEL_IDS.forEach(function (id) {
      var panel = document.getElementById(id);
      if (!panel || panel.querySelector('.hub-readonly-banner')) return;
      var banner = document.createElement('div');
      banner.className = 'hub-readonly-banner';
      banner.textContent = 'Solo lectura. Estos catálogos (Digital, Trade, Brand, Media Kit) los actualiza el Digital Marketing Specialist; el Registro de Campañas sí lo puede editar todo el equipo.';
      panel.insertBefore(banner, panel.firstChild);
    });
  }

  function showError(msg) {
    if (errorEl) errorEl.textContent = msg;
  }

  function showSuccess(msg) {
    if (successEl) successEl.textContent = msg;
  }

  function idleSubmitLabel() {
    return (passwordInput && passwordInput.value) ? 'Entrar' : 'Enviar link de acceso';
  }

  function setLoading(isLoading) {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? 'Entrando…' : idleSubmitLabel();
  }

  // El botón cambia de texto solo con que empieces a escribir una
  // contraseña, para que quede claro que ese campo sí hace algo distinto.
  if (passwordInput && submitBtn) {
    passwordInput.addEventListener('input', function () {
      submitBtn.textContent = idleSubmitLabel();
    });
  }

  // Deja disponible una forma de configurar contraseña propia una vez
  // logueado (por magic link), para no depender del link por correo en el
  // futuro. Se corre a mano desde la consola del navegador:
  //   window.__hubSetPassword('tu-clave-nueva')
  window.__hubSetPassword = async function (newPassword) {
    if (!currentUser) {
      console.warn('Tenés que estar logueado primero para poder configurar una contraseña.');
      return;
    }
    var result = await supabase.auth.updateUser({ password: newPassword });
    if (result.error) {
      console.error('No se pudo configurar la contraseña:', result.error.message);
      return;
    }
    console.log('Listo, contraseña configurada para ' + currentUser.email + '. Ya puedes usarla en el login.');
  };

  async function fetchAllRows() {
    var result = await supabase.from('hub_store').select('key,value');
    var map = {};
    (result.data || []).forEach(function (row) { map[row.key] = row.value; });
    return map;
  }

  function loadAppScript() {
    if (appScriptLoaded) return;
    appScriptLoaded = true;
    var s = document.createElement('script');
    s.src = 'app.js';
    document.body.appendChild(s);
  }

  function setupRealtime() {
    supabase
      .channel('hub_store_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hub_store' }, async function () {
        window.__HUB_REMOTE_DATA = await fetchAllRows();
        if (window.__hubReloadAll) window.__hubReloadAll();
        applyReadOnlyBanners();
      })
      .subscribe();
  }

  async function fetchRole(userId) {
    var result = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (result.error || !result.data) return 'contributor';
    return result.data.role || 'contributor';
  }

  async function bootHub(user) {
    currentUser = user;
    window.__hubCurrentUser = user;
    window.__hubRole = await fetchRole(user.id);
    document.body.classList.remove('role-admin', 'role-contributor');
    document.body.classList.add('role-' + window.__hubRole);

    if (gateEl) gateEl.style.display = 'none';
    if (shellEl) shellEl.style.display = '';
    window.__HUB_REMOTE_DATA = await fetchAllRows();

    if (!appScriptLoaded) {
      loadAppScript();
      setupRealtime();
    } else if (window.__hubReloadAll) {
      window.__hubReloadAll();
    }
    setTimeout(applyReadOnlyBanners, 300);
  }

  // Empuja un cambio a Supabase. app.js llama a esto desde saveStore().
  window.__hubPushToRemote = async function (key, value) {
    if (!currentUser) return;
    var payload = { key: key, value: value, updated_by: currentUser.email };
    var result = await supabase.from('hub_store').upsert(payload);
    if (result.error) {
      console.error('No se pudo guardar en Supabase:', result.error.message);
    }
  };

  if (form) {
    form.addEventListener('submit', async function (evt) {
      evt.preventDefault();
      showError('');
      showSuccess('');
      var email = emailInput.value.trim();
      var password = passwordInput ? passwordInput.value : '';

      // Si escribiste una contraseña, entra directo (sin correo, sin
      // redirect) — útil cuando el Site URL/Redirect URLs de Supabase no
      // está bien configurado y el link por correo no puede volver a esta
      // misma página. Requiere haber corrido window.__hubSetPassword() una
      // vez antes, logueado por magic link.
      if (password) {
        setLoading(true);
        var pwResult = await supabase.auth.signInWithPassword({ email: email, password: password });
        setLoading(false);
        if (pwResult.error) {
          showError('No se pudo entrar con esa contraseña: ' + pwResult.error.message);
          return;
        }
        // onAuthStateChange (más abajo) se encarga de arrancar el HUB.
        return;
      }

      setLoading(true);
      // Magic link: sin contraseña, Supabase manda un correo con un link
      // que al hacer clic vuelve aquí mismo ya logueado (lo captura el
      // listener de onAuthStateChange de más abajo).
      var result = await supabase.auth.signInWithOtp({
        email: email,
        options: { emailRedirectTo: window.location.href },
      });
      setLoading(false);
      if (result.error) {
        showError('No se pudo enviar el link: ' + result.error.message);
        return;
      }
      form.style.display = 'none';
      showSuccess('Listo, te enviamos un link a ' + email + '. Ábrelo desde ese mismo correo para entrar.');
    });
  }

  // Cubre dos casos: (1) ya había sesión activa en este navegador, entra
  // directo; (2) la persona acaba de volver del link de su correo, Supabase
  // detecta el token en la URL y dispara este mismo evento con la sesión ya
  // creada.
  supabase.auth.onAuthStateChange(function (event, session) {
    if (session && session.user) {
      bootHub(session.user);
    }
  });
})();
