/* ==========================================================================
   DISTRIVALTO — DIGITAL MARKETING HUB
   Central Operating System — Application Logic
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     UTILITIES
     ------------------------------------------------------------------------ */

  let uidCounter = 0;
  function uid(prefix) { uidCounter += 1; return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + uidCounter; }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function initials(name) {
    return String(name).split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  function slugify(str) {
    return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || uid('col');
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /* ------------------------------------------------------------------------
     STATIC REFERENCE DATA
     ------------------------------------------------------------------------ */

  const BRANDS = ['Holstein Housewares', 'Connecto', 'Alessa', 'Distrivalto'];

  const STATUS_META = {
    healthy: { label: 'Healthy', chip: 'chip-green' },
    attention: { label: 'Needs Attention', chip: 'chip-amber' },
    critical: { label: 'Critical', chip: 'chip-red' },
  };
  const STATUS_ORDER = ['healthy', 'attention', 'critical'];

  const ASSET_STATUS_OPTIONS = ['Active', 'Needs Review', 'Inactive'];
  const ASSET_STATUS_COLOR = { Active: 'var(--green)', 'Needs Review': 'var(--amber)', Inactive: 'var(--red)' };
  const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];
  const PRIORITY_COLOR = { High: 'var(--red)', Medium: 'var(--amber)', Low: 'var(--ink-faint)' };
  const PRIORITY_CHIP = { High: 'chip-red', Medium: 'chip-amber', Low: 'chip-navy' };

  const TRACKING_OPTIONS = ['Verified', 'Partial', 'Not Verified'];
  const TWOFA_OPTIONS = ['Enabled', 'Partial', 'Disabled'];

  const ACCESS_LEVELS = ['none', 'viewer', 'editor', 'full'];
  const ACCESS_LABEL = { none: 'None', viewer: 'Viewer', editor: 'Editor', full: 'Full Admin' };
  const ACCESS_CLASS = { none: 'access-none', viewer: 'access-viewer', editor: 'access-editor', full: 'access-full' };

  /* ------------------------------------------------------------------------
     DEFAULT DATA (used only the first time — everything below is editable
     and persisted to localStorage from that point on)
     ------------------------------------------------------------------------ */

  const DEFAULT_ROLES = [
    { id: 'bo', label: 'Business Owner', core: true },
    { id: 'mm', label: 'Marketing Manager', core: true },
    { id: 'dms', label: 'Digital Marketing Specialist', core: true },
    { id: 'contrib', label: 'Contributors', core: false },
  ];

  const DEFAULT_PLATFORMS = [
    { id: 'meta', name: 'Meta', status: 'attention', tracking: 'Partial', twoFA: 'Partial', notes: 'Ad accounts split across two Business Managers — consolidation pending.',
      customFields: [{ id: uid('cf'), label: 'Active Campaigns', value: '4' }, { id: uid('cf'), label: 'Posts This Month', value: '18' }, { id: uid('cf'), label: 'Ads Running', value: '6' }] },
    { id: 'google', name: 'Google Ads', status: 'attention', tracking: 'Verified', twoFA: 'Enabled', notes: 'Legacy campaigns from a prior agency still active — pending pause and audit.',
      customFields: [{ id: uid('cf'), label: 'Active Campaigns', value: '3' }, { id: uid('cf'), label: 'Ads Running', value: '22' }] },
    { id: 'ga4', name: 'GA4', status: 'critical', tracking: 'Not Verified', twoFA: 'Disabled', notes: 'Conversion events not fully mapped across all three brand properties.',
      customFields: [{ id: uid('cf'), label: 'Conversion Events Mapped', value: '9 of 14' }] },
    { id: 'gtm', name: 'Google Tag Manager', status: 'critical', tracking: 'Partial', twoFA: 'Disabled', notes: 'Container access still held by a former freelancer — revoke pending.',
      customFields: [{ id: uid('cf'), label: 'Tags Published', value: '12' }] },
    { id: 'searchconsole', name: 'Search Console', status: 'healthy', tracking: 'Verified', twoFA: 'Enabled', notes: 'Verified and indexed correctly across all brand domains.',
      customFields: [{ id: uid('cf'), label: 'Indexed Pages', value: '340' }] },
    { id: 'youtube', name: 'YouTube', status: 'attention', tracking: 'Partial', twoFA: 'Enabled', notes: 'Channel branding inconsistent with current brand guidelines.',
      customFields: [{ id: uid('cf'), label: 'Videos Published', value: '5' }, { id: uid('cf'), label: 'Subscribers', value: '1,200' }] },
    { id: 'tiktok', name: 'TikTok', status: 'attention', tracking: 'Not Verified', twoFA: 'Enabled', notes: 'Pixel installed but not yet validated against GTM.',
      customFields: [{ id: uid('cf'), label: 'Videos Published', value: '9' }, { id: uid('cf'), label: 'Ads Running', value: '2' }] },
    { id: 'pinterest', name: 'Pinterest', status: 'healthy', tracking: 'Verified', twoFA: 'Enabled', notes: 'Low-activity account — structure confirmed clean.',
      customFields: [{ id: uid('cf'), label: 'Pins Published', value: '40' }] },
    { id: 'hubspot', name: 'HubSpot', status: 'attention', tracking: 'Partial', twoFA: 'Enabled', notes: 'Lead scoring not yet configured — CRM sync pending.',
      customFields: [{ id: uid('cf'), label: 'Active Workflows', value: '3' }, { id: uid('cf'), label: 'Contacts', value: '2,400' }] },
    { id: 'amazon', name: 'Amazon', status: 'healthy', tracking: 'Verified', twoFA: 'Enabled', notes: 'Seller Central access confirmed and documented.',
      customFields: [{ id: uid('cf'), label: 'Active Listings', value: '28' }] },
    { id: 'walmart', name: 'Walmart', status: 'attention', tracking: 'Partial', twoFA: 'Disabled', notes: '2FA not yet enforced on Marketplace login.',
      customFields: [{ id: uid('cf'), label: 'Active Listings', value: '15' }] },
    { id: 'website', name: 'Website', status: 'critical', tracking: 'Not Verified', twoFA: 'Disabled', notes: 'CMS access shared via a single generic login.',
      customFields: [{ id: uid('cf'), label: 'Pages Published', value: '24' }] },
    { id: 'looker', name: 'Looker Studio', status: 'healthy', tracking: 'Verified', twoFA: 'Enabled', notes: 'Dashboards live and connected to verified data sources.',
      customFields: [{ id: uid('cf'), label: 'Live Dashboards', value: '3' }] },
    { id: 'bitwarden', name: 'Bitwarden', status: 'attention', tracking: '—', twoFA: 'Enabled', notes: 'Vault created — not all team credentials migrated yet.',
      customFields: [{ id: uid('cf'), label: 'Credentials Migrated', value: '8 of 12' }] },
  ];

  const DEFAULT_ACCESS = {
    meta: { bo: 'viewer', mm: 'editor', dms: 'full', contrib: 'editor' },
    google: { bo: 'viewer', mm: 'full', dms: 'full', contrib: 'viewer' },
    ga4: { bo: 'viewer', mm: 'viewer', dms: 'editor', contrib: 'none' },
    gtm: { bo: 'viewer', mm: 'none', dms: 'editor', contrib: 'none' },
    searchconsole: { bo: 'viewer', mm: 'full', dms: 'full', contrib: 'viewer' },
    youtube: { bo: 'viewer', mm: 'full', dms: 'full', contrib: 'viewer' },
    tiktok: { bo: 'viewer', mm: 'full', dms: 'full', contrib: 'viewer' },
    pinterest: { bo: 'viewer', mm: 'full', dms: 'full', contrib: 'viewer' },
    hubspot: { bo: 'viewer', mm: 'full', dms: 'full', contrib: 'viewer' },
    amazon: { bo: 'viewer', mm: 'full', dms: 'full', contrib: 'viewer' },
    walmart: { bo: 'viewer', mm: 'full', dms: 'full', contrib: 'viewer' },
    website: { bo: 'viewer', mm: 'viewer', dms: 'editor', contrib: 'editor' },
    looker: { bo: 'viewer', mm: 'full', dms: 'full', contrib: 'viewer' },
    bitwarden: { bo: 'viewer', mm: 'full', dms: 'full', contrib: 'viewer' },
  };

  const DEFAULT_ASSET_COLUMNS = [
    { key: 'name', label: 'Asset', type: 'text', core: true },
    { key: 'brand', label: 'Brand', type: 'select', options: BRANDS, core: true },
    { key: 'platform', label: 'Platform', type: 'platform', core: true },
    { key: 'status', label: 'Status', type: 'select', options: ASSET_STATUS_OPTIONS, core: true },
    { key: 'priority', label: 'Priority', type: 'select', options: PRIORITY_OPTIONS, core: true },
  ];

  const DEFAULT_ASSETS = [
    { id: uid('a'), name: 'Meta Business Manager', brand: 'Holstein Housewares', platform: 'Meta', status: 'Active', priority: 'High' },
    { id: uid('a'), name: 'Meta Business Manager', brand: 'Connecto', platform: 'Meta', status: 'Needs Review', priority: 'High' },
    { id: uid('a'), name: 'Meta Business Manager', brand: 'Alessa', platform: 'Meta', status: 'Active', priority: 'Medium' },
    { id: uid('a'), name: 'Google Ads Account', brand: 'Holstein Housewares', platform: 'Google Ads', status: 'Active', priority: 'High' },
    { id: uid('a'), name: 'Google Ads Account', brand: 'Connecto', platform: 'Google Ads', status: 'Needs Review', priority: 'High' },
    { id: uid('a'), name: 'GA4 Property', brand: 'Holstein Housewares', platform: 'GA4', status: 'Needs Review', priority: 'High' },
    { id: uid('a'), name: 'GA4 Property', brand: 'Connecto', platform: 'GA4', status: 'Needs Review', priority: 'High' },
    { id: uid('a'), name: 'GA4 Property', brand: 'Alessa', platform: 'GA4', status: 'Inactive', priority: 'Medium' },
    { id: uid('a'), name: 'GTM Container', brand: 'Holstein Housewares', platform: 'Google Tag Manager', status: 'Needs Review', priority: 'High' },
    { id: uid('a'), name: 'GTM Container', brand: 'Connecto', platform: 'Google Tag Manager', status: 'Needs Review', priority: 'Medium' },
    { id: uid('a'), name: 'Search Console Property', brand: 'Holstein Housewares', platform: 'Search Console', status: 'Active', priority: 'Low' },
    { id: uid('a'), name: 'Search Console Property', brand: 'Connecto', platform: 'Search Console', status: 'Active', priority: 'Low' },
    { id: uid('a'), name: 'YouTube Channel', brand: 'Holstein Housewares', platform: 'YouTube', status: 'Active', priority: 'Medium' },
    { id: uid('a'), name: 'TikTok Business Account', brand: 'Holstein Housewares', platform: 'TikTok', status: 'Needs Review', priority: 'Medium' },
    { id: uid('a'), name: 'TikTok Business Account', brand: 'Connecto', platform: 'TikTok', status: 'Active', priority: 'Low' },
    { id: uid('a'), name: 'Pinterest Business Account', brand: 'Holstein Housewares', platform: 'Pinterest', status: 'Active', priority: 'Low' },
    { id: uid('a'), name: 'HubSpot CRM', brand: 'Distrivalto', platform: 'HubSpot', status: 'Needs Review', priority: 'High' },
    { id: uid('a'), name: 'Amazon Seller Central', brand: 'Holstein Housewares', platform: 'Amazon', status: 'Active', priority: 'Medium' },
    { id: uid('a'), name: 'Amazon Seller Central', brand: 'Connecto', platform: 'Amazon', status: 'Active', priority: 'Medium' },
    { id: uid('a'), name: 'Walmart Marketplace', brand: 'Holstein Housewares', platform: 'Walmart', status: 'Needs Review', priority: 'Medium' },
    { id: uid('a'), name: 'Website (Shopify)', brand: 'Holstein Housewares', platform: 'Website', status: 'Needs Review', priority: 'High' },
    { id: uid('a'), name: 'Website (Shopify)', brand: 'Connecto', platform: 'Website', status: 'Needs Review', priority: 'High' },
    { id: uid('a'), name: 'Website (Shopify)', brand: 'Alessa', platform: 'Website', status: 'Inactive', priority: 'Low' },
    { id: uid('a'), name: 'Looker Studio Dashboard', brand: 'Distrivalto', platform: 'Looker Studio', status: 'Active', priority: 'Medium' },
    { id: uid('a'), name: 'Bitwarden Vault', brand: 'Distrivalto', platform: 'Bitwarden', status: 'Needs Review', priority: 'High' },
  ];

  /* ------------------------------------------------------------------------
     ACTIVATION FRAMEWORK — seed data
     Tres catálogos por área (Digital, Trade, Brand), 4 Activation Packs que
     cruzan las tres áreas con notas explicativas, el Retailer Media Kit, y
     el Registro de Campañas (banco de campañas armadas con el builder).
     ------------------------------------------------------------------------ */

  // ---- Digital Activation Catalog ----
  // "Formato" es por fila (rowSelect), no una sola lista global de opciones:
  // cada acción tiene su propio menú de formatos válidos (Orgánico / Dark
  // Post / Pautado / Whitelisting, según aplique), en vez de tener filas
  // separadas para la misma acción orgánica vs. pautada.
  const DEFAULT_AF_CATALOG_COLUMNS = [
    { key: 'category', label: 'Categoría', type: 'text', core: true },
    { key: 'activation', label: 'Acción', type: 'text', core: true },
    { key: 'format', label: 'Formato', type: 'rowSelect', optionsKey: 'formatOptions', defaultOptions: ['Orgánico', 'Dark Post', 'Orgánico + Pauta'], core: true },
    { key: 'measurement', label: 'Cómo se mide', type: 'text', core: true },
  ];

  const DEFAULT_AF_CATALOG = [
    { category: 'Content & Social', activation: 'Post / Contenido Estático', formatOptions: ['Orgánico', 'Dark Post', 'Orgánico + Pauta'], format: 'Orgánico', measurement: 'Reach, engagement' },
    { category: 'Content & Social', activation: 'Short-form Video / Reel', formatOptions: ['Orgánico', 'Dark Post', 'Orgánico + Pauta'], format: 'Orgánico', measurement: 'Views, engagement' },
    { category: 'Content & Social', activation: 'Stories', formatOptions: ['Orgánico', 'Dark Post'], format: 'Orgánico', measurement: 'Views, taps' },
    { category: 'Content & Social', activation: 'Video UGC / Influencer Content', formatOptions: ['Orgánico', 'Whitelisting'], format: 'Orgánico', measurement: 'Engagement, saves' },
    { category: 'Content & Social', activation: 'Recipe / Use-Case Content', formatOptions: ['Orgánico', 'Dark Post'], format: 'Orgánico', measurement: 'Engagement, saves' },
    { category: 'Content & Social', activation: 'Product Education Content', formatOptions: ['Orgánico', 'Dark Post'], format: 'Orgánico', measurement: 'Engagement, retention' },
    { category: 'TikTok', activation: 'Video desde la página de la marca', formatOptions: ['Orgánico', 'Pautado'], format: 'Orgánico', measurement: 'Views, CTR' },
    { category: 'TikTok', activation: 'Video UGC / Influencer (Perfil del Creador)', formatOptions: ['Orgánico', 'Whitelisting'], format: 'Orgánico', measurement: 'Engagement, CTR' },
    { category: 'Paid Media', activation: 'Meta Ads (gestión de pauta)', formatOptions: ['Pautado'], format: 'Pautado', measurement: 'CPM, CTR, ROAS' },
    { category: 'Paid Media', activation: 'Google Display / YouTube', formatOptions: ['Pautado'], format: 'Pautado', measurement: 'Impressions, CTR' },
    { category: 'Paid Media', activation: 'Google Ads (Search / SEM)', formatOptions: ['Pautado'], format: 'Pautado', measurement: 'Clics, CPC, Conversiones' },
    { category: 'Email / CRM', activation: 'Newsletter Feature (HubSpot, lista propia)', formatOptions: ['Orgánico'], format: 'Orgánico', measurement: 'Open rate, CTR, revenue' },
    { category: 'Gestión de Campaña', activation: 'Campaign Reporting & Optimization', formatOptions: ['N/A'], format: 'N/A', measurement: 'KPIs vs objetivo' },
  ].map((r) => ({ id: uid('afc'), ...r }));

  // ---- Trade Marketing Catalog ----
  // Las 8 acciones que mandó Rodrigo Alvarado (Trade Marketing Specialist),
  // 19 ago 2026, para eventos no estacionales (aniversarios de retailer,
  // lanzamientos, campañas puntuales).
  const DEFAULT_AF_TRADE_COLUMNS = [
    { key: 'category', label: 'Categoría', type: 'text', core: true },
    { key: 'activation', label: 'Acción', type: 'text', core: true },
    { key: 'description', label: 'Descripción', type: 'text', core: true },
    { key: 'requiresBrand', label: 'Requiere Brand', type: 'select', options: ['Sí', 'No'], core: true },
    { key: 'measurement', label: 'Cómo se mide', type: 'text', core: true },
  ];

  const DEFAULT_AF_TRADE = [
    { category: 'Punto de Venta', activation: 'Activación básica en punto de venta', description: 'Impulsadora acompañada de banner, kiosco o módulo con exhibición de productos; explica características y beneficios al cliente.', requiresBrand: 'Sí', measurement: 'Interacciones, tráfico al exhibidor' },
    { category: 'Incentivos', activation: 'Regalo por compra', description: 'Por la compra de cualquier producto Holstein o de ciertos SKUs seleccionados, el cliente recibe merchandising (mandil, taza, etc.).', requiresBrand: 'Sí', measurement: 'Unidades canjeadas' },
    { category: 'Punto de Venta', activation: 'Demo show con degustación', description: 'Kiosco o módulo con impulsadora haciendo demostraciones de uso (air fryer, licuadora, máquina de cupcakes, waffles, etc.) e invitando a degustar.', requiresBrand: 'Sí', measurement: 'Muestras entregadas, conversión in-store' },
    { category: 'Material Visual', activation: 'Material POP', description: 'Glorificadores, stoppers, danglers, cenefas, habladores, adhesivos de piso y otros elementos, ideal para lanzamientos o campañas específicas.', requiresBrand: 'Sí', measurement: 'Piezas instaladas, visibilidad en tienda' },
    { category: 'Incentivos', activation: 'Ruleta regalona', description: 'Por la compra de un producto Holstein, el cliente participa en una ruleta donde todos ganan (de merchandising a pequeños electrodomésticos).', requiresBrand: 'Sí', measurement: 'Participaciones, canje de premios' },
    { category: 'Incentivos', activation: 'Memory Game', description: 'Dinámica de tablero de memoria; según cuántos intentos necesite el participante, gana premio principal, intermedio o de consuelo.', requiresBrand: 'Sí', measurement: 'Participaciones' },
    { category: 'Producto', activation: 'Combos o kits especiales', description: 'Paquetes de productos complementarios para la campaña (ej. air fryer con accesorios, cafetera con tazas de merchandising) con beneficio por compra conjunta.', requiresBrand: 'Sí', measurement: 'Unidades vendidas del combo' },
    { category: 'Equipo de Tienda', activation: 'Rally para vendedores del retailer', description: 'Metas de venta durante la campaña, premiando a los vendedores con mayor desempeño para que recomienden activamente los productos.', requiresBrand: 'No', measurement: 'Ventas del equipo, cumplimiento de meta' },
  ].map((r) => ({ id: uid('aft'), ...r }));

  // ---- Brand Catalog ----
  // Lo que Brand tiene que producir (los artes) para que cada acción de
  // Digital o Trade se pueda ejecutar. Si Digital dice "post con 3 artes
  // estáticos", Brand ya sabe exactamente qué le toca hacer.
  const DEFAULT_AF_BRAND_COLUMNS = [
    { key: 'category', label: 'Categoría', type: 'text', core: true },
    { key: 'deliverable', label: 'Entregable', type: 'text', core: true },
    { key: 'spec', label: 'Especificación', type: 'text', core: true },
    { key: 'usedFor', label: 'Se usa en', type: 'text', core: true },
  ];

  const DEFAULT_AF_BRAND = [
    { category: 'Redes Sociales', deliverable: 'Set de artes estáticos', spec: '1 a 3 artes, formato cuadrado o vertical según plataforma', usedFor: 'Post / Contenido Estático (Digital)' },
    { category: 'Redes Sociales', deliverable: 'Carrusel', spec: 'Secuencia de 3 a 5 slides con narrativa', usedFor: 'Post / Contenido Estático (Digital)' },
    { category: 'Redes Sociales', deliverable: 'Video corto / Reel edit', spec: 'Edición de 15 a 30 segundos, con o sin voz en off', usedFor: 'Short-form Video / Reel (Digital)' },
    { category: 'Redes Sociales', deliverable: 'Cover / miniatura para video', spec: 'Portada o miniatura para TikTok/Reel', usedFor: 'TikTok, Short-form Video (Digital)' },
    { category: 'Retail Media', deliverable: 'Banner (Homepage / Category)', spec: 'Medidas según especificación de cada retailer', usedFor: 'Media Kit' },
    { category: 'Retail Media', deliverable: 'Arte para Newsletter', spec: 'Adaptado al template del retailer o al de HubSpot', usedFor: 'Newsletter Feature (Digital), Media Kit' },
    { category: 'Trade / Punto de Venta', deliverable: 'Diseño de material POP', spec: 'Glorificadores, stoppers, danglers, cenefas, habladores, adhesivos de piso', usedFor: 'Material POP (Trade)' },
    { category: 'Trade / Punto de Venta', deliverable: 'Mockup de kiosco / módulo', spec: 'Diseño de la ambientación del punto de venta', usedFor: 'Activación básica, Demo show (Trade)' },
    { category: 'Trade / Punto de Venta', deliverable: 'Diseño de merchandising', spec: 'Mandil, taza u otro artículo de regalo', usedFor: 'Regalo por compra (Trade)' },
    { category: 'Trade / Punto de Venta', deliverable: 'Arte de dinámica (ruleta / memory game)', spec: 'Diseño del tablero, ruleta y piezas de premio', usedFor: 'Ruleta regalona, Memory Game (Trade)' },
    { category: 'Estrategia', deliverable: 'Desarrollo de Concepto Creativo', spec: 'Concepto y narrativa de campaña, aprobado antes de producción', usedFor: 'Toda la campaña' },
    { category: 'Estrategia', deliverable: 'Content Calendar & Producción de Assets', spec: 'Calendario de contenidos y coordinación de producción de todos los artes', usedFor: 'Toda la campaña' },
  ].map((r) => ({ id: uid('afb'), ...r }));

  // ---- Activation Packs ----
  // Cada pack cruza Brand + Digital + Trade + una sugerencia de Media Kit,
  // con una nota corta por item para que no haya que preguntar qué incluye.
  // El campaign builder usa "activation" para pre-marcar los checkboxes de
  // cada catálogo cuando se elige el pack, y "format" para pre-llenar el
  // Formato de las filas de Digital que lo tengan.
  const RAW_AF_PACKS = [
    {
      name: 'LAUNCH PACK',
      useCase: 'Lanzamiento de producto o SKU nuevo',
      brand: [
        { activation: 'Desarrollo de Concepto Creativo', note: 'define la idea y el mensaje central del lanzamiento' },
        { activation: 'Set de artes estáticos', note: 'piezas para el post de presentación' },
        { activation: 'Video corto / Reel edit', note: 'video del producto en uso' },
      ],
      digital: [
        { activation: 'Short-form Video / Reel', format: 'Orgánico + Pauta', note: 'presenta el producto al mercado' },
        { activation: 'Video UGC / Influencer Content', format: 'Whitelisting', note: 'voces externas que le dan credibilidad' },
        { activation: 'Meta Ads (gestión de pauta)', format: 'Pautado', note: 'enfoque Awareness' },
        { activation: 'Product Education Content', format: 'Orgánico', note: 'explica cómo se usa' },
      ],
      trade: [
        { activation: 'Demo show con degustación', note: 'deja probar el producto directo en tienda' },
      ],
      mediaKitSuggestion: 'Product Listing Enhancement — mejora cómo se ve el producto nuevo en la ficha del retailer',
    },
    {
      name: 'SEASONAL PACK',
      useCase: 'Fechas comerciales y temporadas (Heritage Month, Halloween, Black Friday, Christmas)',
      brand: [
        { activation: 'Desarrollo de Concepto Creativo', note: 'adaptado a la fecha o temporada' },
        { activation: 'Set de artes estáticos', note: 'con la temática de la fecha' },
        { activation: 'Carrusel', note: 'narrativa de temporada en varios slides' },
      ],
      digital: [
        { activation: 'Short-form Video / Reel', format: 'Dark Post', note: 'video temático amplificado con pauta' },
        { activation: 'Post / Contenido Estático', format: 'Orgánico + Pauta', note: 'presencia constante durante la fecha' },
        { activation: 'Video UGC / Influencer Content', format: 'Whitelisting', note: 'invitación activa a creadores para dar prueba social y alcance incremental durante la fecha' },
        { activation: 'Meta Ads (gestión de pauta)', format: 'Pautado', note: 'Awareness + Conversion durante la ventana de la campaña' },
        { activation: 'Google Display / YouTube', format: 'Pautado', note: 'refuerza video y estáticos en awareness fuera de redes sociales' },
        { activation: 'Google Ads (Search / SEM)', format: 'Pautado', note: 'captura búsqueda de alta intención durante la ventana de la campaña' },
      ],
      trade: [
        { activation: 'Material POP', note: 'ambienta el punto de venta para la fecha' },
        { activation: 'Ruleta regalona', note: 'dinámica que atrae tráfico al punto de venta' },
      ],
      mediaKitSuggestion: 'Homepage Banner o Category Banner — visibilidad del retailer durante la fecha',
    },
    {
      name: 'CONVERSION PACK',
      useCase: 'Empujar venta directa en un retailer específico',
      brand: [
        { activation: 'Set de artes estáticos', note: 'piezas de venta directa (precio, oferta, CTA)' },
      ],
      digital: [
        { activation: 'Post / Contenido Estático', format: 'Dark Post', note: 'pauta directa a conversión' },
        { activation: 'Meta Ads (gestión de pauta)', format: 'Pautado', note: 'enfoque Traffic/Conversion' },
      ],
      trade: [
        { activation: 'Combos o kits especiales', note: 'empuja el ticket promedio' },
        { activation: 'Rally para vendedores del retailer', note: 'el equipo de tienda recomienda activamente el producto' },
      ],
      mediaKitSuggestion: 'Sponsored Search / Product Placement + Category Banner — visibilidad en el momento de compra',
    },
    {
      name: 'FULL CAMPAIGN PACK (360)',
      useCase: 'Campañas grandes, multi-canal, multi-retailer',
      brand: [
        { activation: 'Desarrollo de Concepto Creativo', note: 'concepto único para todos los canales' },
        { activation: 'Set de artes estáticos', note: '' },
        { activation: 'Carrusel', note: '' },
        { activation: 'Video corto / Reel edit', note: '' },
      ],
      digital: [
        { activation: 'Meta Ads (gestión de pauta)', format: 'Pautado', note: 'Awareness + Conversion' },
        { activation: 'Short-form Video / Reel', format: 'Orgánico + Pauta', note: '' },
        { activation: 'Video UGC / Influencer Content', format: 'Whitelisting', note: '' },
        { activation: 'Video desde la página de la marca', format: 'Pautado', note: 'TikTok de marca' },
        { activation: 'Newsletter Feature (HubSpot, lista propia)', format: 'Orgánico', note: '' },
      ],
      trade: [
        { activation: 'Activación básica en punto de venta', note: '' },
        { activation: 'Material POP', note: '' },
        { activation: 'Rally para vendedores del retailer', note: '' },
      ],
      mediaKitSuggestion: 'Homepage Banner + Category Banner + Sponsored Search + Newsletter Placement del retailer',
    },
  ];

  // Cada pack e item de pack necesita un id estable (para poder editar y
  // borrar desde la UI); los datos de arriba no lo tienen a mano porque son
  // más fáciles de leer sin ids de por medio, así que se agregan aquí.
  const DEFAULT_AF_PACKS = RAW_AF_PACKS.map((p) => ({
    id: uid('pack'),
    name: p.name,
    useCase: p.useCase,
    brand: (p.brand || []).map((it) => ({ id: uid('pit'), ...it })),
    digital: (p.digital || []).map((it) => ({ id: uid('pit'), ...it })),
    trade: (p.trade || []).map((it) => ({ id: uid('pit'), ...it })),
    mediaKitSuggestion: p.mediaKitSuggestion || '',
  }));

  // ---- Retailer Media Kit ----
  const DEFAULT_AF_MEDIAKIT_COLUMNS = [
    { key: 'country', label: 'País', type: 'text', core: true },
    { key: 'retailer', label: 'Retailer', type: 'text', core: true },
    { key: 'inventory', label: 'Tipo de inventario', type: 'text', core: true },
    { key: 'negotiability', label: 'Negociabilidad', type: 'select', options: ['Pendiente', 'Se puede solicitar', 'Negociable', 'Pago'], core: true },
    { key: 'lastUpdated', label: 'Última actualización', type: 'text', core: true },
  ];

  const DEFAULT_AF_MEDIAKIT = [
    { country: 'Ecuador', retailer: 'Tipti', inventory: 'Pendiente de confirmar con el retailer', negotiability: 'Pendiente', lastUpdated: 'Pendiente' },
    { country: 'Ecuador', retailer: 'MG3 / La Favorita', inventory: 'Pendiente de confirmar con el retailer', negotiability: 'Pendiente', lastUpdated: 'Pendiente' },
    { country: 'Rep. Dominicana', retailer: 'Grupo CCN / Jumbo / Casa Cuesta', inventory: 'Pendiente de confirmar con el retailer', negotiability: 'Pendiente', lastUpdated: 'Pendiente' },
    { country: 'Colombia', retailer: 'Falabella', inventory: 'Pendiente de confirmar con el retailer', negotiability: 'Pendiente', lastUpdated: 'Pendiente' },
    { country: 'Perú', retailer: 'Promart', inventory: 'Pendiente de confirmar con el retailer', negotiability: 'Pendiente', lastUpdated: 'Pendiente' },
    { country: 'USA', retailer: 'Walmart', inventory: 'Confirmado: Sales Rewards & Attribution (referral links)', negotiability: 'Se puede solicitar', lastUpdated: 'Ago 2026' },
    { country: 'USA', retailer: 'Amazon', inventory: 'Confirmado: Amazon Attribution', negotiability: 'Se puede solicitar', lastUpdated: 'Ago 2026' },
  ].map((r) => ({ id: uid('afm'), ...r }));

  // ---- Registro de Campañas ----
  // El banco de todas las campañas armadas con el builder: nombre, país,
  // retailer, pack o mix personalizado, qué se eligió de Digital/Trade/
  // Brand, qué se pidió del Media Kit y en qué quedó, observaciones finales
  // y el estado (Pending/Approved/Proposal). Arranca vacío, nada inventado.
  const AF_CAMPAIGN_STATUS_COLOR = { Pending: 'var(--amber)', Approved: 'var(--green)', Proposal: 'var(--blue)' };
  const AF_MEDIAKIT_SOURCE_OPTIONS = ['Negociar con retailer', 'Entra desde retailer', 'Pagamos nosotros'];
  const DEFAULT_AF_CAMPAIGNS = [];

  const DEFAULT_QUICK_WINS = [
    // ---- Done, ya entregado ----
    { id: uid('qw'), title: 'Back to School USA, estrategia final + calendario real + guía Meta/TikTok Ads paso a paso', platform: 'Back to School', priority: 'High', status: 'done', dueDate: '' },
    { id: uid('qw'), title: 'Mega Promo Ecuador, estrategia digital completa + presupuesto $21,000 confirmado', platform: 'Mega Promo', priority: 'High', status: 'done', dueDate: '' },
    { id: uid('qw'), title: 'CCN República Dominicana, estrategia digital completa (Holstein RD + Connecto)', platform: 'CCN RD', priority: 'High', status: 'done', dueDate: '' },
    { id: uid('qw'), title: 'KPIs & OKRs H2 2026, versión final acordada con Marketing Manager + KR1 aprobado', platform: 'KR1', priority: 'High', status: 'done', dueDate: '' },
    { id: uid('qw'), title: 'TikTok Consultoras Belcorp, propuesta final + guía de ejecución + presentaciones', platform: 'Belcorp', priority: 'Medium', status: 'done', dueDate: '' },
    { id: uid('qw'), title: 'Auditoría y Optimización Web, estrategia por etapas (SEO técnico, AEO, GEO)', platform: 'Web Audit', priority: 'Medium', status: 'done', dueDate: '' },
    { id: uid('qw'), title: 'LinkedIn B2B, Banco de Temas #1 corregido y aprobado (9 posts listos para publicar)', platform: 'LinkedIn B2B', priority: 'Medium', status: 'done', dueDate: '' },
    { id: uid('qw'), title: 'Estrategia y Guideline de RRSS, orden Holstein > Connecto > Alessa', platform: 'RRSS', priority: 'Medium', status: 'done', dueDate: '' },
    { id: uid('qw'), title: 'Content Calendar del HUB, con filtro por campaña y estado de publicado', platform: 'KR1', priority: 'Medium', status: 'done', dueDate: '' },
    { id: uid('qw'), title: 'Estándar único de estructura de proyectos en Asana, aplicado a 3 proyectos', platform: 'KR1', priority: 'Low', status: 'done', dueDate: '' },
    { id: uid('qw'), title: 'Diagnóstico del Ecosistema Digital, Holstein completo (redes, Meta Ads, Google Ads, SEO)', platform: 'Diagnóstico', priority: 'Medium', status: 'done', dueDate: '' },

    // ---- Doing, en curso ahora ----
    { id: uid('qw'), title: 'Lanzamiento de pauta Meta/TikTok, Back to School USA', platform: 'Back to School', priority: 'High', status: 'doing', dueDate: '2026-08-10' },
    { id: uid('qw'), title: 'Brand produciendo las 8 piezas de Back to School (KV, spotlights, carrusel)', platform: 'Back to School', priority: 'High', status: 'doing', dueDate: '' },
    { id: uid('qw'), title: 'Gestionar acceso a Google Ads (bloqueante crítico)', platform: 'Governance', priority: 'High', status: 'doing', dueDate: '' },
    { id: uid('qw'), title: 'Corregir 3 anuncios con error en Meta Ads Manager', platform: 'Governance', priority: 'Medium', status: 'doing', dueDate: '' },
    { id: uid('qw'), title: 'Banco de Temas para Carolina, LinkedIn B2B', platform: 'LinkedIn B2B', priority: 'Medium', status: 'doing', dueDate: '' },
    { id: uid('qw'), title: 'Primer video UGC de Connecto, diferenciador del ventilador bladeless', platform: 'RRSS', priority: 'Medium', status: 'doing', dueDate: '' },
    { id: uid('qw'), title: 'Auditoría de Connecto (redes y Meta Ads), mismo formato que Holstein', platform: 'Diagnóstico', priority: 'Medium', status: 'doing', dueDate: '' },
    { id: uid('qw'), title: 'Solicitar Media Kit a CCN y definir SKUs PRO prioritarios', platform: 'CCN RD', priority: 'Medium', status: 'doing', dueDate: '' },

    // ---- Backlog, siguiente ----
    { id: uid('qw'), title: 'Mega Promo, permiso de sorteo (Ministerio de Gobierno), bloqueante de fecha', platform: 'Mega Promo', priority: 'High', status: 'backlog', dueDate: '' },
    { id: uid('qw'), title: 'Mega Promo, negociación con el retailer + traspaso de contenido a Brand', platform: 'Mega Promo', priority: 'Medium', status: 'backlog', dueDate: '' },
    { id: uid('qw'), title: 'Presentar y aprobar la propuesta de Belcorp', platform: 'Belcorp', priority: 'Medium', status: 'backlog', dueDate: '' },
    { id: uid('qw'), title: 'Aprobar Estrategia Web y coordinar con Retail la redirección geolocalizada', platform: 'Web Audit', priority: 'Medium', status: 'backlog', dueDate: '' },
    { id: uid('qw'), title: 'Heritage Month (EEUU, septiembre), campaña piloto', platform: 'KR2', priority: 'Medium', status: 'backlog', dueDate: '' },
    { id: uid('qw'), title: 'Budget Tracker real en el HUB, presupuesto aprobado vs. ejecutado', platform: 'KR1', priority: 'Medium', status: 'backlog', dueDate: '' },
    { id: uid('qw'), title: 'Reporte estándar de campaña con revisión post-campaign', platform: 'KR1', priority: 'Medium', status: 'backlog', dueDate: '' },
    { id: uid('qw'), title: 'BFCM y Navidad por país, Q4 2026', platform: 'KR2', priority: 'Low', status: 'backlog', dueDate: '' },
    { id: uid('qw'), title: 'HUB v2 y Roadmap Digital 2027, para aprobación', platform: 'KR1', priority: 'Low', status: 'backlog', dueDate: '' },
  ];

  const QW_PROJECT_TAGS = ['Back to School', 'Mega Promo', 'CCN RD', 'Belcorp', 'Web Audit', 'LinkedIn B2B', 'RRSS', 'Diagnóstico', 'Governance', 'KR1', 'KR2'];

  const ROADMAP_STAGES = [
    { title: 'Foundation', status: 'done', desc: 'Governance model defined and agreed with leadership — roles, ownership, and access principles established.' },
    { title: 'Inventory', status: 'done', desc: 'Full inventory of digital assets across Holstein Housewares, Connecto, and Alessa completed.' },
    { title: 'Governance', status: 'current', desc: 'Access matrix implemented across all platforms — realigning Full Administrator access for Marketing Manager and Digital Marketing Specialist.' },
    { title: 'Audit', status: 'current', desc: 'Platform-by-platform audit in progress — tracking validation, 2FA enforcement, and access cleanup.' },
    { title: 'Quick Wins', status: 'upcoming', desc: 'Execute the highest-impact, lowest-effort fixes identified during the audit.' },
    { title: 'Execution', status: 'upcoming', desc: 'Full governance playbook in place — ongoing reporting, audits, and scale-ready processes.' },
  ];

  const DEFAULT_TEAM = [
    { id: 'tm_bo', name: 'Business Owner', role: 'Strategic Ownership · Full Administrator' },
    { id: 'tm_mm', name: 'Michelle', role: 'Marketing Manager · Full Administrator' },
    { id: 'tm_dms', name: 'Claudio Mendoza', role: 'Digital Marketing Specialist · Full Administrator' },
    { id: 'tm_contrib', name: 'Contributors', role: 'Scoped execution access' },
  ];

  const DEFAULT_USER_PROFILE = { name: 'Claudio Mendoza', role: 'Digital Marketing Specialist' };

  const TASK_PHASES = ['30 days', '60 days', '90 days'];

  const DEFAULT_TASKS = [
    { id: uid('t'), phase: '30 days', title: 'Diagnóstico del ecosistema digital actual', desc: 'Redes sociales, web, pauta activa/histórica, Amazon/ecommerce USA, ecommerce de retailers, email, SEO/AEO y herramientas de medición.', done: false },
    { id: uid('t'), phase: '30 days', title: 'Mapeo de canales, responsables y procesos actuales', desc: 'Qué canales existen, quién los gestiona, qué acciones están activas.', done: false },
    { id: uid('t'), phase: '30 days', title: 'Auditoría básica de medición y tracking', desc: 'UTMs, píxeles, eventos, conversiones, GA4, GTM, HubSpot/CRM.', done: false },
    { id: uid('t'), phase: '30 days', title: 'Definición de KPIs prioritarios por objetivo', desc: 'Awareness, tráfico, engagement, leads/conversión, ecommerce, eficiencia de pauta.', done: false },
    { id: uid('t'), phase: '30 days', title: 'Estructura inicial de reporting', desc: 'Reporte semanal operativo y reporte mensual ejecutivo.', done: false },
    { id: uid('t'), phase: '30 days', title: 'Plan de trabajo 30-60-90 días validado', desc: 'Hoja de ruta con prioridades, quick wins, responsables y dependencias.', done: true },
    { id: uid('t'), phase: '30 days', title: 'Quick wins digitales', desc: 'Mejoras inmediatas en web, contenido, pauta, UTMs, reportes.', done: false },
    { id: uid('t'), phase: '30 days', title: 'Modelo de coordinación interna', desc: 'Con ECOMM USA, Retail, Brand y Diseñadora.', done: false },
    { id: uid('t'), phase: '60 days', title: 'Implementación del sistema básico de tracking', desc: 'UTMs, estructura de campañas, eventos y conversiones.', done: false },
    { id: uid('t'), phase: '60 days', title: 'Dashboard inicial de performance digital', desc: 'KPIs principales por canal.', done: false },
    { id: uid('t'), phase: '60 days', title: 'Primer ciclo de campañas o activaciones optimizadas', desc: 'Awareness, tráfico calificado, engagement, leads.', done: false },
    { id: uid('t'), phase: '60 days', title: 'Calendario digital inicial', desc: 'Alineado al marketing plan y prioridades por mercado.', done: false },
    { id: uid('t'), phase: '60 days', title: 'Coordinación activa con ECOMM USA', desc: 'Seguimiento de campañas y performance en Amazon/ecommerce USA.', done: false },
    { id: uid('t'), phase: '60 days', title: 'Coordinación con Retail y clientes', desc: 'Acciones comprometidas en el marketing plan.', done: false },
    { id: uid('t'), phase: '60 days', title: 'Coordinación con Brand y Diseñadora', desc: 'Materiales digitales para campañas y ecommerce.', done: false },
    { id: uid('t'), phase: '60 days', title: 'Primeras mejoras en web o landing pages', desc: 'CTAs, rutas de contacto, SEO básico, UX.', done: false },
    { id: uid('t'), phase: '60 days', title: 'Reporte mensual ejecutivo #1', desc: 'Resultados, aprendizajes, riesgos y decisiones recomendadas.', done: false },
    { id: uid('t'), phase: '60 days', title: 'Primeras pruebas de workflows con IA', desc: 'Acelerar reporting, análisis, contenido o productividad.', done: false },
    { id: uid('t'), phase: '90 days', title: 'Ecosistema digital ordenado y documentado', desc: 'Procesos de brief, ejecución, seguimiento, optimización, reporting.', done: false },
    { id: uid('t'), phase: '90 days', title: 'Dashboard consolidado de resultados', desc: 'Performance por canal, campaña, objetivo y fuente de tráfico.', done: false },
    { id: uid('t'), phase: '90 days', title: 'Reporte ejecutivo de 90 días', desc: 'Resultados, aprendizajes, oportunidades, riesgos y recomendaciones.', done: false },
    { id: uid('t'), phase: '90 days', title: 'Plan de optimización digital para el siguiente trimestre', desc: 'Roadmap por área de inversión.', done: false },
    { id: uid('t'), phase: '90 days', title: 'Propuesta de mejora del funnel digital', desc: 'Awareness, tráfico calificado, conversión, calidad de datos.', done: false },
    { id: uid('t'), phase: '90 days', title: 'Evaluación de campañas y acciones digitales implementadas', desc: 'Cumplimiento, resultados, aprendizajes por canal.', done: false },
    { id: uid('t'), phase: '90 days', title: 'Estandarización de reportes y KPIs', desc: 'Modelo fijo para reportes mensuales y seguimiento semanal.', done: false },
    { id: uid('t'), phase: '90 days', title: 'Recomendaciones de inversión y priorización', desc: 'Dónde invertir, escalar, optimizar o detener.', done: false },
    { id: uid('t'), phase: '90 days', title: 'Flujo de trabajo interno consolidado', desc: 'Solicitud, producción, aprobación de materiales digitales.', done: false },
  ];

  const DEFAULT_KPIS = [
    {
      id: uid('kpi'), name: 'KPI 1 — On-Time Campaign Execution',
      desc: 'Cumplir al menos 90% de entrega a tiempo de las campañas e iniciativas de Digital Marketing aprobadas.',
      bullets: [
        'Cumplimiento de fechas aprobadas.',
        'Coordinación oportuna con Brand, Design, Content, Ecommerce y las unidades de negocio.',
        'Capacidad de gestionar la campaña de principio a fin, del brief al lanzamiento.',
      ],
      note: 'Solo cuentan iniciativas con brief completo, aprobaciones y recursos disponibles.',
    },
    {
      id: uid('kpi'), name: 'KPI 2 — Campaign Measurement Compliance',
      desc: 'Asegurar que al menos el 90% de las campañas pagadas se lancen con tracking aprobado, control de presupuesto, KPIs definidos y reporte post-campaña, siguiendo un proceso estandarizado de medición.',
      bullets: [
        'Tracking configurado antes del lanzamiento.',
        'Presupuesto aprobado y controlado.',
        'KPIs definidos según el objetivo de campaña.',
        'Reporte y aprendizajes documentados después de cada campaña.',
        'Proceso estandarizado de medición aplicado de forma consistente en al menos 9 de cada 10 campañas pagadas.',
      ],
      note: 'Este KPI pesa más que fijar un CTR, CPC o ROAS específico, porque en H2 todavía se construyen los benchmarks propios.',
    },
  ];

  const DEFAULT_OBJECTIVE = {
    title: 'Construir y validar un sistema operativo de Digital Marketing medible que impulse brand awareness, tráfico calificado y conversión a través de retail y ecommerce partners.',
    q3Label: 'Q3 2026 — Establecer la base',
    q4Label: 'Q4 2026 — Optimizar y proyectar',
  };

  const DEFAULT_KEY_RESULTS = [
    {
      id: uid('kr'), quarter: 'Q3', done: false,
      title: 'Sistema Operativo de Digital Marketing (HUB v1)',
      desc: 'Implementar en versión inicial el Digital Marketing HUB — workflows, herramientas de planificación, briefs, procesos de aprobación, control de presupuesto, estándares de tracking, definición de KPIs y templates de reporting — construido sobre este mismo HUB y la gobernanza ya definidos. Esta primera versión es también el punto de partida para estandarizar el proceso de briefing, y queda lista para optimizarse en Q4.',
      sections: [
        { heading: 'Entregables', items: [
          'Un playbook de campaña único: flujo de trabajo (solicitud → reporte), roles y responsabilidades, brief estándar, campaign calendar, naming conventions, UTM standards y pre-launch checklist.',
          'Un budget tracker con los KPIs definidos.',
          'Un reporte estándar de campaña con la revisión post-campaign incluida.',
        ]},
        { heading: 'Iniciativas principales', items: [
          'Diagnóstico del Ecosistema Digital. Auditar plataformas, accesos y fuentes de información.',
          'Mapear el flujo de trabajo con Brand, Trade Marketing, Diseño, Ecommerce USA, Retail USA, Retail LATAM y volcarlo directo en el Playbook de campaña.',
          'Construir los 3 documentos base: Playbook, Budget Tracker y Template de Reporte, y organizar el calendario e iniciativas en Asana, reflejado en el HUB.',
          'Poner en marcha 1 workflow con IA que reduzca el tiempo de producción de reportes o briefs, midiendo horas ahorradas al mes.',
        ]},
      ],
    },
    {
      id: uid('kr'), quarter: 'Q3', done: false,
      title: 'Campañas Piloto Medibles — 3 activaciones',
      desc: 'Se activan 3 campañas digitales en Q3: Back to School (EEUU) — agosto, Heritage Month (EEUU) — septiembre, y La Mega Promo (Ecuador) — septiembre. Cada una segmentada a su público específico, con objetivo, canal, presupuesto y KPIs propios definidos en el brief antes del lanzamiento.',
      sections: [
        { heading: 'Entregables', items: [
          'Cada una de las 3 campañas activada y lanzada en su fecha.',
          'Brief de campaña (objetivo, audiencia, producto, canal, KPIs) por cada campaña.',
          'Presupuesto aprobado por campaña.',
          'Estrategia digital / plan de activación por campaña.',
          'Reporte post-campaña por campaña.',
        ]},
        { heading: 'Objetivos y canales', items: [
          'Objetivos: brand awareness, tráfico calificado, engagement.',
          'Canales: mezcla a definir por campaña — Facebook, Instagram, Meta Ads, TikTok, Pinterest, Google Ads.',
          'KPIs por campaña según su objetivo — ver guía de métricas por objetivo.',
        ]},
        { heading: 'Iniciativas comunes a los 3 pilotos', items: [
          'Validar con Retail/Ecommerce y coordinar assets con Brand antes del lanzamiento.',
          'Configurar tracking desde el día uno.',
          'Revisión semanal y reporte post-campaña, que sirve de baseline para Q4.',
        ]},
      ],
    },
    {
      id: uid('kr'), quarter: 'Q4', done: false,
      title: 'Optimización de Campañas y del Ecosistema Web',
      desc: 'Dos frentes del mismo objetivo: mejorar la performance de pauta con datos reales de Q3, y resolver el problema estructural del sitio dado que no es ecommerce y no tiene ninguna ruta de conversión.',
      sections: [
        { heading: 'A · Optimización de Campañas', items: [
          'Mejorar al menos 2 métricas prioritarias frente al baseline de los pilotos de Q3.',
          'Entregables: reporte y análisis de las primeras 3 campañas piloto (Back to School, Heritage Month, La Mega Promo); estrategia y campañas de Black Friday, Cyber Monday y Navidad por país, incluyendo posible campaña en R.D. para el Día WOW.',
          'Posibles métricas (se eligen 2 antes de lanzar Q4): CTR, CPC, costo por vista de landing page, engagement rate, video completion rate, conversion rate, CPA, ROAS (cuando exista atribución de ventas).',
          'Analizar los resultados de los 3 pilotos de Q3.',
          'Elegir las 2 métricas prioritarias y definir baseline y meta.',
          'Desarrollar la estrategia digital de Black Friday, Cyber Monday y Navidad por país, siguiendo el calendario retail LATAM ya mapeado.',
          'Probar audiencias, mensajes, formatos y placements.',
          'Revisión semanal de desempeño y reasignación de presupuesto según performance.',
          'Documentar optimizaciones y aprendizajes; presentar resultados y recomendaciones.',
        ]},
        { heading: 'B · Auditoría y Optimización Web — SEO, GEO y AEO', items: [
          'Entregables: redirección geolocalizada implementada en holsteinhousewares.com (extensible a Connecto); auditoría técnica documentada (Core Web Vitals, velocidad de carga, mobile-friendliness); contenido optimizado para SEO y AEO/GEO (keywords, Schema markup, FAQs y comparativas).',
          'Implementar redirección geolocalizada en holsteinhousewares.com (extensible a Connecto): según el país del visitante, mostrar el retailer, ecommerce o tienda física más cercana para comprar — Amazon/Walmart en EEUU, el retailer local en México, Colombia, R.D., Ecuador, Bolivia y Perú.',
          'Auditar Core Web Vitals, velocidad de carga y mobile-friendliness del sitio.',
          'Optimizar estructura de keywords, Schema markup y contenido de respuesta directa (FAQs, comparativas) para SEO tradicional y AEO/GEO.',
        ]},
      ],
      impact: 'El sitio deja de ser un callejón sin salida: toda visita con intención de compra tiene una ruta clara a conversión, y la marca empieza a ganar visibilidad donde hoy realmente se busca — Google y los motores de IA.',
    },
    {
      id: uid('kr'), quarter: 'Q4', done: false,
      title: 'Evolución del HUB (v2) y Roadmap Digital 2027',
      desc: 'Optimizar y completar el HUB de Digital Marketing a una segunda versión con base en el uso real de Q3, y construir sobre esos datos el Roadmap de Digital Marketing 2027 para su aprobación.',
      sections: [
        { heading: 'Entregables', items: [
          'HUB de Digital Marketing v2, con mejoras documentadas sobre el uso real de Q3.',
          'Roadmap Digital 2027 presentado para aprobación.',
        ]},
        { heading: 'Iniciativas principales', items: [
          'Consolidar resultados de Q3 y Q4; identificar mejores canales, campañas, formatos y audiencias.',
          'Refinar el HUB (Dashboard, Access Matrix, Platform Audit, Quick Wins, Reporting) con lo aprendido.',
          'Definir prioridades del roadmap por mercado y unidad de negocio.',
          'Estimar escenarios de inversión y requerimientos de tracking, contenido y recursos.',
          'Integrar el roadmap al Marketing Plan 2027 y presentar la recomendación para su aprobación.',
        ]},
      ],
    },
  ];

  const DEFAULT_PROJECTS = [
    {
      id: uid('proj'),
      name: 'Digital Marketing Governance',
      tags: ['Governance'],
      description: 'Modelo de gobernanza de accesos y activos digitales para Holstein, Connecto y Alessa — quién tiene acceso a qué plataforma, con qué rol, y cómo se audita y mantiene con el tiempo.',
      objective: 'Que la Marketing Manager apruebe un modelo claro y documentado de gobernanza de accesos, implementado y auditable en el Access Matrix del HUB.',
      result: 'Modelo de gobernanza aprobado por Michelle y adoptado como estándar para todas las cuentas y plataformas de las tres marcas.',
      deliverable: 'Presentación ejecutiva + guion de presentación + Access Matrix y Platform Audit cargados y mantenidos en el HUB.',
      tasks: [
        {
          id: uid('pt'), title: 'Diseñar la presentación ejecutiva de gobernanza', done: true,
          subtasks: [
            { id: uid('pst'), title: 'Definir las 9 secciones y su estructura', done: true },
            { id: uid('pst'), title: 'Aplicar branding Distrivalto (navy / blue, tipografía)', done: true },
            { id: uid('pst'), title: 'Dejar lista para publicar en GitHub Pages', done: true },
          ],
        },
        {
          id: uid('pt'), title: 'Redactar el guion de presentación para Michelle', done: true,
          subtasks: [
            { id: uid('pst'), title: 'Script literal en español para leer en voz alta', done: true },
            { id: uid('pst'), title: 'Anexo de FAQ separado', done: true },
          ],
        },
        { id: uid('pt'), title: 'Redactar el correo de invitación a la reunión', done: true, subtasks: [] },
        {
          id: uid('pt'), title: 'Definir el modelo de gobernanza (roles y niveles de acceso)', done: true,
          subtasks: [
            { id: uid('pst'), title: 'Mapear la cadena Business Owner → Marketing Manager → DMS → Contributors', done: true },
            { id: uid('pst'), title: 'Definir los 4 niveles de acceso: None / Viewer / Editor / Full Admin', done: true },
          ],
        },
        {
          id: uid('pt'), title: 'Levantar el Access Matrix real por plataforma', done: false,
          subtasks: [
            { id: uid('pst'), title: 'Completar accesos reales para las 14 plataformas actuales', done: false },
            { id: uid('pst'), title: 'Confirmar Full Admin de Michelle y Claudio en cada una', done: false },
            { id: uid('pst'), title: 'Migrar credenciales pendientes a Bitwarden', done: false },
          ],
        },
        {
          id: uid('pt'), title: 'Presentar el modelo a Michelle', done: false,
          subtasks: [
            { id: uid('pst'), title: 'Agendar la reunión', done: false },
            { id: uid('pst'), title: 'Presentar y resolver dudas', done: false },
            { id: uid('pst'), title: 'Registrar feedback en Meeting Notes', done: false },
          ],
        },
        { id: uid('pt'), title: 'Obtener aprobación formal del modelo de gobernanza', done: false, subtasks: [] },
        {
          id: uid('pt'), title: 'Ejecutar los quick wins identificados en la auditoría', done: false,
          subtasks: [
            { id: uid('pst'), title: 'Revocar acceso a GTM del freelancer anterior', done: false },
            { id: uid('pst'), title: 'Consolidar los Business Managers de Meta', done: false },
            { id: uid('pst'), title: 'Forzar 2FA en el login de Walmart Marketplace', done: false },
          ],
        },
      ],
    },
    {
      id: uid('proj'),
      name: 'KR1 — Sistema Operativo de Digital Marketing (HUB v1)',
      tags: ['KR1', 'HUB'],
      description: 'Los 6 frentes reales del KR1 de Q3 (recién aprobados en Asana), ordenados por dependencia y urgencia: primero lo que bloquea o alimenta a los demás y lo que hace falta antes de que arranquen los pilotos de agosto; al final lo que se formaliza mejor una vez que ya hay datos reales corriendo.',
      objective: 'Tener el HUB v1 funcionando de verdad: ecosistema auditado, playbook único, budget tracker real, reporting estándar, calendario sincronizado con Asana y un workflow de IA con horas ahorradas medidas.',
      result: 'HUB v1 completo y en uso real durante los 3 pilotos de Q3, y listo como base documentada para evolucionar a v2 en Q4.',
      deliverable: 'Ecosystem Assessment completo, Campaign Playbook, Budget Tracker, Reporting Template, calendario Asana↔HUB sincronizado y 1 workflow de IA medido mes a mes.',
      tasks: [
        {
          id: uid('pt'), title: '1 · Cerrar el Digital Ecosystem Assessment', done: false,
          subtasks: [
            { id: uid('pst'), title: 'Holstein: redes, Meta Ads, Google Ads, SEO/AEO — ya auditado', done: true },
            { id: uid('pst'), title: 'Amazon Seller Central / Ads Manager y Walmart Connect', done: false },
            { id: uid('pst'), title: 'Sitio web, landing pages y herramientas de medición (GA4, GTM, HubSpot)', done: false },
            { id: uid('pst'), title: 'Connecto (mismo formato que Holstein)', done: false },
          ],
        },
        {
          id: uid('pt'), title: '2 · Reflejar el calendario e iniciativas de Asana en el HUB', done: false,
          subtasks: [
            { id: uid('pst'), title: 'Cargar este proyecto (KR1) en el HUB con sus 6 frentes', done: true },
            { id: uid('pst'), title: 'Cargar Back to School como proyecto propio con fechas reales', done: true },
            { id: uid('pst'), title: 'Cargar Mega Promo Ecuador como proyecto propio con fechas reales', done: true },
            { id: uid('pst'), title: 'Cargar el resto de proyectos reales (CCN RD, Belcorp, Web Audit, LinkedIn B2B, RRSS, Diagnóstico) como tarjetas propias', done: true },
            { id: uid('pst'), title: 'Cargar Heritage Month como proyecto propio con fechas reales', done: false },
            { id: uid('pst'), title: 'Definir una rutina simple de actualización semanal Asana → HUB', done: false },
          ],
        },
        {
          id: uid('pt'), title: '3 · Presentar el Campaign Playbook unificado', done: false,
          subtasks: [
            { id: uid('pst'), title: 'Brief estándar — ya construido (vista Briefs)', done: true },
            { id: uid('pst'), title: 'Mapear el flujo de trabajo con Brand, Trade Marketing, Diseño, Ecommerce USA, Retail USA y Retail LATAM', done: false },
            { id: uid('pst'), title: 'Definir roles y responsabilidades por etapa de campaña', done: false },
            { id: uid('pst'), title: 'Definir naming conventions y estándar de UTMs', done: false },
            { id: uid('pst'), title: 'Armar el pre-launch checklist', done: false },
            { id: uid('pst'), title: 'Consolidar todo en un solo documento presentable', done: false },
          ],
        },
        {
          id: uid('pt'), title: '4 · Construir el Budget Tracker real (antes del lanzamiento de Back to School, agosto)', done: false,
          subtasks: [
            { id: uid('pst'), title: 'Definir estructura: presupuesto aprobado vs. ejecutado, por canal y por campaña', done: false },
            { id: uid('pst'), title: 'Conectar con los datos ya existentes (Campaign KPIs, presupuestos de Mega Promo y Back to School)', done: false },
            { id: uid('pst'), title: 'Publicarlo como vista o tabla dentro del HUB', done: false },
          ],
        },
        {
          id: uid('pt'), title: '5 · Presentar el reporte estándar de campaña con revisión post-campaign (listo antes del cierre de Back to School, inicios de septiembre)', done: false,
          subtasks: [
            { id: uid('pst'), title: 'Definir estructura única: resumen, resultados, aprendizajes, recomendación', done: false },
            { id: uid('pst'), title: 'Probarlo con el primer piloto que cierre (Back to School)', done: false },
          ],
        },
        {
          id: uid('pt'), title: '6 · Lanzar 1 workflow con IA y medir horas ahorradas', done: false,
          subtasks: [
            { id: uid('pst'), title: 'Formalizar el workflow ya en uso: brief → borrador de estrategia digital con IA', done: false },
            { id: uid('pst'), title: 'Registrar horas ahorradas en los dos casos ya hechos (Mega Promo, Back to School)', done: false },
            { id: uid('pst'), title: 'Definir cómo medirlo mes a mes de forma simple', done: false },
          ],
        },
      ],
    },
    {
      id: uid('proj'),
      name: 'Back to School USA 2026',
      tags: ['Back to School'],
      description: 'Campaña piloto de Q3 (KR2) para Holstein en Ecommerce USA, Amazon y Walmart, la primera vez que se activa pauta social en Meta y TikTok además del marketplace, con foco en tráfico calificado hacia las tiendas de marca.',
      objective: 'Generar brand awareness y tráfico calificado hacia el Amazon Brand Store y el Walmart Brand Shop de Holstein (vendedor 3P en ambas plataformas) durante la ventana pico de Back to School.',
      result: 'Campaña ejecutada del 10 al 24 de agosto con calendario real, pauta activa en Meta y TikTok, y reporte post-campaña con aprendizajes para el resto de Ecommerce USA.',
      deliverable: 'Estrategia final + calendario de contenido + solicitud de materiales a Brand (8 piezas) + guía paso a paso de Meta Ads y TikTok Ads + setup de Amazon Attribution.',
      tasks: [
        {
          id: uid('pt'), title: 'Estrategia y presupuesto', done: true,
          subtasks: [
            { id: uid('pst'), title: 'Presupuesto confirmado, $1,000-$1,500', done: true },
            { id: uid('pst'), title: 'Calendario con fechas reales, 10 al 24 de agosto', done: true },
            { id: uid('pst'), title: 'Solicitud de 8 piezas enviada a Brand', done: true },
          ],
        },
        {
          id: uid('pt'), title: 'Guía de ejecución de pauta', done: true,
          subtasks: [
            { id: uid('pst'), title: 'Setup de Amazon Attribution', done: true },
            { id: uid('pst'), title: 'Meta Ads Manager, paso a paso', done: true },
            { id: uid('pst'), title: 'TikTok Ads Manager, dos ráfagas', done: true },
          ],
        },
        {
          id: uid('pt'), title: 'Producción de assets', done: false,
          subtasks: [
            { id: uid('pst'), title: 'Brand produciendo las 8 piezas (KV, spotlights, carrusel)', done: false },
            { id: uid('pst'), title: 'Video de producto por IA', done: false },
          ],
        },
        {
          id: uid('pt'), title: 'Lanzamiento de pauta', done: false,
          subtasks: [
            { id: uid('pst'), title: 'Activar Meta Ads (Traffic)', done: false },
            { id: uid('pst'), title: 'Activar TikTok Spark Ads, ráfaga 1 (14 ago) y 2 (19 ago)', done: false },
          ],
        },
        {
          id: uid('pt'), title: 'Cierre y reporte', done: false,
          subtasks: [
            { id: uid('pst'), title: 'Reporte post-campaña con el formato estándar de KR1', done: false },
          ],
        },
      ],
    },
    {
      id: uid('proj'),
      name: 'Mega Promo Ecuador — Tu cocina pide un Mega cambio',
      tags: ['Mega Promo'],
      description: 'Holstein es el 100% del canje de la Mega Promo de Megamaxi y Supermaxi este ciclo (16 SKUs), bajo el concepto de Brand "Tu cocina pide un Mega cambio". La campaña de sorteo de auto que se venía trabajando para este año se pospuso a 2027 y queda archivada, no eliminada.',
      objective: 'Que el consumidor identifique su "Mega Señal", entienda la mecánica de compra, acumula y canjea, y elija su producto Holstein antes de completar los puntos.',
      result: 'Campaña ejecutada en sus 4 fases (17 de septiembre al 2 de diciembre), con Digital gestionando el Mega Carrito de influencers y la pauta dark post en Ecuador.',
      deliverable: 'Estrategia digital + plan de influencers (Mega Carrito) + presupuesto propuesto ($21,000 de referencia) + keywords de búsqueda paga.',
      tasks: [
        {
          id: uid('pt'), title: 'Brief creativo de Brand', done: true,
          subtasks: [
            { id: uid('pst'), title: 'Recibido y analizado (concepto Mega Señales, 4 fases)', done: true },
          ],
        },
        {
          id: uid('pt'), title: 'Archivo de la estrategia del sorteo del auto', done: true,
          subtasks: [
            { id: uid('pst'), title: 'Movida a carpeta de archivo para 2027, no eliminada', done: true },
          ],
        },
        {
          id: uid('pt'), title: 'Estrategia digital nueva (Mega Señales)', done: true,
          subtasks: [
            { id: uid('pst'), title: 'Redactada en base al brief de Brand', done: true },
            { id: uid('pst'), title: 'Presupuesto propuesto (% y monto de referencia)', done: true },
          ],
        },
        {
          id: uid('pt'), title: 'Aprobación y confirmación', done: false,
          subtasks: [
            { id: uid('pst'), title: 'Confirmar presupuesto con Michelle', done: false },
            { id: uid('pst'), title: 'Confirmar catálogo final de 16 SKUs con Kevin', done: false },
          ],
        },
        {
          id: uid('pt'), title: 'Ejecución', done: false,
          subtasks: [
            { id: uid('pst'), title: 'Selección de creadores del Mega Carrito', done: false },
            { id: uid('pst'), title: 'Configurar campañas dark post en Meta y TikTok', done: false },
            { id: uid('pst'), title: 'Coordinar fechas de fase con Brand y Trade', done: false },
          ],
        },
      ],
    },
    {
      id: uid('proj'),
      name: 'CCN República Dominicana',
      tags: ['CCN RD'],
      description: 'Estrategia digital para Holstein y Connecto en República Dominicana (Jumbo y Casa Cuesta vía Grupo CCN), con foco en construir canal propio y no depender solo de lo que CCN apruebe en sus plataformas.',
      objective: 'Construir presencia de canal propio (cuentas nuevas de Holstein RD) y enriquecer el canal prestado de CCN, sin bloquear el avance a la espera de su aprobación.',
      result: 'Propuesta completa presentada y aprobada internamente, con Media Kit solicitado a CCN y SKUs PRO prioritarios definidos.',
      deliverable: 'Estrategia digital (docx, PPTX, HTML) con A+ Content, PRO Relaunch, Digital Campaigns Strategy y Connecto Expansion.',
      tasks: [
        {
          id: uid('pt'), title: 'Estrategia digital completa', done: true,
          subtasks: [
            { id: uid('pst'), title: 'Contexto, diagnóstico y objetivos', done: true },
            { id: uid('pst'), title: 'Holstein RD (canal propio) y Connecto en sección aparte', done: true },
            { id: uid('pst'), title: 'Presupuesto piloto propuesto, $2,000-$4,000/mes', done: true },
          ],
        },
        {
          id: uid('pt'), title: 'Presentaciones', done: true,
          subtasks: [
            { id: uid('pst'), title: 'PPTX', done: true },
            { id: uid('pst'), title: 'HTML', done: true },
          ],
        },
        {
          id: uid('pt'), title: 'Aprobación y arranque', done: false,
          subtasks: [
            { id: uid('pst'), title: 'Presentar internamente', done: false },
            { id: uid('pst'), title: 'Solicitar Media Kit a CCN', done: false },
            { id: uid('pst'), title: 'Definir SKUs PRO prioritarios', done: false },
            { id: uid('pst'), title: 'Proponer sesión conjunta con el equipo de marketing de CCN', done: false },
          ],
        },
      ],
    },
    {
      id: uid('proj'),
      name: 'TikTok Consultoras Belcorp',
      tags: ['Belcorp'],
      description: 'Propuesta de estrategia en TikTok dirigida a consultoras de venta directa de Belcorp (cuenta Premium), con producción de contenido y un sistema de captura de datos y retargeting.',
      objective: 'Posicionar a Holstein como aliado de las consultoras Belcorp en TikTok, sostenido con una estrategia de contenido y CRM más allá de un solo lanzamiento.',
      result: 'Propuesta aprobada y en ejecución, con el sistema de captura de datos y retargeting activo.',
      deliverable: 'Propuesta final + guía de ejecución + presentación HTML + PPTX.',
      tasks: [
        {
          id: uid('pt'), title: 'Propuesta y research', done: true,
          subtasks: [
            { id: uid('pst'), title: 'Research real de la categoría y benchmarks', done: true },
            { id: uid('pst'), title: 'Propuesta de valor y concepto creativo', done: true },
          ],
        },
        {
          id: uid('pt'), title: 'Estrategia de datos', done: true,
          subtasks: [
            { id: uid('pst'), title: 'Captura de datos / CRM', done: true },
            { id: uid('pst'), title: 'Retargeting', done: true },
          ],
        },
        {
          id: uid('pt'), title: 'Entregables finales', done: true,
          subtasks: [
            { id: uid('pst'), title: 'Guía de ejecución', done: true },
            { id: uid('pst'), title: 'Presentación HTML', done: true },
            { id: uid('pst'), title: 'PPTX', done: true },
          ],
        },
        {
          id: uid('pt'), title: 'Aprobación', done: false,
          subtasks: [
            { id: uid('pst'), title: 'Presentar y aprobar internamente', done: false },
          ],
        },
      ],
    },
    {
      id: uid('proj'),
      name: 'Auditoría y Optimización Web',
      tags: ['Web Audit'],
      description: 'Frente adelantado de SEO técnico, AEO y GEO para Distrivalto, Holstein, Connecto y Alessa, priorizando Holstein primero.',
      objective: 'Tener un sitio optimizado técnicamente, con contenido preparado para motores de respuesta de IA (AEO/GEO) y redirección geolocalizada por país.',
      result: 'Estrategia por etapas aprobada, con quick wins, mediano y largo plazo, y tiempos realistas de ejecución.',
      deliverable: 'Estrategia por etapas (docx) con research real de SEO técnico, AEO/GEO y redirección geolocalizada.',
      tasks: [
        {
          id: uid('pt'), title: 'Research', done: true,
          subtasks: [
            { id: uid('pst'), title: 'Auditoría de los 4 sitios reales', done: true },
            { id: uid('pst'), title: 'Research de SEO técnico, AEO/GEO y redirección geolocalizada', done: true },
          ],
        },
        {
          id: uid('pt'), title: 'Estrategia', done: true,
          subtasks: [
            { id: uid('pst'), title: 'Etapas con tiempos realistas', done: true },
            { id: uid('pst'), title: 'Integradas ideas de research adicional', done: true },
          ],
        },
        {
          id: uid('pt'), title: 'Aprobación y coordinación', done: false,
          subtasks: [
            { id: uid('pst'), title: 'Aprobación interna', done: false },
            { id: uid('pst'), title: 'Coordinar con Retail el listado de retailers por país', done: false },
          ],
        },
      ],
    },
    {
      id: uid('proj'),
      name: 'LinkedIn B2B 2026',
      tags: ['LinkedIn B2B'],
      description: 'Estrategia de posicionamiento de Distrivalto como líder de categoría en LinkedIn frente a sus 4 segmentos de cliente, con contenido que nace en los perfiles de Vanessa, Diego y Carolina.',
      objective: '+25% de alcance entre los cargos de decisión objetivo, a 90 días.',
      result: 'Sistema de contenido corriendo con banco de temas semanal y pauta de Matched Audiences activa.',
      deliverable: 'Estrategia (docx/PPTX/HTML) + Banco de Temas #1 (9 posts) + solicitud de plantillas a Brand.',
      tasks: [
        {
          id: uid('pt'), title: 'Estrategia', done: true,
          subtasks: [
            { id: uid('pst'), title: 'Segmentación, 4 segmentos', done: true },
            { id: uid('pst'), title: 'Pilares y banco de temas propuestos', done: true },
            { id: uid('pst'), title: 'Estándar de redacción de posts', done: true },
          ],
        },
        {
          id: uid('pt'), title: 'Banco de Temas #1', done: true,
          subtasks: [
            { id: uid('pst'), title: '9 temas redactados (Vanessa, Diego, Distrivalto)', done: true },
            { id: uid('pst'), title: 'Corregido tras revisión de Claudio (región, foto real, tono)', done: true },
          ],
        },
        {
          id: uid('pt'), title: 'Insumos pendientes', done: false,
          subtasks: [
            { id: uid('pst'), title: 'Brand entrega las 4 plantillas de diseño', done: false },
            { id: uid('pst'), title: 'Banco de fotos y videos reales', done: false },
            { id: uid('pst'), title: 'Banco de temas de Carolina', done: false },
          ],
        },
      ],
    },
    {
      id: uid('proj'),
      name: 'Estrategia RRSS, Holstein > Connecto > Alessa',
      tags: ['RRSS'],
      description: 'Plan de optimización de redes sociales (Facebook, Instagram, TikTok, Pinterest) para las 3 marcas, con un ritmo sostenible para el equipo de diseño.',
      objective: 'Ordenar qué se publica, en qué canal y con qué ritmo, priorizando Holstein, luego Connecto, y Alessa cuando lance.',
      result: 'Calendario de contenido activo en el HUB, con el primer mes de prueba cargado.',
      deliverable: 'Estrategia y guideline (docx) + Content Calendar en el HUB.',
      tasks: [
        {
          id: uid('pt'), title: 'Estrategia y guideline', done: true,
          subtasks: [
            { id: uid('pst'), title: 'Punto de partida real por marca', done: true },
            { id: uid('pst'), title: 'Regla de cuenta global vs. dark post', done: true },
            { id: uid('pst'), title: 'Ritmo sostenible, 3-4 posts por semana', done: true },
          ],
        },
        {
          id: uid('pt'), title: 'Content Calendar', done: true,
          subtasks: [
            { id: uid('pst'), title: 'Vista construida en el HUB', done: true },
            { id: uid('pst'), title: 'Agosto cargado como mes de prueba', done: true },
            { id: uid('pst'), title: 'Filtro por campaña y estado de publicado', done: true },
          ],
        },
        {
          id: uid('pt'), title: 'Próximo', done: false,
          subtasks: [
            { id: uid('pst'), title: 'Primer video UGC de Connecto', done: false },
            { id: uid('pst'), title: 'Confirmar ritmo sostenible con diseño', done: false },
          ],
        },
      ],
    },
    {
      id: uid('proj'),
      name: 'Diagnóstico del Ecosistema Digital',
      tags: ['Diagnóstico'],
      description: 'Entregable #1 del plan 30-60-90, auditoría real de redes, pauta y SEO de Holstein, con Connecto pendiente en el mismo formato.',
      objective: 'Tener un diagnóstico completo y honesto del ecosistema digital actual, con hallazgos críticos priorizados.',
      result: 'Holstein completo. Connecto y el resto de frentes (Amazon/Walmart, sitio, herramientas de medición) pendientes.',
      deliverable: 'Diagnóstico del Ecosistema Digital (docx), documento vivo y actualizado.',
      tasks: [
        {
          id: uid('pt'), title: 'Holstein', done: true,
          subtasks: [
            { id: uid('pst'), title: 'Redes sociales (Meta Business Suite)', done: true },
            { id: uid('pst'), title: 'Meta Ads y Google Ads', done: true },
            { id: uid('pst'), title: 'SEO/AEO', done: true },
          ],
        },
        {
          id: uid('pt'), title: 'Pendiente', done: false,
          subtasks: [
            { id: uid('pst'), title: 'Connecto, mismo formato', done: false },
            { id: uid('pst'), title: 'Amazon/Walmart', done: false },
            { id: uid('pst'), title: 'Sitio web y landing pages', done: false },
            { id: uid('pst'), title: 'Herramientas de medición (GA4, GTM, HubSpot)', done: false },
          ],
        },
      ],
    },
  ];

  const CAMPAIGN_METRICS_GUIDE = [
    ['Brand Awareness', 'Reach, frecuencia, CPM, video completion rate'],
    ['Tráfico calificado', 'Sesiones, CTR, CPC, costo por vista de landing page'],
    ['Leads', 'CPL, formularios completados, conversion rate'],
    ['Conversión indirecta / retail', 'Sales lift, tráfico a retailer, tasa de redención de promo'],
  ];

  const ACTIVITY = [
    { text: 'GA4 audit flagged unmapped conversion events on Connecto.', time: '2 days ago' },
    { text: 'Search Console verified across all brand domains.', time: '4 days ago' },
    { text: 'Access Matrix updated — Marketing Manager confirmed Full Admin on 10 platforms.', time: '1 week ago' },
    { text: 'Digital Assets Inventory reached 25 documented assets.', time: '1 week ago' },
  ];

  const PROJECT_FILES = [
    { name: 'Project Status (for Project Knowledge)', desc: 'Master status doc — upload to claude.ai Project Knowledge so every chat in the project stays in sync.', href: '../Estado_del_Proyecto.md' },
    { name: 'Executive Presentation', desc: 'One-time pitch deck used to get the governance framework approved by the Marketing Manager.', href: '../01 - Presentacion Ejecutiva Governance/index.html' },
    { name: 'Presentation Script (Guion)', desc: 'Literal speaking script for presenting the deck to Michelle, plus a separate FAQ annex.', href: '../01 - Presentacion Ejecutiva Governance/Guion_Presentacion_Michelle.docx' },
    { name: 'Email to Michelle', desc: 'Meeting request email to present the deck.', href: '../01 - Presentacion Ejecutiva Governance/Correo_Michelle.md' },
    { name: '30-60-90 Tracker (Excel)', desc: 'All 27 deliverables with status, owner, due date, and an auto-calculating summary.', href: '../02 - Plan 30-60-90/Plan_30-60-90_Tracker.xlsx' },
    { name: '30-60-90 Checklist (Word)', desc: 'Printable checklist version with KPIs per phase.', href: '../02 - Plan 30-60-90/Plan_30-60-90_Checklist.docx' },
    { name: 'Execution Guide (Guía paso a paso)', desc: 'Objective, concrete steps, tools, and expected deliverable for each of the 27 items.', href: '../02 - Plan 30-60-90/Guia_Ejecucion_Plan_30-60-90.docx' },
    { name: 'Digital Ecosystem Diagnosis', desc: 'Deliverable #1 of the 30-day phase — living document with real audit findings.', href: '../03 - Diagnostico Ecosistema Digital/Diagnostico_Ecosistema_Digital.docx' },
    { name: 'KPIs & OKRs H2 2026 (Final)', desc: 'Final KPIs and OKRs agreed with the Marketing Manager — Q3/Q4 key results and pilot campaign briefs.', href: '../04 - KPIs y OKRs H2 2026/Final_Propuesta_KPIs_OKRs_2026.docx' },
  ];

  const DEFAULT_CAMPAIGN_PLATFORMS = ['Facebook', 'Instagram', 'Meta Ads (Total)', 'TikTok', 'Pinterest', 'Google Ads', 'LinkedIn', 'Amazon Attribution', 'Walmart'];

  const DEFAULT_CAMPAIGN_COLUMNS = [
    { key: 'platform', label: 'Platform', type: 'campaignPlatform', core: true },
    { key: 'period', label: 'Fecha', type: 'date', core: true },
    { key: 'campaign', label: 'Campaign', type: 'text', core: true },
    { key: 'reach', label: 'Reach', type: 'number', agg: 'sum', core: false },
    { key: 'impressions', label: 'Impressions', type: 'number', agg: 'sum', core: false },
    { key: 'clicks', label: 'Clicks', type: 'number', agg: 'sum', core: false },
    { key: 'ctr', label: 'CTR (%)', type: 'number', agg: 'avg', core: false },
    { key: 'spend', label: 'Spend ($)', type: 'number', agg: 'sum', core: false },
    { key: 'interactions', label: 'Interacciones', type: 'number', agg: 'sum', core: false },
    { key: 'profileVisits', label: 'Visitas', type: 'number', agg: 'sum', core: false },
    { key: 'followers', label: 'Seguidores', type: 'number', agg: 'sum', core: false },
  ];

  /* ------------------------------------------------------------------------
     CONTENT CALENDAR — reference data
     ------------------------------------------------------------------------ */

  const PLATFORM_META = {
    Facebook: { color: '#1877F2', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.5 1.5-3.89 3.78-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22c4.78-.8 8.44-4.95 8.44-9.94z"/></svg>' },
    Instagram: { color: '#C1348D', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3.3" y="3.3" width="17.4" height="17.4" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none"/></svg>' },
    TikTok: { color: '#000000', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.8 2.5c.5 2.6 2.2 4.4 5.1 4.6v3.2c-1.8.1-3.5-.5-5.1-1.6v7c0 3.9-3.1 6.8-6.9 6.8-3.8 0-6.9-2.9-6.9-6.7 0-3.9 3.3-6.9 7.1-6.7v3.4c-1.8-.3-3.4 1-3.4 2.9 0 1.7 1.4 3.1 3.1 3.1 1.8 0 3.3-1.5 3.3-3.4V2.5h3.7z"/></svg>' },
    LinkedIn: { color: '#0A66C2', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 8.4H3.4V20h3.2V8.4zM5 6.6a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8zM20.6 20h-3.2v-6.1c0-1.5-.5-2.5-1.9-2.5-1 0-1.7.7-2 1.4-.1.3-.1.6-.1 1V20h-3.2s.1-10.6 0-11.6h3.2v1.7c.4-.7 1.2-1.6 3-1.6 2.1 0 3.7 1.4 3.7 4.4V20z"/></svg>' },
    Pinterest: { color: '#E60023', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2c-5.5 0-9.9 4-9.9 9.4 0 3 1.5 5.1 3.4 6-.1-.6-.2-1.4 0-2 .2-.7 1.2-5 1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.9-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.3-.9 3.6-.3 1.1.5 2 1.6 2 1.9 0 3.3-2.3 3.3-5.1 0-2.1-1.5-3.7-4.1-3.7-3 0-4.8 2.2-4.8 4.7 0 .8.3 1.4.7 1.9.1.1.1.2.1.3l-.3 1.1c0 .2-.2.3-.4.2-1.2-.5-1.9-2.1-1.9-3.7 0-2.8 2.2-6.2 6.9-6.2 3.7 0 6.2 2.7 6.2 5.6 0 3.8-2.1 6.7-5.1 6.7-1 0-2-.5-2.3-1.2l-.6 2.5c-.2.9-.7 2-1.1 2.7.9.3 1.9.4 2.9.4 5.5 0 9.4-4 9.4-9.4S17.5 2.2 12 2.2z"/></svg>' },
  };
  const PLATFORM_NAMES = Object.keys(PLATFORM_META);

  const KIND_OPTIONS = ['Orgánico', 'Pautado', 'Dark Post'];
  const KIND_CLASS = { 'Orgánico': 'kind-organico', 'Pautado': 'kind-pautado', 'Dark Post': 'kind-dark' };
  const KIND_HINT = {
    'Orgánico': 'Publicado en el feed, sin inversión.',
    'Pautado': 'Publicado orgánicamente y amplificado con pauta.',
    'Dark Post': 'Solo existe como anuncio, nunca aparece en el feed orgánico.',
  };

  const CAL_MARKETS = ['USA', 'Ecuador', 'Perú', 'Colombia', 'México', 'Bolivia', 'República Dominicana', 'LATAM (general)'];

  function calId(d, platform, seq) { return 'calp_' + d.replace(/-/g, '') + '_' + platform.toLowerCase() + '_' + seq; }

  const DEFAULT_CALENDAR_POSTS = [
    // ---- Back to School USA 2026 (Holstein, pauta corriendo del 10 al 24) ----
    { id: calId('2026-08-10', 'Facebook', 1), date: '2026-08-10', platform: 'Facebook', brand: 'Holstein Housewares', market: 'USA', campaign: 'Back to School USA 2026', kind: 'Pautado', topic: 'Arte general de descuento, 4 productos top', notes: '' },
    { id: calId('2026-08-10', 'Instagram', 1), date: '2026-08-10', platform: 'Instagram', brand: 'Holstein Housewares', market: 'USA', campaign: 'Back to School USA 2026', kind: 'Pautado', topic: 'Arte general de descuento, 4 productos top', notes: '' },
    { id: calId('2026-08-11', 'Pinterest', 1), date: '2026-08-11', platform: 'Pinterest', brand: 'Holstein Housewares', market: 'USA', campaign: 'Genérico', kind: 'Orgánico', topic: 'Pin de producto (reuso del arte de BTS, sin diseño nuevo)', notes: '' },
    { id: calId('2026-08-11', 'LinkedIn', 1), date: '2026-08-11', platform: 'LinkedIn', brand: 'Distrivalto', market: 'Cuentas globales', campaign: 'LinkedIn B2B 2026', kind: 'Orgánico', topic: 'Vanessa — Marketing como inversión, no gasto', notes: 'Banco de Temas #1' },
    { id: calId('2026-08-12', 'Facebook', 1), date: '2026-08-12', platform: 'Facebook', brand: 'Holstein Housewares', market: 'USA', campaign: 'Back to School USA 2026', kind: 'Pautado', topic: 'Spotlight, Omelet Maker y Coffee Maker', notes: '' },
    { id: calId('2026-08-12', 'Instagram', 1), date: '2026-08-12', platform: 'Instagram', brand: 'Holstein Housewares', market: 'USA', campaign: 'Back to School USA 2026', kind: 'Pautado', topic: 'Spotlight, Omelet Maker y Coffee Maker', notes: '' },
    { id: calId('2026-08-12', 'LinkedIn', 1), date: '2026-08-12', platform: 'LinkedIn', brand: 'Distrivalto', market: 'Cuentas globales', campaign: 'LinkedIn B2B 2026', kind: 'Orgánico', topic: 'Diego — Cómo usamos IA para anticipar demanda', notes: 'Banco de Temas #1' },
    { id: calId('2026-08-13', 'Instagram', 1), date: '2026-08-13', platform: 'Instagram', brand: 'Holstein Housewares', market: 'Ecuador', campaign: 'Genérico', kind: 'Orgánico', topic: 'Holstein ya está en Ecuador (reuso de asset + caption local)', notes: '' },
    { id: calId('2026-08-14', 'Facebook', 1), date: '2026-08-14', platform: 'Facebook', brand: 'Holstein Housewares', market: 'USA', campaign: 'Back to School USA 2026', kind: 'Pautado', topic: 'Carrusel lifestyle con CTA', notes: '' },
    { id: calId('2026-08-14', 'Instagram', 1), date: '2026-08-14', platform: 'Instagram', brand: 'Holstein Housewares', market: 'USA', campaign: 'Back to School USA 2026', kind: 'Pautado', topic: 'Carrusel lifestyle con CTA', notes: '' },
    { id: calId('2026-08-14', 'TikTok', 1), date: '2026-08-14', platform: 'TikTok', brand: 'Holstein Housewares', market: 'USA', campaign: 'Back to School USA 2026', kind: 'Pautado', topic: 'Carrusel lifestyle con CTA (Spark Ads, ráfaga 1)', notes: '' },
    { id: calId('2026-08-14', 'LinkedIn', 1), date: '2026-08-14', platform: 'LinkedIn', brand: 'Distrivalto', market: 'Cuentas globales', campaign: 'LinkedIn B2B 2026', kind: 'Orgánico', topic: 'Distrivalto — 44 años, 5 países, certificaciones', notes: 'Banco de Temas #1' },
    { id: calId('2026-08-17', 'Facebook', 1), date: '2026-08-17', platform: 'Facebook', brand: 'Holstein Housewares', market: 'USA', campaign: 'Back to School USA 2026', kind: 'Pautado', topic: 'Spotlight, Waffle Maker, Arepa Maker y Cupcake Maker', notes: '' },
    { id: calId('2026-08-17', 'Instagram', 1), date: '2026-08-17', platform: 'Instagram', brand: 'Holstein Housewares', market: 'USA', campaign: 'Back to School USA 2026', kind: 'Pautado', topic: 'Spotlight, Waffle Maker, Arepa Maker y Cupcake Maker', notes: '' },
    { id: calId('2026-08-18', 'Pinterest', 1), date: '2026-08-18', platform: 'Pinterest', brand: 'Holstein Housewares', market: 'USA', campaign: 'Genérico', kind: 'Orgánico', topic: 'Pin de producto (reuso del arte de BTS, sin diseño nuevo)', notes: '' },
    { id: calId('2026-08-18', 'LinkedIn', 1), date: '2026-08-18', platform: 'LinkedIn', brand: 'Distrivalto', market: 'Cuentas globales', campaign: 'LinkedIn B2B 2026', kind: 'Orgánico', topic: 'Vanessa — Por qué construir marca propia importa', notes: 'Banco de Temas #1' },
    { id: calId('2026-08-19', 'Facebook', 1), date: '2026-08-19', platform: 'Facebook', brand: 'Holstein Housewares', market: 'USA', campaign: 'Back to School USA 2026', kind: 'Pautado', topic: 'Video de producto (IA)', notes: '' },
    { id: calId('2026-08-19', 'Instagram', 1), date: '2026-08-19', platform: 'Instagram', brand: 'Holstein Housewares', market: 'USA', campaign: 'Back to School USA 2026', kind: 'Pautado', topic: 'Video de producto (IA)', notes: '' },
    { id: calId('2026-08-19', 'TikTok', 1), date: '2026-08-19', platform: 'TikTok', brand: 'Holstein Housewares', market: 'USA', campaign: 'Back to School USA 2026', kind: 'Pautado', topic: 'Video de producto (IA) (Spark Ads, ráfaga 2)', notes: '' },
    { id: calId('2026-08-19', 'LinkedIn', 1), date: '2026-08-19', platform: 'LinkedIn', brand: 'Distrivalto', market: 'Cuentas globales', campaign: 'LinkedIn B2B 2026', kind: 'Orgánico', topic: 'Diego — Un error de automatización', notes: 'Banco de Temas #1' },
    { id: calId('2026-08-20', 'Instagram', 1), date: '2026-08-20', platform: 'Instagram', brand: 'Holstein Housewares', market: 'Colombia', campaign: 'Genérico', kind: 'Orgánico', topic: 'Holstein llega a Colombia (reuso de asset + caption local)', notes: '' },
    { id: calId('2026-08-20', 'Instagram', 2), date: '2026-08-20', platform: 'Instagram', brand: 'Connecto', market: 'USA', campaign: 'Genérico', kind: 'Orgánico', topic: 'Contenido lifestyle Connecto (reuso de asset existente)', notes: '' },
    { id: calId('2026-08-21', 'LinkedIn', 1), date: '2026-08-21', platform: 'LinkedIn', brand: 'Distrivalto', market: 'Cuentas globales', campaign: 'LinkedIn B2B 2026', kind: 'Orgánico', topic: 'Distrivalto — Mujeres que lideran en Distrivalto', notes: 'Banco de Temas #1, pendiente foto real' },
    { id: calId('2026-08-24', 'Facebook', 1), date: '2026-08-24', platform: 'Facebook', brand: 'Holstein Housewares', market: 'USA', campaign: 'Back to School USA 2026', kind: 'Pautado', topic: 'Arte de descuento, últimos días de promoción', notes: '' },
    { id: calId('2026-08-24', 'Instagram', 1), date: '2026-08-24', platform: 'Instagram', brand: 'Holstein Housewares', market: 'USA', campaign: 'Back to School USA 2026', kind: 'Pautado', topic: 'Arte de descuento, últimos días de promoción', notes: '' },
    { id: calId('2026-08-25', 'LinkedIn', 1), date: '2026-08-25', platform: 'LinkedIn', brand: 'Distrivalto', market: 'Cuentas globales', campaign: 'LinkedIn B2B 2026', kind: 'Orgánico', topic: 'Vanessa — Cómo decidimos qué mercado de LATAM entrar', notes: 'Banco de Temas #1' },
    { id: calId('2026-08-26', 'LinkedIn', 1), date: '2026-08-26', platform: 'LinkedIn', brand: 'Distrivalto', market: 'Cuentas globales', campaign: 'LinkedIn B2B 2026', kind: 'Orgánico', topic: 'Diego — Por qué elegimos Shopify para las 4 marcas', notes: 'Banco de Temas #1' },
    { id: calId('2026-08-27', 'Instagram', 1), date: '2026-08-27', platform: 'Instagram', brand: 'Holstein Housewares', market: 'República Dominicana', campaign: 'Genérico', kind: 'Orgánico', topic: 'Holstein ya está en República Dominicana (reuso de asset + caption local)', notes: '' },
    { id: calId('2026-08-28', 'LinkedIn', 1), date: '2026-08-28', platform: 'LinkedIn', brand: 'Distrivalto', market: 'Cuentas globales', campaign: 'LinkedIn B2B 2026', kind: 'Orgánico', topic: 'Distrivalto — Mid Year Conference', notes: 'Banco de Temas #1, pendiente fotos del evento' },
  ];
  DEFAULT_CALENDAR_POSTS.forEach((p) => { if (p.posted === undefined) p.posted = false; });

  const DOCS = [
    { id: 'files', label: 'Project Files', title: 'Project Files', isFileList: true },
    { id: 'overview', label: 'Overview', title: 'About the Digital Marketing HUB', body: [
      'This is the central operating hub for Digital Marketing at Distrivalto — governance, execution plan, objectives and KPIs, campaign performance, inventory, access matrix, platform audit, and reporting all live here day to day. It is fed continuously as projects, automations, briefs, and reporting come together, separate from the executive presentation, which was the one-time pitch used to get the governance framework approved.',
      'Almost everything here is editable: add or remove assets and columns, add or rename access roles, add custom fields to any platform, and edit quick wins, tasks, objectives, and campaign entries directly. The dashboard recalculates automatically as the underlying data changes.',
    ]},
    { id: 'governance', label: 'Governance Model', title: 'Governance Model', body: [
      'Access and ownership follow a single chain of accountability: Business Owner, who holds strategic ownership and visibility; Marketing Manager, Full Administrator; Digital Marketing Specialist, Full Administrator; and Contributors, who hold scoped execution access appropriate to their role.',
      'Both the Marketing Manager and the Digital Marketing Specialist hold Full Administrator access — governance is a shared responsibility, not centralized in a single person.',
    ]},
    { id: 'roles', label: 'Roles & Access Levels', title: 'Roles & Access Levels', body: [
      'The Access Matrix uses four access levels: None (no access), Viewer (read-only visibility), Editor (can execute within defined scope), and Full Admin (complete administrative control, including managing other users\' access).',
      'Business Owner is intentionally kept at Viewer across platforms — strategic oversight without day-to-day operational risk. The Contributors column can be renamed or duplicated from the Access Matrix view to reflect different contributor roles (e.g. a specific agency or freelancer function) as needed.',
    ]},
    { id: 'platforms', label: 'Platforms', title: 'Platforms in Scope', body: [
      'Platforms are managed from the Platform Audit view — add a new one there, or directly from the Platform field when adding an asset. Whatever is added shows up automatically in the Access Matrix and on the Dashboard.',
      'Each platform has a status, a tracking and 2FA state, and any custom fields relevant to it — active campaigns, posts, videos, ads, or anything else worth tracking.',
    ]},
    { id: 'calendar-doc', label: 'Content Calendar', title: 'Cómo usar el Content Calendar', body: [
      'Cada post es una tarjeta de color por plataforma (Facebook, Instagram, TikTok, LinkedIn, Pinterest), con el ícono de la red. El borde indica el tipo: sólido es orgánico, punteado (guiones) es pautado, y punteado fino es dark post, solo existe como anuncio.',
      'Arrastra una tarjeta a otro día para moverla. Haz clic en una tarjeta para editarla o eliminarla. El botón "+" que aparece al pasar el mouse sobre un día agrega un post nuevo directo en esa fecha.',
      'Los filtros de marca y plataforma en la parte superior son acumulativos, apágalos para ver solo lo que te interesa revisar. El selector de campaña filtra todo el calendario a una sola campaña (por ejemplo, Back to School) para ver de un vistazo todo lo que corresponde a esa campaña. El panel de "Ritmo semanal" abajo cuenta piezas nuevas de diseño por semana, para no sobrecargar al equipo de diseño.',
      'El círculo pequeño dentro de cada tarjeta marca si el post ya se publicó o no, haz clic ahí directamente (sin abrir la tarjeta) para marcarlo. Un post publicado se ve atenuado y con el texto tachado. También se puede cambiar el estado desde el formulario de edición, en el campo "Estado".',
    ]},
    { id: 'faq', label: 'FAQ', title: 'Frequently Asked Questions', body: [
      'Why does this exist if access already works? — It works today because it depends on memory and goodwill, not on a documented process. The HUB makes ownership, access, tasks, and objectives explicit and auditable in one place.',
      'Does this replace our current tools? — No. It organizes the access, data, and workflow that already exists across Meta, Google Ads, GA4, HubSpot, Asana, and the rest — no platform is being replaced.',
      'How is data stored? — This is a static, self-contained tool. All editable data is saved locally in the browser you are using.',
    ]},
  ];

  /* ------------------------------------------------------------------------
     STORAGE
     ------------------------------------------------------------------------ */

  const STORE_KEYS = {
    platforms: 'dmg_platforms',
    access: 'dmg_access_matrix',
    roles: 'dmg_roles',
    assetColumns: 'dmg_asset_columns',
    assets: 'dmg_assets',
    quickwins: 'dmg_quick_wins_v3',
    notes: 'dmg_meeting_notes',
    team: 'dmg_team',
    profile: 'dmg_user_profile',
    tasks: 'dmg_tasks',
    kpis: 'dmg_kpis_v3',
    keyResults: 'dmg_key_results_v5',
    campaignPlatforms: 'dmg_campaign_platforms',
    campaignColumns: 'dmg_campaign_columns',
    campaignRows: 'dmg_campaign_rows',
    campaignReports: 'dmg_campaign_reports_v1',
    projects: 'dmg_projects_v2',
    briefs: 'dmg_briefs_v1',
    contentInputs: 'dmg_content_inputs_v1',
    calendarPosts: 'dmg_calendar_posts_v1',
    afCatalogColumns: 'dmg_af_catalog_columns_v1',
    afCatalog: 'dmg_af_catalog_v1',
    afMediaKitColumns: 'dmg_af_mediakit_columns_v1',
    afMediaKit: 'dmg_af_mediakit_v1',
    afTradeColumns: 'dmg_af_trade_columns_v1',
    afTrade: 'dmg_af_trade_v1',
    afBrandColumns: 'dmg_af_brand_columns_v1',
    afBrand: 'dmg_af_brand_v1',
    afPacks: 'dmg_af_packs_v2',
    afCampaigns: 'dmg_af_campaigns_v1',
  };

  function loadStore(key, fallback) {
    // Fuente de verdad: los datos ya traídos de Supabase por auth-gate.js
    // antes de que este script se cargue. localStorage queda solo como
    // respaldo si por algún motivo el HUB corre sin conexión al backend.
    const remote = window.__HUB_REMOTE_DATA;
    if (remote && Object.prototype.hasOwnProperty.call(remote, key)) {
      return remote[key];
    }
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function saveStore(key, value) {
    // Bloqueo de permisos: si el rol actual no puede editar esta vista,
    // ni siquiera se intenta guardar (queda reforzado además por las
    // políticas de Supabase, esto es solo para no perder el cambio local
    // silenciosamente y avisarle a la persona por qué no se guardó).
    if (window.__hubCanEditKey && !window.__hubCanEditKey(key)) {
      if (window.__hubDenyEdit) { window.__hubDenyEdit(key); }
      return;
    }
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
    if (window.__HUB_REMOTE_DATA) { window.__HUB_REMOTE_DATA[key] = value; }
    if (window.__hubPushToRemote) { window.__hubPushToRemote(key, value); }
  }

  let platforms = loadStore(STORE_KEYS.platforms, DEFAULT_PLATFORMS);
  let accessState = loadStore(STORE_KEYS.access, DEFAULT_ACCESS);
  let matrixRoles = loadStore(STORE_KEYS.roles, DEFAULT_ROLES);
  let assetColumns = loadStore(STORE_KEYS.assetColumns, DEFAULT_ASSET_COLUMNS);
  let assets = loadStore(STORE_KEYS.assets, DEFAULT_ASSETS);
  let quickWins = loadStore(STORE_KEYS.quickwins, DEFAULT_QUICK_WINS);
  let notes = loadStore(STORE_KEYS.notes, []);
  let team = loadStore(STORE_KEYS.team, DEFAULT_TEAM);
  let userProfile = loadStore(STORE_KEYS.profile, DEFAULT_USER_PROFILE);
  let tasks = loadStore(STORE_KEYS.tasks, DEFAULT_TASKS);
  let kpis = loadStore(STORE_KEYS.kpis, DEFAULT_KPIS);
  let keyResults = loadStore(STORE_KEYS.keyResults, DEFAULT_KEY_RESULTS);
  let campaignPlatforms = loadStore(STORE_KEYS.campaignPlatforms, DEFAULT_CAMPAIGN_PLATFORMS);
  let campaignColumns = loadStore(STORE_KEYS.campaignColumns, DEFAULT_CAMPAIGN_COLUMNS);
  let campaignRows = loadStore(STORE_KEYS.campaignRows, []);
  let campaignReports = loadStore(STORE_KEYS.campaignReports, []);
  let projects = loadStore(STORE_KEYS.projects, DEFAULT_PROJECTS);
  let briefs = loadStore(STORE_KEYS.briefs, []);
  let contentInputs = loadStore(STORE_KEYS.contentInputs, []);
  let calendarPosts = loadStore(STORE_KEYS.calendarPosts, DEFAULT_CALENDAR_POSTS);
  let afCatalogColumns = loadStore(STORE_KEYS.afCatalogColumns, DEFAULT_AF_CATALOG_COLUMNS);
  let afCatalog = loadStore(STORE_KEYS.afCatalog, DEFAULT_AF_CATALOG);
  let afMediaKitColumns = loadStore(STORE_KEYS.afMediaKitColumns, DEFAULT_AF_MEDIAKIT_COLUMNS);
  let afMediaKit = loadStore(STORE_KEYS.afMediaKit, DEFAULT_AF_MEDIAKIT);
  let afTradeColumns = loadStore(STORE_KEYS.afTradeColumns, DEFAULT_AF_TRADE_COLUMNS);
  let afTrade = loadStore(STORE_KEYS.afTrade, DEFAULT_AF_TRADE);
  let afBrandColumns = loadStore(STORE_KEYS.afBrandColumns, DEFAULT_AF_BRAND_COLUMNS);
  let afBrand = loadStore(STORE_KEYS.afBrand, DEFAULT_AF_BRAND);
  let afPacks = loadStore(STORE_KEYS.afPacks, DEFAULT_AF_PACKS);
  let afCampaigns = loadStore(STORE_KEYS.afCampaigns, DEFAULT_AF_CAMPAIGNS);

  function persistPlatforms() { saveStore(STORE_KEYS.platforms, platforms); }
  function persistAccess() { saveStore(STORE_KEYS.access, accessState); }
  function persistRoles() { saveStore(STORE_KEYS.roles, matrixRoles); }
  function persistAssetColumns() { saveStore(STORE_KEYS.assetColumns, assetColumns); }
  function persistAssets() { saveStore(STORE_KEYS.assets, assets); }
  function persistQuickWins() { saveStore(STORE_KEYS.quickwins, quickWins); }
  function persistNotes() { saveStore(STORE_KEYS.notes, notes); }
  function persistTeam() { saveStore(STORE_KEYS.team, team); }
  function persistProfile() { saveStore(STORE_KEYS.profile, userProfile); }
  function persistTasks() { saveStore(STORE_KEYS.tasks, tasks); }
  function persistKpis() { saveStore(STORE_KEYS.kpis, kpis); }
  function persistKeyResults() { saveStore(STORE_KEYS.keyResults, keyResults); }
  function persistCampaignPlatforms() { saveStore(STORE_KEYS.campaignPlatforms, campaignPlatforms); }
  function persistCampaignColumns() { saveStore(STORE_KEYS.campaignColumns, campaignColumns); }
  function persistCampaignRows() { saveStore(STORE_KEYS.campaignRows, campaignRows); }
  function persistCampaignReports() { saveStore(STORE_KEYS.campaignReports, campaignReports); }
  function persistProjects() { saveStore(STORE_KEYS.projects, projects); }
  function persistBriefs() { saveStore(STORE_KEYS.briefs, briefs); }
  function persistContentInputs() { saveStore(STORE_KEYS.contentInputs, contentInputs); }
  function persistCalendarPosts() { saveStore(STORE_KEYS.calendarPosts, calendarPosts); }
  function persistAFCatalogColumns() { saveStore(STORE_KEYS.afCatalogColumns, afCatalogColumns); }
  function persistAFCatalog() { saveStore(STORE_KEYS.afCatalog, afCatalog); }
  function persistAFMediaKitColumns() { saveStore(STORE_KEYS.afMediaKitColumns, afMediaKitColumns); }
  function persistAFMediaKit() { saveStore(STORE_KEYS.afMediaKit, afMediaKit); }
  function persistAFTradeColumns() { saveStore(STORE_KEYS.afTradeColumns, afTradeColumns); }
  function persistAFTrade() { saveStore(STORE_KEYS.afTrade, afTrade); }
  function persistAFBrandColumns() { saveStore(STORE_KEYS.afBrandColumns, afBrandColumns); }
  function persistAFBrand() { saveStore(STORE_KEYS.afBrand, afBrand); }
  function persistAFPacks() { saveStore(STORE_KEYS.afPacks, afPacks); }
  function persistAFCampaigns() { saveStore(STORE_KEYS.afCampaigns, afCampaigns); }

  function defaultAccessRow() {
    const row = {};
    matrixRoles.forEach((r) => { row[r.id] = r.id === 'bo' ? 'viewer' : 'none'; });
    return row;
  }

  function findPlatform(id) { return platforms.find((p) => p.id === id); }
  function findPlatformByName(name) { return platforms.find((p) => p.name === name); }

  function addPlatform(name) {
    const id = slugify(name) + '_' + uid('p');
    const p = { id, name, status: 'attention', tracking: 'Not Verified', twoFA: 'Disabled', notes: '', customFields: [] };
    platforms.push(p);
    accessState[id] = defaultAccessRow();
    persistPlatforms();
    persistAccess();
    return p;
  }

  function removePlatform(id) {
    platforms = platforms.filter((p) => p.id !== id);
    delete accessState[id];
    persistPlatforms();
    persistAccess();
  }

  /* ------------------------------------------------------------------------
     MODAL
     ------------------------------------------------------------------------ */

  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalSubmitBtn = document.getElementById('modalSubmitBtn');
  let modalSubmitHandler = null;

  function renderModalField(f) {
    const id = 'modalField_' + f.key;
    if (f.type === 'select') {
      return `<div class="modal-field"><label>${escapeHtml(f.label)}</label>
        <select id="${id}">${f.options.map((o) => `<option value="${escapeHtml(o)}" ${o === f.value ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}</select>
      </div>`;
    }
    if (f.type === 'textarea') {
      return `<div class="modal-field"><label>${escapeHtml(f.label)}</label><textarea id="${id}" rows="3">${escapeHtml(f.value || '')}</textarea></div>`;
    }
    return `<div class="modal-field"><label>${escapeHtml(f.label)}</label><input type="${f.type || 'text'}" id="${id}" value="${escapeHtml(f.value || '')}" ${f.placeholder ? `placeholder="${escapeHtml(f.placeholder)}"` : ''}></div>`;
  }

  function openModal({ title, fields, submitLabel, onSubmit }) {
    modalTitle.textContent = title;
    modalBody.innerHTML = fields.map(renderModalField).join('');
    modalSubmitBtn.textContent = submitLabel || 'Save';
    modalSubmitHandler = () => {
      const values = {};
      fields.forEach((f) => { values[f.key] = document.getElementById('modalField_' + f.key).value; });
      onSubmit(values);
    };
    modalOverlay.classList.add('active');
    const firstField = modalBody.querySelector('input, select, textarea');
    if (firstField) firstField.focus();
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
    modalSubmitHandler = null;
  }

  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
  modalSubmitBtn.addEventListener('click', () => { if (modalSubmitHandler) { modalSubmitHandler(); closeModal(); } });
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalOverlay.classList.contains('active')) closeModal(); });

  /* ------------------------------------------------------------------------
     NAVIGATION / ROUTING
     ------------------------------------------------------------------------ */

  const VIEW_META = {
    dashboard: { title: 'Dashboard', sub: 'Overall status of the digital governance project' },
    projects: { title: 'Projects', sub: 'Every project with its objective, expected result, deliverable, and task checklist' },
    tasks: { title: 'Tasks', sub: 'The 27 deliverables of the 30-60-90 day plan' },
    objectives: { title: 'Objectives & KPIs', sub: 'Business KPIs and the 3 OKRs for H2 2026' },
    activationFramework: { title: 'Activation Framework', sub: 'Digital Activation Catalog, Activation Packs y Retailer Media Kit — para propuestas estandarizadas a retailers' },
    briefs: { title: 'Briefs', sub: 'Brief estándar de Digital Marketing y registro de todas las solicitudes' },
    contentInputs: { title: 'LinkedIn B2B', sub: 'Banco de contenido, tema, copy, estado y quién publica/repostea cada post' },
    calendar: { title: 'Content Calendar', sub: 'Calendario de posteos por plataforma, marca y país — Facebook, Instagram, TikTok, LinkedIn y Pinterest' },
    inventory: { title: 'Digital Assets Inventory', sub: 'Every account, property, and asset across Distrivalto' },
    access: { title: 'Access Matrix', sub: 'Who has access to what, at what level, and why' },
    audit: { title: 'Platform Audit', sub: 'Health check across all governed platforms' },
    quickwins: { title: 'Quick Wins', sub: 'Control center, todo lo que se está trabajando ahora mismo, por proyecto' },
    reports: { title: 'Reports', sub: 'Datos generales por canal y reportes estándar por campaña' },
    notes: { title: 'Meeting Notes', sub: 'Record decisions and action items' },
    timeline: { title: 'Project Timeline', sub: 'Foundation through full execution' },
    settings: { title: 'Settings', sub: 'Team, roles, and preferences' },
    docs: { title: 'Documentation', sub: 'How this framework works' },
  };

  const navItems = Array.from(document.querySelectorAll('.nav-item'));
  const views = Array.from(document.querySelectorAll('.view'));
  const topbarTitle = document.getElementById('topbarTitle');
  const topbarSubtitle = document.getElementById('topbarSubtitle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const mobileToggle = document.getElementById('mobileToggle');

  function goToView(name) {
    if (!VIEW_META[name]) return;
    views.forEach((v) => v.classList.toggle('active', v.id === 'view-' + name));
    navItems.forEach((n) => n.classList.toggle('active', n.dataset.view === name));
    const meta = VIEW_META[name];
    topbarTitle.textContent = meta.title;
    topbarSubtitle.textContent = meta.sub;
    const vc = document.getElementById('viewContainer');
    if (vc) vc.scrollTop = 0;
    try { window.scrollTo(0, 0); } catch (e) { /* not available in some contexts */ }
    if (name === 'projects') showProjectsListMode();
    closeSidebar();
    try { if (history.pushState) history.pushState(null, '', '#' + name); } catch (e) { /* file:// origin blocks pushState in some browsers */ }
  }

  navItems.forEach((btn) => btn.addEventListener('click', () => goToView(btn.dataset.view)));

  function openSidebar() { sidebar.classList.add('open'); sidebarOverlay.classList.add('active'); }
  function closeSidebar() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('active'); }
  mobileToggle.addEventListener('click', () => { sidebar.classList.contains('open') ? closeSidebar() : openSidebar(); });
  sidebarOverlay.addEventListener('click', closeSidebar);

  /* ------------------------------------------------------------------------
     DASHBOARD
     ------------------------------------------------------------------------ */

  function renderDashboard() {
    const total = assets.length;
    const active = assets.filter((a) => a.status === 'Active').length;
    const review = assets.filter((a) => a.status === 'Needs Review').length;

    const platformsAudited = platforms.length;
    const healthy = platforms.filter((p) => p.status === 'healthy').length;
    const attention = platforms.filter((p) => p.status === 'attention').length;
    const critical = platforms.filter((p) => p.status === 'critical').length;

    let compliant = 0;
    platforms.forEach((p) => {
      const a = accessState[p.id] || {};
      if (a.mm === 'full' && a.dms === 'full') compliant++;
    });

    const twoFAEnabled = platforms.filter((p) => p.twoFA === 'Enabled').length;
    const twoFAPct = platformsAudited ? Math.round((twoFAEnabled / platformsAudited) * 100) : 0;

    const qwDone = quickWins.filter((q) => q.status === 'done').length;
    const qwTotal = quickWins.length || 1;

    const overallStatus = critical > 0 ? { label: 'Needs Attention', chip: 'chip-amber' } : { label: 'On Track', chip: 'chip-green' };

    const tasksDone = tasks.filter((t) => t.done).length;
    const tasksTotal = tasks.length || 1;

    const stats = [
      { label: '30-60-90 Plan Progress', value: `${tasksDone}/${tasks.length}`, sub: 'Deliverables completed', bar: Math.round((tasksDone / tasksTotal) * 100), view: 'tasks' },
      { label: 'Assets Inventoried', value: `${total}`, sub: `${active} active · ${review} needs review`, bar: 100, view: 'inventory' },
      { label: 'Platforms Audited', value: `${platformsAudited}/${platformsAudited}`, sub: `${healthy} healthy · ${attention} attention · ${critical} critical`, bar: 100, view: 'audit' },
      { label: 'Admin Access Aligned', value: `${compliant}/${platformsAudited}`, sub: 'Marketing Manager + DMS at Full Admin', bar: platformsAudited ? Math.round((compliant / platformsAudited) * 100) : 0, view: 'access' },
      { label: '2FA Progress', value: `${twoFAPct}%`, sub: `${twoFAEnabled} of ${platformsAudited} platforms enforced`, bar: twoFAPct, view: 'audit' },
      { label: 'Quick Wins', value: `${qwDone}/${quickWins.length}`, sub: 'Completed vs. identified', bar: Math.round((qwDone / qwTotal) * 100), view: 'quickwins' },
      { label: 'Critical Issues', value: `${critical}`, sub: 'Platforms needing immediate action', bar: platformsAudited ? Math.round((critical / platformsAudited) * 100) : 0, critical: critical > 0, view: 'audit' },
      { label: 'Overall Status', value: overallStatus.label, sub: 'Based on current audit findings', view: 'audit' },
    ];

    const grid = document.getElementById('statGrid');
    grid.innerHTML = stats.map((s) => `
      <button class="stat-card clickable ${s.critical ? 'critical' : ''}" data-view="${s.view}">
        <div class="stat-card-label">${s.label}</div>
        <div class="stat-card-value">${s.value}</div>
        <div class="stat-card-sub">${s.sub}</div>
        ${s.bar !== undefined ? `<div class="stat-card-bar"><div class="stat-card-bar-fill" style="width:${s.bar}%"></div></div>` : ''}
      </button>
    `).join('');
    grid.querySelectorAll('.stat-card').forEach((btn) => btn.addEventListener('click', () => goToView(btn.dataset.view)));

    const chain = [
      { title: 'Business Owner', sub: 'Strategic Ownership' },
      { title: 'Marketing Manager', sub: 'Full Administrator' },
      { title: 'Digital Marketing Specialist', sub: 'Full Administrator' },
      { title: 'Contributors', sub: 'Scoped Execution Access' },
    ];
    document.getElementById('miniGovChain').innerHTML = chain.map((n) => `
      <div class="mgc-node">
        <span class="mgc-dot"></span>
        <div><div class="mgc-title">${n.title}</div><div class="mgc-sub">${n.sub}</div></div>
      </div>
    `).join('');

    document.getElementById('activityList').innerHTML = ACTIVITY.map((a) => `
      <li class="activity-item">
        <span class="activity-dot"></span>
        <div><div class="activity-text">${escapeHtml(a.text)}</div><span class="activity-time">${a.time}</span></div>
      </li>
    `).join('');
  }

  /* ------------------------------------------------------------------------
     DIGITAL ASSETS INVENTORY
     ------------------------------------------------------------------------ */

  let inventoryState = { search: '', brand: 'All', status: 'All' };

  function platformOptionsHtml(selected) {
    const opts = platforms.map((p) => `<option value="${escapeHtml(p.name)}" ${p.name === selected ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('');
    return opts + `<option value="__add__">+ Add new platform…</option>`;
  }

  function renderInventoryFilters() {
    const brandWrap = document.getElementById('brandFilters');
    const statusWrap = document.getElementById('statusFilters');
    const brands = ['All', ...BRANDS];
    const statuses = ['All', ...ASSET_STATUS_OPTIONS];

    brandWrap.innerHTML = brands.map((b) => `<button class="filter-chip ${inventoryState.brand === b ? 'active' : ''}" data-brand="${escapeHtml(b)}">${escapeHtml(b)}</button>`).join('');
    statusWrap.innerHTML = statuses.map((s) => `<button class="filter-chip ${inventoryState.status === s ? 'active' : ''}" data-status="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('');

    brandWrap.querySelectorAll('button').forEach((btn) => btn.addEventListener('click', () => {
      inventoryState.brand = btn.dataset.brand; renderInventoryFilters(); renderInventoryTable();
    }));
    statusWrap.querySelectorAll('button').forEach((btn) => btn.addEventListener('click', () => {
      inventoryState.status = btn.dataset.status; renderInventoryFilters(); renderInventoryTable();
    }));
  }

  function renderInventoryHead() {
    const thead = document.getElementById('inventoryHead');
    thead.innerHTML = `<tr>${assetColumns.map((c) => `
      <th>
        <div class="th-with-action">
          <span class="th-label">${escapeHtml(c.label)}</span>
          ${!c.core ? `<button class="icon-btn" data-delete-col="${c.key}" aria-label="Delete column"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>` : ''}
        </div>
      </th>`).join('')}<th></th></tr>`;

    thead.querySelectorAll('[data-delete-col]').forEach((btn) => btn.addEventListener('click', () => {
      const key = btn.dataset.deleteCol;
      if (!confirm('Delete this column? This removes it from every asset.')) return;
      assetColumns = assetColumns.filter((c) => c.key !== key);
      assets.forEach((a) => { delete a[key]; });
      persistAssetColumns(); persistAssets();
      renderInventoryHead(); renderInventoryTable();
    }));
  }

  function cellValueHtml(col, asset) {
    const value = asset[col.key] || '';
    if (col.type === 'text') {
      return `<td contenteditable="true" data-id="${asset.id}" data-key="${col.key}">${escapeHtml(value)}</td>`;
    }
    if (col.type === 'platform') {
      return `<td><select class="cell-select" data-id="${asset.id}" data-key="platform">${platformOptionsHtml(value)}</select></td>`;
    }
    if (col.type === 'select') {
      const color = col.key === 'status' ? ASSET_STATUS_COLOR[value] : (col.key === 'priority' ? PRIORITY_COLOR[value] : null);
      const opts = col.options.map((o) => `<option value="${escapeHtml(o)}" ${o === value ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('');
      return `<td><select class="cell-select" data-id="${asset.id}" data-key="${col.key}" ${color ? `style="color:${color}"` : ''}>${opts}</select></td>`;
    }
    return `<td>${escapeHtml(value)}</td>`;
  }

  function renderInventoryTable() {
    const q = inventoryState.search.toLowerCase();
    const rows = assets.filter((a) => {
      const matchesSearch = !q || (a.name || '').toLowerCase().includes(q) || (a.brand || '').toLowerCase().includes(q) || (a.platform || '').toLowerCase().includes(q);
      const matchesBrand = inventoryState.brand === 'All' || a.brand === inventoryState.brand;
      const matchesStatus = inventoryState.status === 'All' || a.status === inventoryState.status;
      return matchesSearch && matchesBrand && matchesStatus;
    });

    const body = document.getElementById('inventoryBody');
    const empty = document.getElementById('inventoryEmpty');

    if (rows.length === 0) { body.innerHTML = ''; empty.hidden = false; return; }
    empty.hidden = true;

    body.innerHTML = rows.map((a) => `
      <tr>
        ${assetColumns.map((c) => cellValueHtml(c, a)).join('')}
        <td class="row-delete-cell"><button class="icon-btn" data-delete-row="${a.id}" aria-label="Delete asset"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></td>
      </tr>
    `).join('');
  }

  function inventoryBodyDelegation() {
    const body = document.getElementById('inventoryBody');

    body.addEventListener('focusout', (e) => {
      const td = e.target.closest('td[contenteditable="true"]');
      if (!td) return;
      const asset = assets.find((a) => a.id === td.dataset.id);
      if (!asset) return;
      asset[td.dataset.key] = td.textContent.trim();
      persistAssets();
      renderDashboard();
    });

    body.addEventListener('change', (e) => {
      const sel = e.target.closest('select.cell-select');
      if (!sel) return;
      const asset = assets.find((a) => a.id === sel.dataset.id);
      if (!asset) return;
      const key = sel.dataset.key;

      if (key === 'platform' && sel.value === '__add__') {
        const name = prompt('New platform name:');
        if (!name || !name.trim()) { sel.value = asset.platform || ''; return; }
        const trimmed = name.trim();
        let p = findPlatformByName(trimmed);
        if (!p) p = addPlatform(trimmed);
        asset.platform = p.name;
        persistAssets();
        renderInventoryTable();
        renderAccessMatrix();
        renderPlatformAudit(document.getElementById('auditSearch').value);
        renderDashboard();
        return;
      }

      asset[key] = sel.value;
      if (key === 'status' || key === 'priority') sel.style.color = key === 'status' ? ASSET_STATUS_COLOR[sel.value] : PRIORITY_COLOR[sel.value];
      persistAssets();
      renderDashboard();
      if (inventoryState.brand !== 'All' || inventoryState.status !== 'All') renderInventoryTable();
    });

    body.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-delete-row]');
      if (!btn) return;
      if (!confirm('Delete this asset?')) return;
      assets = assets.filter((a) => a.id !== btn.dataset.deleteRow);
      persistAssets();
      renderInventoryTable();
      renderDashboard();
    });
  }

  document.getElementById('inventorySearch').addEventListener('input', (e) => { inventoryState.search = e.target.value; renderInventoryTable(); });

  document.getElementById('addAssetBtn').addEventListener('click', () => {
    const asset = { id: uid('a') };
    assetColumns.forEach((c) => {
      if (c.type === 'select') asset[c.key] = c.options[0];
      else if (c.type === 'platform') asset[c.key] = platforms[0] ? platforms[0].name : '';
      else asset[c.key] = '';
    });
    assets.unshift(asset);
    persistAssets();
    renderInventoryTable();
    renderDashboard();
  });

  document.getElementById('addColumnBtn').addEventListener('click', () => {
    const name = prompt('New column name:');
    if (!name || !name.trim()) return;
    const optionsRaw = prompt('Options for this column, comma-separated (leave blank for free text):', '');
    const key = 'col_' + slugify(name) + '_' + uid('c');
    const col = optionsRaw && optionsRaw.trim()
      ? { key, label: name.trim(), type: 'select', options: optionsRaw.split(',').map((s) => s.trim()).filter(Boolean), core: false }
      : { key, label: name.trim(), type: 'text', core: false };
    assetColumns.push(col);
    assets.forEach((a) => { a[key] = col.type === 'select' ? col.options[0] : ''; });
    persistAssetColumns(); persistAssets();
    renderInventoryHead(); renderInventoryTable();
  });

  /* ------------------------------------------------------------------------
     ACTIVATION FRAMEWORK
     Catálogo, Packs y Retailer Media Kit del Marketing Activation Framework,
     clonando el patrón editable/buscable/extensible de la tabla de Inventory
     de arriba, generalizado en un solo controller reutilizable para las dos
     tablas (Catalog y Media Kit) en vez de duplicar cuatro funciones dos veces.
     ------------------------------------------------------------------------ */

  function buildAFTableController(opts) {
    let search = '';

    function cellHtml(col, row) {
      const value = row[col.key] || '';
      if (col.type === 'select') {
        const color = col.colorMap ? col.colorMap[value] : null;
        const optsHtml = col.options.map((o) => `<option value="${escapeHtml(o)}" ${o === value ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('');
        return `<td><select class="cell-select" data-id="${row.id}" data-key="${col.key}" ${color ? `style="color:${color}"` : ''}>${optsHtml}</select></td>`;
      }
      if (col.type === 'rowSelect') {
        // Las opciones válidas vienen del propio row (col.optionsKey), no de
        // una lista global de la columna, porque cada fila del catálogo
        // tiene su propio menú de formatos válidos. Además de elegir un
        // valor, se puede editar la lista de opciones válidas de esa fila
        // en particular con el lapicito de al lado.
        const rowOptions = row[col.optionsKey] || col.defaultOptions || ['—'];
        const optsHtml = rowOptions.map((o) => `<option value="${escapeHtml(o)}" ${o === value ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('');
        return `<td><div class="cell-with-inline-edit">
          <select class="cell-select" data-id="${row.id}" data-key="${col.key}">${optsHtml}</select>
          <button class="icon-btn icon-btn-tiny" data-edit-row-options="${row.id}" data-options-key="${col.optionsKey}" title="Editar opciones de esta fila" aria-label="Editar opciones de esta fila">
            <svg viewBox="0 0 24 24"><path d="M4 20l4-1 11-11-3-3L5 16l-1 4z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div></td>`;
      }
      return `<td contenteditable="true" data-id="${row.id}" data-key="${col.key}">${escapeHtml(value)}</td>`;
    }

    function editColumn(col) {
      const newLabel = prompt('Nombre de la columna:', col.label);
      if (newLabel === null) return;
      if (!newLabel.trim()) { alert('El nombre no puede quedar vacío.'); return; }
      col.label = newLabel.trim();

      const isDropdownNow = col.type === 'select' || col.type === 'rowSelect';
      const typeAnswer = prompt('Tipo de columna — escribe "texto" para campo libre o "dropdown" para lista desplegable:', isDropdownNow ? 'dropdown' : 'texto');
      if (typeAnswer === null) return;
      const wantsDropdown = typeAnswer.trim().toLowerCase().indexOf('drop') === 0
        || typeAnswer.trim().toLowerCase().indexOf('lista') === 0
        || typeAnswer.trim().toLowerCase().indexOf('menu') === 0;

      if (wantsDropdown) {
        const existingOptions = col.type === 'select' ? (col.options || []) : (col.defaultOptions || []);
        const optionsRaw = prompt('Opciones separadas por coma:', existingOptions.join(', '));
        if (optionsRaw === null) return;
        const options = optionsRaw.split(',').map((s) => s.trim()).filter(Boolean);
        if (!options.length) { alert('Escribe al menos una opción.'); return; }
        col.type = 'select';
        col.options = options;
        delete col.optionsKey;
        delete col.defaultOptions;
        opts.getRows().forEach((r) => { if (options.indexOf(r[col.key]) === -1) r[col.key] = options[0]; });
      } else {
        col.type = 'text';
        delete col.options;
        delete col.optionsKey;
        delete col.defaultOptions;
        delete col.colorMap;
      }
    }

    function renderHead() {
      const thead = document.getElementById(opts.headId);
      if (!thead) return;
      const columns = opts.getColumns();
      thead.innerHTML = `<tr>${columns.map((c) => `
        <th>
          <div class="th-with-action">
            <span class="th-label">${escapeHtml(c.label)}</span>
            <button class="icon-btn" data-edit-col="${c.key}" aria-label="Editar columna" title="Editar columna">
              <svg viewBox="0 0 24 24"><path d="M4 20l4-1 11-11-3-3L5 16l-1 4z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="icon-btn" data-delete-col="${c.key}" aria-label="Eliminar columna" title="Eliminar columna">
              <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </button>
          </div>
        </th>`).join('')}<th></th></tr>`;

      thead.querySelectorAll('[data-edit-col]').forEach((btn) => btn.addEventListener('click', () => {
        const col = opts.getColumns().find((c) => c.key === btn.dataset.editCol);
        if (!col) return;
        editColumn(col);
        opts.persistColumns(); opts.persistRows();
        renderHead(); renderTable();
      }));

      thead.querySelectorAll('[data-delete-col]').forEach((btn) => btn.addEventListener('click', () => {
        const key = btn.dataset.deleteCol;
        if (!confirm('¿Eliminar esta columna? Se borra de todas las filas.')) return;
        opts.setColumns(opts.getColumns().filter((c) => c.key !== key));
        opts.getRows().forEach((r) => { delete r[key]; });
        opts.persistColumns(); opts.persistRows();
        renderHead(); renderTable();
      }));
    }

    function renderTable() {
      const columns = opts.getColumns();
      const q = search.toLowerCase();
      const allRows = opts.getRows();
      const rows = !q ? allRows : allRows.filter((r) => opts.searchKeys.some((k) => (r[k] || '').toLowerCase().includes(q)));

      const body = document.getElementById(opts.bodyId);
      const empty = document.getElementById(opts.emptyId);
      if (!body) return;

      if (rows.length === 0) { body.innerHTML = ''; if (empty) empty.hidden = false; return; }
      if (empty) empty.hidden = true;

      body.innerHTML = rows.map((r) => `
        <tr>
          ${columns.map((c) => cellHtml(c, r)).join('')}
          <td class="row-delete-cell"><button class="icon-btn" data-delete-row="${r.id}" aria-label="Delete row"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></td>
        </tr>
      `).join('');
    }

    function bodyDelegation() {
      const body = document.getElementById(opts.bodyId);
      if (!body) return;

      body.addEventListener('focusout', (e) => {
        const td = e.target.closest('td[contenteditable="true"]');
        if (!td) return;
        const row = opts.getRows().find((r) => r.id === td.dataset.id);
        if (!row) return;
        row[td.dataset.key] = td.textContent.trim();
        opts.persistRows();
      });

      body.addEventListener('change', (e) => {
        const sel = e.target.closest('select.cell-select');
        if (!sel) return;
        const row = opts.getRows().find((r) => r.id === sel.dataset.id);
        if (!row) return;
        row[sel.dataset.key] = sel.value;
        const col = opts.getColumns().find((c) => c.key === sel.dataset.key);
        if (col && col.colorMap) sel.style.color = col.colorMap[sel.value] || '';
        opts.persistRows();
      });

      body.addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-edit-row-options]');
        if (editBtn) {
          const row = opts.getRows().find((r) => r.id === editBtn.dataset.editRowOptions);
          if (!row) return;
          const key = editBtn.dataset.optionsKey;
          const col = opts.getColumns().find((c) => c.optionsKey === key);
          const current = row[key] || (col && col.defaultOptions) || [];
          const raw = prompt('Opciones válidas para esta fila, separadas por coma:', current.join(', '));
          if (raw === null) return;
          const newOptions = raw.split(',').map((s) => s.trim()).filter(Boolean);
          if (!newOptions.length) { alert('Escribe al menos una opción.'); return; }
          row[key] = newOptions;
          if (col && newOptions.indexOf(row[col.key]) === -1) row[col.key] = newOptions[0];
          opts.persistRows();
          renderTable();
          return;
        }
        const btn = e.target.closest('[data-delete-row]');
        if (!btn) return;
        if (!confirm('¿Eliminar esta fila?')) return;
        opts.setRows(opts.getRows().filter((r) => r.id !== btn.dataset.deleteRow));
        opts.persistRows();
        renderTable();
      });
    }

    const searchEl = document.getElementById(opts.searchId);
    if (searchEl) searchEl.addEventListener('input', (e) => { search = e.target.value; renderTable(); });

    const addRowBtn = document.getElementById(opts.addRowBtnId);
    if (addRowBtn) addRowBtn.addEventListener('click', () => {
      const columns = opts.getColumns();
      const row = { id: uid('af') };
      columns.forEach((c) => {
        if (c.type === 'select') { row[c.key] = c.options[0]; return; }
        if (c.type === 'rowSelect') {
          const fallback = c.defaultOptions || ['—'];
          row[c.optionsKey] = fallback;
          row[c.key] = fallback[0];
          return;
        }
        row[c.key] = '';
      });
      opts.setRows([row, ...opts.getRows()]);
      opts.persistRows();
      renderTable();
    });

    const addColBtn = document.getElementById(opts.addColBtnId);
    if (addColBtn) addColBtn.addEventListener('click', () => {
      const name = prompt('Nombre de la nueva columna:');
      if (!name || !name.trim()) return;
      const optionsRaw = prompt('Opciones separadas por coma (dejar vacío para texto libre):', '');
      const key = 'col_' + slugify(name) + '_' + uid('c');
      const col = optionsRaw && optionsRaw.trim()
        ? { key, label: name.trim(), type: 'select', options: optionsRaw.split(',').map((s) => s.trim()).filter(Boolean), core: false }
        : { key, label: name.trim(), type: 'text', core: false };
      opts.setColumns([...opts.getColumns(), col]);
      opts.getRows().forEach((r) => { r[key] = col.type === 'select' ? col.options[0] : ''; });
      opts.persistColumns(); opts.persistRows();
      renderHead(); renderTable();
    });

    return { renderHead, renderTable, bodyDelegation };
  }

  const afCatalogController = buildAFTableController({
    getColumns: () => afCatalogColumns,
    setColumns: (v) => { afCatalogColumns = v; },
    getRows: () => afCatalog,
    setRows: (v) => { afCatalog = v; },
    persistColumns: persistAFCatalogColumns,
    persistRows: persistAFCatalog,
    headId: 'afCatalogHead', bodyId: 'afCatalogBody', emptyId: 'afCatalogEmpty', searchId: 'afCatalogSearch',
    searchKeys: ['category', 'activation'],
    addRowBtnId: 'afCatalogAddRowBtn', addColBtnId: 'afCatalogAddColumnBtn',
  });

  const afMediaKitController = buildAFTableController({
    getColumns: () => afMediaKitColumns,
    setColumns: (v) => { afMediaKitColumns = v; },
    getRows: () => afMediaKit,
    setRows: (v) => { afMediaKit = v; },
    persistColumns: persistAFMediaKitColumns,
    persistRows: persistAFMediaKit,
    headId: 'afMediaKitHead', bodyId: 'afMediaKitBody', emptyId: 'afMediaKitEmpty', searchId: 'afMediaKitSearch',
    searchKeys: ['country', 'retailer'],
    addRowBtnId: 'afMediaKitAddRowBtn', addColBtnId: 'afMediaKitAddColumnBtn',
  });

  const afTradeController = buildAFTableController({
    getColumns: () => afTradeColumns,
    setColumns: (v) => { afTradeColumns = v; },
    getRows: () => afTrade,
    setRows: (v) => { afTrade = v; },
    persistColumns: persistAFTradeColumns,
    persistRows: persistAFTrade,
    headId: 'afTradeHead', bodyId: 'afTradeBody', emptyId: 'afTradeEmpty', searchId: 'afTradeSearch',
    searchKeys: ['category', 'activation'],
    addRowBtnId: 'afTradeAddRowBtn', addColBtnId: 'afTradeAddColumnBtn',
  });

  const afBrandController = buildAFTableController({
    getColumns: () => afBrandColumns,
    setColumns: (v) => { afBrandColumns = v; },
    getRows: () => afBrand,
    setRows: (v) => { afBrand = v; },
    persistColumns: persistAFBrandColumns,
    persistRows: persistAFBrand,
    headId: 'afBrandHead', bodyId: 'afBrandBody', emptyId: 'afBrandEmpty', searchId: 'afBrandSearch',
    searchKeys: ['category', 'deliverable'],
    addRowBtnId: 'afBrandAddRowBtn', addColBtnId: 'afBrandAddColumnBtn',
  });

  function renderAFCatalog() { afCatalogController.renderHead(); afCatalogController.renderTable(); }
  function renderAFMediaKit() { afMediaKitController.renderHead(); afMediaKitController.renderTable(); }
  function renderAFTrade() { afTradeController.renderHead(); afTradeController.renderTable(); }
  function renderAFBrand() { afBrandController.renderHead(); afBrandController.renderTable(); }

  function afPackFindItemArray(pack, areaKey) {
    if (areaKey === 'brand') return pack.brand;
    if (areaKey === 'digital') return pack.digital;
    if (areaKey === 'trade') return pack.trade;
    return null;
  }

  function renderAFPacks() {
    const grid = document.getElementById('afPackGrid');
    if (!grid) return;

    const areaBlock = (label, packId, areaKey, items, withFormat) => {
      const rows = items || [];
      return `
        <div class="af-pack-area">
          <div class="af-pack-area-label">
            <span>${escapeHtml(label)}</span>
            <button class="icon-btn icon-btn-tiny" data-pack-add-item="${packId}" data-pack-area="${areaKey}" title="Agregar item">
              <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </button>
          </div>
          ${!rows.length ? `<p class="af-builder-empty">Sin items todavía.</p>` : `
          <ul class="af-pack-list af-pack-list-editable">
            ${rows.map((it) => `
              <li data-pack-item="${it.id}">
                <span class="af-pack-item-name" contenteditable="true" data-pack-item-field="activation" data-pack-item="${it.id}" data-pack-id="${packId}" data-pack-area="${areaKey}">${escapeHtml(it.activation || '')}</span>
                ${withFormat ? `<span class="af-pack-format af-pack-item-format" contenteditable="true" data-pack-item-field="format" data-pack-item="${it.id}" data-pack-id="${packId}" data-pack-area="${areaKey}" title="Formato sugerido">${escapeHtml(it.format || '')}</span>` : ''}
                <span class="af-pack-item-note" contenteditable="true" data-pack-item-field="note" data-pack-item="${it.id}" data-pack-id="${packId}" data-pack-area="${areaKey}" title="Nota">${escapeHtml(it.note || '')}</span>
                <button class="icon-btn icon-btn-tiny" data-pack-delete-item="${it.id}" data-pack-id="${packId}" data-pack-area="${areaKey}" title="Eliminar item" aria-label="Eliminar item">
                  <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
                </button>
              </li>`).join('')}
          </ul>`}
        </div>`;
    };

    grid.innerHTML = afPacks.map((p) => `
      <div class="panel-card af-pack-card">
        <div class="af-pack-card-head">
          <h3 contenteditable="true" data-pack-field="name" data-pack-id="${p.id}">${escapeHtml(p.name)}</h3>
          <button class="icon-btn" data-delete-pack="${p.id}" title="Eliminar pack" aria-label="Eliminar pack">
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
        </div>
        <p class="view-intro af-pack-usecase" contenteditable="true" data-pack-field="useCase" data-pack-id="${p.id}" style="font-style:italic; margin-bottom:10px;">${escapeHtml(p.useCase || '')}</p>
        ${areaBlock('Brand', p.id, 'brand', p.brand, false)}
        ${areaBlock('Digital', p.id, 'digital', p.digital, true)}
        ${areaBlock('Trade', p.id, 'trade', p.trade, false)}
        <div class="af-pack-area">
          <div class="af-pack-area-label"><span>Media Kit sugerido</span></div>
          <p class="af-pack-mediakit" contenteditable="true" data-pack-field="mediaKitSuggestion" data-pack-id="${p.id}">${escapeHtml(p.mediaKitSuggestion || '')}</p>
        </div>
      </div>
    `).join('');

    // ---- edición inline de campos del pack (nombre, use case, media kit) ----
    grid.querySelectorAll('[contenteditable][data-pack-field]').forEach((el) => {
      el.addEventListener('focusout', () => {
        const pack = afPacks.find((p) => p.id === el.dataset.packId);
        if (!pack) return;
        pack[el.dataset.packField] = el.textContent.trim();
        persistAFPacks();
      });
    });

    // ---- edición inline de campos de un item (activation / format / note) ----
    grid.querySelectorAll('[contenteditable][data-pack-item-field]').forEach((el) => {
      el.addEventListener('focusout', () => {
        const pack = afPacks.find((p) => p.id === el.dataset.packId);
        if (!pack) return;
        const arr = afPackFindItemArray(pack, el.dataset.packArea);
        const item = arr && arr.find((it) => it.id === el.dataset.packItem);
        if (!item) return;
        item[el.dataset.packItemField] = el.textContent.trim();
        persistAFPacks();
      });
    });

    // ---- agregar / eliminar item dentro de un área ----
    grid.querySelectorAll('[data-pack-add-item]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pack = afPacks.find((p) => p.id === btn.dataset.packAddItem);
        if (!pack) return;
        const arr = afPackFindItemArray(pack, btn.dataset.packArea);
        if (!arr) return;
        arr.push({ id: uid('pit'), activation: 'Nueva acción', format: '', note: '' });
        persistAFPacks();
        renderAFPacks();
      });
    });
    grid.querySelectorAll('[data-pack-delete-item]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('¿Eliminar este item del pack?')) return;
        const pack = afPacks.find((p) => p.id === btn.dataset.packId);
        if (!pack) return;
        const arr = afPackFindItemArray(pack, btn.dataset.packArea);
        if (!arr) return;
        const idx = arr.findIndex((it) => it.id === btn.dataset.packDeleteItem);
        if (idx !== -1) arr.splice(idx, 1);
        persistAFPacks();
        renderAFPacks();
      });
    });

    // ---- eliminar pack completo ----
    grid.querySelectorAll('[data-delete-pack]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('¿Eliminar este pack completo? Esto no borra ninguna campaña ya guardada que lo haya usado.')) return;
        afPacks = afPacks.filter((p) => p.id !== btn.dataset.deletePack);
        persistAFPacks();
        renderAFPacks();
      });
    });
  }

  const afPackAddBtn = document.getElementById('afPackAddBtn');
  if (afPackAddBtn) afPackAddBtn.addEventListener('click', () => {
    afPacks.push({
      id: uid('pack'),
      name: 'Nuevo Pack',
      useCase: 'Describe acá cuándo usar este pack…',
      brand: [], digital: [], trade: [],
      mediaKitSuggestion: '',
    });
    persistAFPacks();
    renderAFPacks();
  });

  /* ------------------------------------------------------------------------
     REGISTRO DE CAMPAÑAS — banco + builder ("Crear Nueva Campaña")
     El builder es un formulario de una sola vista (sin pasos ocultos, para
     no complicar la edición posterior): datos generales, Pack o Campaña
     Personalizada, checklists de Digital/Trade/Brand (con Formato en las
     filas de Digital que lo tengan), Media Kit filtrado por el retailer
     elegido, y observaciones finales. Todo se guarda como un solo registro
     en el banco de campañas.
     ------------------------------------------------------------------------ */

  let afBuilderState = null; // { editingId, name, country, retailer, packUsed, digital: {activation: format|true}, trade: Set, brand: Set, mediaKit: {item: source}, observations }
  let afCampaignSearchState = '';

  // Los países/retailers salen del Media Kit + de los que ya se usaron en
  // campañas anteriores, así un país o retailer sin Media Kit cargado (que
  // se agregó a mano una vez desde el builder) queda disponible para elegir
  // de nuevo la próxima vez, sin depender de que Media Kit lo tenga.
  function afCountryOptions() {
    const fromKit = afMediaKit.map((r) => r.country).filter(Boolean);
    const fromCampaigns = afCampaigns.map((c) => c.country).filter(Boolean);
    return Array.from(new Set([...fromKit, ...fromCampaigns])).sort();
  }

  function afRetailerOptionsForCountry(country) {
    if (!country) return [];
    const fromKit = afMediaKit.filter((r) => r.country === country).map((r) => r.retailer);
    const fromCampaigns = afCampaigns.filter((c) => c.country === country).map((c) => c.retailer);
    return Array.from(new Set([...fromKit, ...fromCampaigns].filter(Boolean)));
  }

  function afMediaKitRowsForRetailer(retailer) {
    if (!retailer) return [];
    return afMediaKit.filter((r) => r.retailer === retailer);
  }

  function findAFPack(name) { return afPacks.find((p) => p.name === name); }

  function freshBuilderState() {
    return {
      editingId: null,
      name: '',
      country: '',
      retailer: '',
      startDate: '',
      packUsed: '',
      digital: {},
      trade: {},
      brand: {},
      mediaKit: {},
      observations: '',
      status: 'Pending',
    };
  }

  function applyPackToState(packName) {
    afBuilderState.packUsed = packName;
    afBuilderState.digital = {};
    afBuilderState.trade = {};
    afBuilderState.brand = {};
    const pack = findAFPack(packName);
    if (pack) {
      (pack.digital || []).forEach((it) => { afBuilderState.digital[it.activation] = it.format || true; });
      (pack.trade || []).forEach((it) => { afBuilderState.trade[it.activation] = true; });
      (pack.brand || []).forEach((it) => { afBuilderState.brand[it.activation] = true; });
    }
    renderBuilderBody();
  }

  function afCheckListHtml(rows, stateObj, opts) {
    // opts: { nameKey, descKey, groupKey, withFormat }
    if (!rows.length) return `<p class="af-builder-empty">No hay filas en este catálogo todavía.</p>`;
    return `<div class="af-check-list">${rows.map((r) => {
      const name = r[opts.nameKey];
      const checked = Object.prototype.hasOwnProperty.call(stateObj, name);
      const desc = opts.descKey && r[opts.descKey] ? `<span class="af-check-item-desc">${escapeHtml(r[opts.descKey])}</span>` : '';
      let formatSelect = '';
      if (opts.withFormat) {
        const options = r.formatOptions || ['—'];
        const current = (typeof stateObj[name] === 'string') ? stateObj[name] : (r.format || options[0]);
        formatSelect = `<select class="af-format-select" data-af-format-for="${escapeHtml(name)}" ${checked ? '' : 'disabled'}>${options.map((o) => `<option value="${escapeHtml(o)}" ${o === current ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}</select>`;
      }
      return `
        <label class="af-check-item">
          <input type="checkbox" data-af-check="${escapeHtml(name)}" ${checked ? 'checked' : ''}>
          <span class="af-check-item-label">${escapeHtml(name)}${desc}</span>
          ${formatSelect}
        </label>`;
    }).join('')}</div>`;
  }

  function renderBuilderBody() {
    const body = document.getElementById('afBuilderBody');
    if (!body || !afBuilderState) return;
    const s = afBuilderState;
    const countries = afCountryOptions();
    const retailers = afRetailerOptionsForCountry(s.country);
    // Si el país/retailer de esta campaña es uno recién escrito a mano (no
    // está todavía ni en Media Kit ni en ninguna otra campaña), lo agregamos
    // igual a la lista para que el select lo muestre seleccionado.
    const countryOptions = (s.country && countries.indexOf(s.country) === -1) ? [...countries, s.country] : countries;
    const retailerOptions = (s.retailer && retailers.indexOf(s.retailer) === -1) ? [...retailers, s.retailer] : retailers;
    const mediaKitRows = afMediaKitRowsForRetailer(s.retailer);

    document.getElementById('afBuilderTitle').textContent = s.editingId ? 'Editar Campaña' : 'Nueva Campaña';

    body.innerHTML = `
      <div class="af-builder-step-label">Datos generales</div>
      <div class="brief-form-grid" style="grid-template-columns: repeat(4, 1fr);">
        <div class="field-group">
          <label class="field-label">Nombre de la campaña</label>
          <input type="text" class="text-input" id="afFormName" value="${escapeHtml(s.name)}" placeholder="Ej. Heritage Month 2026 — Arepa Maker">
        </div>
        <div class="field-group">
          <label class="field-label">País</label>
          <select class="text-input" id="afFormCountry">
            <option value="">Elegir país…</option>
            ${countryOptions.map((c) => `<option value="${escapeHtml(c)}" ${c === s.country ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
            <option value="__new_country__">+ Agregar país nuevo…</option>
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Retailer</label>
          <select class="text-input" id="afFormRetailer" ${!s.country ? 'disabled' : ''}>
            <option value="">${s.country ? 'Elegir retailer…' : 'Elegí un país primero'}</option>
            ${retailerOptions.map((r) => `<option value="${escapeHtml(r)}" ${r === s.retailer ? 'selected' : ''}>${escapeHtml(r)}</option>`).join('')}
            ${s.country ? `<option value="__new_retailer__">+ Agregar retailer nuevo…</option>` : ''}
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Inicio de campaña</label>
          <input type="date" class="text-input" id="afFormStartDate" value="${escapeHtml(s.startDate || '')}">
        </div>
      </div>

      <div class="af-builder-step-label">Pack o Campaña Personalizada</div>
      <p class="af-builder-hint">Elegí un Pack como punto de partida (se marcan sus acciones sugeridas abajo, y las puedes ajustar libremente) o "Campaña Personalizada" para armar todo desde cero.</p>
      <div class="af-pack-picker">
        ${afPacks.map((p) => `
          <div class="af-pack-choice ${s.packUsed === p.name ? 'selected' : ''}" data-af-pack-choice="${escapeHtml(p.name)}">
            <div class="af-pack-choice-name">${escapeHtml(p.name)}</div>
            <div class="af-pack-choice-desc">${escapeHtml(p.useCase)}</div>
          </div>`).join('')}
        <div class="af-pack-choice ${s.packUsed === 'Campaña Personalizada' ? 'selected' : ''}" data-af-pack-choice="Campaña Personalizada">
          <div class="af-pack-choice-name">Campaña Personalizada</div>
          <div class="af-pack-choice-desc">Armar el mix desde cero, sin punto de partida</div>
        </div>
      </div>

      <div class="af-builder-step-label">Acciones Digital</div>
      <div data-af-group="digital">${afCheckListHtml(afCatalog, s.digital, { nameKey: 'activation', withFormat: true })}</div>

      <div class="af-builder-step-label">Acciones Trade</div>
      <div data-af-group="trade">${afCheckListHtml(afTrade, s.trade, { nameKey: 'activation', descKey: 'description' })}</div>

      <div class="af-builder-step-label">Acciones Brand</div>
      <div data-af-group="brand">${afCheckListHtml(afBrand, s.brand, { nameKey: 'deliverable', descKey: 'spec' })}</div>

      <div class="af-builder-step-label">Media Kit (opcional)</div>
      ${!s.retailer
        ? `<p class="af-builder-empty">Elegí un retailer arriba para ver su Media Kit.</p>`
        : (mediaKitRows.length === 0
          ? `<p class="af-builder-empty">Todavía no hay Media Kit cargado para ${escapeHtml(s.retailer)}.</p>`
          : `<div class="af-check-list">${mediaKitRows.map((r) => {
              const checked = Object.prototype.hasOwnProperty.call(s.mediaKit, r.id);
              const current = s.mediaKit[r.id] || 'Negociar con retailer';
              return `
                <label class="af-check-item">
                  <input type="checkbox" data-af-mediakit-check="${r.id}" ${checked ? 'checked' : ''}>
                  <span class="af-check-item-label">${escapeHtml(r.inventory)}<span class="af-check-item-desc">${escapeHtml(r.negotiability)} · actualizado ${escapeHtml(r.lastUpdated)}</span></span>
                  <select class="af-mediakit-source-select" data-af-mediakit-source-for="${r.id}" ${checked ? '' : 'disabled'}>
                    ${AF_MEDIAKIT_SOURCE_OPTIONS.map((o) => `<option value="${escapeHtml(o)}" ${o === current ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                  </select>
                </label>`;
            }).join('')}</div>`)
      }

      <div class="af-builder-step-label">Observaciones finales</div>
      <textarea class="text-area" id="afFormObservations" rows="3" placeholder="Puntos negociados, condiciones especiales, lo que se acordó con el retailer…">${escapeHtml(s.observations)}</textarea>

      <div class="af-builder-actions">
        <div>${s.editingId ? '<button class="btn btn-ghost" id="afBuilderDeleteBtn">Eliminar campaña</button>' : ''}</div>
        <div class="af-builder-actions-right">
          <button class="btn btn-ghost" id="afBuilderCancelBtn">Cancelar</button>
          <button class="btn btn-primary" id="afBuilderSaveBtn">Guardar Campaña</button>
        </div>
      </div>
    `;

    // ---- wiring ----
    document.getElementById('afFormName').addEventListener('input', (e) => { s.name = e.target.value; });
    document.getElementById('afFormCountry').addEventListener('change', (e) => {
      if (e.target.value === '__new_country__') {
        const typed = prompt('Nombre del país nuevo:');
        if (!typed || !typed.trim()) { renderBuilderBody(); return; }
        s.country = typed.trim();
      } else {
        s.country = e.target.value;
      }
      s.retailer = '';
      s.mediaKit = {};
      renderBuilderBody();
    });
    document.getElementById('afFormRetailer').addEventListener('change', (e) => {
      if (e.target.value === '__new_retailer__') {
        const typed = prompt('Nombre del retailer nuevo para ' + s.country + ':');
        if (!typed || !typed.trim()) { renderBuilderBody(); return; }
        s.retailer = typed.trim();
      } else {
        s.retailer = e.target.value;
      }
      s.mediaKit = {};
      renderBuilderBody();
    });
    document.getElementById('afFormStartDate').addEventListener('change', (e) => { s.startDate = e.target.value; });
    document.getElementById('afFormObservations').addEventListener('input', (e) => { s.observations = e.target.value; });

    body.querySelectorAll('[data-af-pack-choice]').forEach((el) => {
      el.addEventListener('click', () => applyPackToState(el.dataset.afPackChoice));
    });

    body.querySelectorAll('[data-af-check]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const name = el.dataset.afCheck;
        // A qué catálogo pertenece este checkbox lo dice el contenedor
        // data-af-group más cercano, no la posición en la lista (así no se
        // rompe si algún catálogo queda vacío).
        const group = el.closest('[data-af-group]');
        let target = null;
        if (group) {
          if (group.dataset.afGroup === 'digital') target = s.digital;
          else if (group.dataset.afGroup === 'trade') target = s.trade;
          else if (group.dataset.afGroup === 'brand') target = s.brand;
        }
        if (!target) return;
        if (e.target.checked) target[name] = true; else delete target[name];
        renderBuilderBody();
      });
    });

    body.querySelectorAll('[data-af-format-for]').forEach((sel) => {
      sel.addEventListener('change', (e) => { s.digital[sel.dataset.afFormatFor] = e.target.value; });
    });

    body.querySelectorAll('[data-af-mediakit-check]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const id = el.dataset.afMediakitCheck;
        if (e.target.checked) s.mediaKit[id] = s.mediaKit[id] || 'Negociar con retailer'; else delete s.mediaKit[id];
        renderBuilderBody();
      });
    });
    body.querySelectorAll('[data-af-mediakit-source-for]').forEach((sel) => {
      sel.addEventListener('change', (e) => { s.mediaKit[sel.dataset.afMediakitSourceFor] = e.target.value; });
    });

    document.getElementById('afBuilderCancelBtn').addEventListener('click', closeCampaignBuilder);
    document.getElementById('afBuilderSaveBtn').addEventListener('click', saveCampaignFromBuilder);
    const delBtn = document.getElementById('afBuilderDeleteBtn');
    if (delBtn) delBtn.addEventListener('click', () => {
      if (!confirm('¿Eliminar esta campaña del registro?')) return;
      afCampaigns = afCampaigns.filter((c) => c.id !== s.editingId);
      persistAFCampaigns();
      closeCampaignBuilder();
      renderAFCampaignBank();
    });
  }

  function openCampaignBuilder(existingCampaign) {
    if (existingCampaign) {
      afBuilderState = {
        editingId: existingCampaign.id,
        name: existingCampaign.name,
        country: existingCampaign.country,
        retailer: existingCampaign.retailer,
        startDate: existingCampaign.startDate || '',
        packUsed: existingCampaign.packUsed,
        digital: {}, trade: {}, brand: {}, mediaKit: {},
        observations: existingCampaign.observations || '',
        status: existingCampaign.status || 'Pending',
      };
      (existingCampaign.digitalActions || []).forEach((it) => { afBuilderState.digital[it.activation] = it.format || true; });
      (existingCampaign.tradeActions || []).forEach((it) => { afBuilderState.trade[it.activation] = true; });
      (existingCampaign.brandActions || []).forEach((it) => { afBuilderState.brand[it.activation] = true; });
      (existingCampaign.mediaKitItems || []).forEach((it) => { if (it.id) afBuilderState.mediaKit[it.id] = it.source; });
    } else {
      afBuilderState = freshBuilderState();
    }
    renderBuilderBody();
    document.getElementById('afBuilderOverlay').classList.add('active');
  }

  function closeCampaignBuilder() {
    document.getElementById('afBuilderOverlay').classList.remove('active');
    afBuilderState = null;
  }

  function saveCampaignFromBuilder() {
    const s = afBuilderState;
    if (!s.name.trim() || !s.country || !s.retailer) {
      alert('Completa al menos el nombre, el país y el retailer antes de guardar.');
      return;
    }
    const digitalActions = Object.keys(s.digital).map((activation) => ({ activation, format: typeof s.digital[activation] === 'string' ? s.digital[activation] : '' }));
    const tradeActions = Object.keys(s.trade).map((activation) => ({ activation }));
    const brandActions = Object.keys(s.brand).map((activation) => ({ activation }));
    const mediaKitItems = Object.keys(s.mediaKit).map((id) => {
      const row = afMediaKit.find((r) => r.id === id);
      return { id, item: row ? row.inventory : id, source: s.mediaKit[id] };
    });

    const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

    if (s.editingId) {
      const existing = afCampaigns.find((c) => c.id === s.editingId);
      if (existing) {
        existing.name = s.name.trim();
        existing.country = s.country;
        existing.retailer = s.retailer;
        existing.startDate = s.startDate || '';
        existing.packUsed = s.packUsed || 'Campaña Personalizada';
        existing.digitalActions = digitalActions;
        existing.tradeActions = tradeActions;
        existing.brandActions = brandActions;
        existing.mediaKitItems = mediaKitItems;
        existing.observations = s.observations;
      }
    } else {
      afCampaigns.unshift({
        id: uid('afcamp'),
        name: s.name.trim(),
        country: s.country,
        retailer: s.retailer,
        startDate: s.startDate || '',
        packUsed: s.packUsed || 'Campaña Personalizada',
        digitalActions, tradeActions, brandActions, mediaKitItems,
        observations: s.observations,
        status: 'Pending',
        date: dateStr,
      });
    }
    persistAFCampaigns();
    closeCampaignBuilder();
    renderAFCampaignBank();
  }

  function afFormatDate(iso) {
    if (!iso) return '—';
    // El input type="date" entrega "YYYY-MM-DD"; se parsea a mano en vez de
    // con `new Date(iso)` para no arrastrar corrimiento de zona horaria.
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function afCampaignStatusChipClass(status) {
    if (status === 'Approved') return 'chip-green';
    if (status === 'Proposal') return 'chip-navy';
    return 'chip-amber';
  }

  function renderAFCampaignBank() {
    const body = document.getElementById('afCampaignBody');
    const empty = document.getElementById('afCampaignEmpty');
    if (!body) return;
    const q = afCampaignSearchState.toLowerCase();
    const rows = !q ? afCampaigns : afCampaigns.filter((c) =>
      (c.name || '').toLowerCase().includes(q) || (c.country || '').toLowerCase().includes(q) || (c.retailer || '').toLowerCase().includes(q));

    if (rows.length === 0) { body.innerHTML = ''; if (empty) empty.hidden = false; return; }
    if (empty) empty.hidden = true;

    body.innerHTML = rows.map((c) => `
      <tr>
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.country)}</td>
        <td>${escapeHtml(c.retailer)}</td>
        <td>${escapeHtml(c.packUsed)}</td>
        <td>
          <select class="status-select ${afCampaignStatusChipClass(c.status)}" data-af-campaign-status="${c.id}">
            ${['Pending', 'Approved', 'Proposal'].map((st) => `<option value="${st}" ${st === c.status ? 'selected' : ''}>${st}</option>`).join('')}
          </select>
        </td>
        <td>${afFormatDate(c.startDate)}</td>
        <td>${escapeHtml(c.date || '')}</td>
        <td class="af-campaign-actions-cell">
          <button class="icon-btn" data-af-view-campaign="${c.id}" aria-label="Ver / Editar" title="Ver / Editar"><svg viewBox="0 0 24 24"><path d="M4 12s3.5-6 8-6 8 6 8 6-3.5 6-8 6-8-6-8-6z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button>
          <button class="icon-btn" data-af-export-campaign="${c.id}" aria-label="Exportar PDF" title="Exportar PDF"><svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9 13h6M9 16h6M9 10h2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </td>
      </tr>
    `).join('');

    body.querySelectorAll('[data-af-campaign-status]').forEach((sel) => {
      sel.addEventListener('change', (e) => {
        const c = afCampaigns.find((x) => x.id === sel.dataset.afCampaignStatus);
        if (!c) return;
        c.status = e.target.value;
        sel.className = `status-select ${afCampaignStatusChipClass(c.status)}`;
        persistAFCampaigns();
      });
    });
    body.querySelectorAll('[data-af-view-campaign]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const c = afCampaigns.find((x) => x.id === btn.dataset.afViewCampaign);
        if (c) openCampaignBuilder(c);
      });
    });
    body.querySelectorAll('[data-af-export-campaign]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const c = afCampaigns.find((x) => x.id === btn.dataset.afExportCampaign);
        if (c) exportCampaignPDF(c);
      });
    });
  }

  function afListOrEmpty(items, formatter) {
    if (!items || !items.length) return `<p class="af-campaign-detail-empty">Ninguna</p>`;
    return `<ul class="af-campaign-detail-list">${items.map((it) => `<li>${formatter(it)}</li>`).join('')}</ul>`;
  }

  function exportCampaignPDF(campaign) {
    const area = document.getElementById('afCampaignPrintArea');
    if (!area) return;
    area.innerHTML = `
      <div class="af-print-title">${escapeHtml(campaign.name)}</div>
      <div class="af-print-sub">${escapeHtml(campaign.country)} · ${escapeHtml(campaign.retailer)} · ${escapeHtml(campaign.packUsed)} · Estado: ${escapeHtml(campaign.status)} · Inicio: ${afFormatDate(campaign.startDate)} · Creada: ${escapeHtml(campaign.date || '')}</div>

      <div class="af-campaign-detail-section-label">Acciones Digital</div>
      ${afListOrEmpty(campaign.digitalActions, (it) => `${escapeHtml(it.activation)}${it.format ? ` — ${escapeHtml(it.format)}` : ''}`)}

      <div class="af-campaign-detail-section-label">Acciones Trade</div>
      ${afListOrEmpty(campaign.tradeActions, (it) => escapeHtml(it.activation))}

      <div class="af-campaign-detail-section-label">Acciones Brand</div>
      ${afListOrEmpty(campaign.brandActions, (it) => escapeHtml(it.activation))}

      <div class="af-campaign-detail-section-label">Media Kit</div>
      ${afListOrEmpty(campaign.mediaKitItems, (it) => `${escapeHtml(it.item)} — ${escapeHtml(it.source)}`)}

      <div class="af-campaign-detail-section-label">Observaciones finales</div>
      <p class="af-campaign-detail-list">${escapeHtml(campaign.observations || 'Ninguna')}</p>
    `;
    printAreaWhenReady(area);
  }

  // Espera a que todas las imágenes dentro del área imprimible terminen de
  // decodificar antes de llamar a window.print(). Sin esto, si el área tiene
  // <img> con src recién asignado (charts, creatividades en base64), el
  // navegador puede paginar antes de que la imagen termine de cargar y deja
  // una primera página en blanco seguida recién ahí del contenido real.
  function printAreaWhenReady(area) {
    area.classList.add('printing');
    const imgs = Array.from(area.querySelectorAll('img'));
    const waits = imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    });
    // Carrera contra un tope de 3s — si alguna imagen nunca dispara load/error
    // (conexión rara, src inválido) no se queda pegado sin imprimir nunca.
    const allLoaded = Promise.all(waits);
    const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
    Promise.race([allLoaded, timeout]).then(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.print();
          setTimeout(() => area.classList.remove('printing'), 500);
        });
      });
    });
  }

  document.getElementById('afNewCampaignBtn').addEventListener('click', () => openCampaignBuilder(null));
  document.getElementById('afBuilderCloseBtn').addEventListener('click', closeCampaignBuilder);
  document.getElementById('afBuilderOverlay').addEventListener('click', (e) => { if (e.target.id === 'afBuilderOverlay') closeCampaignBuilder(); });
  document.getElementById('afCampaignSearch').addEventListener('input', (e) => { afCampaignSearchState = e.target.value; renderAFCampaignBank(); });

  function renderActivationFramework() {
    renderAFCatalog();
    renderAFTrade();
    renderAFBrand();
    renderAFPacks();
    renderAFMediaKit();
    renderAFCampaignBank();
  }

  function afGoToTab(name) {
    document.querySelectorAll('#afTabs .af-tab').forEach((t) => t.classList.toggle('active', t.dataset.afTab === name));
    document.querySelectorAll('.af-tab-panel').forEach((p) => p.classList.toggle('active', p.id === 'afPanel-' + name));
  }
  document.querySelectorAll('#afTabs .af-tab').forEach((tab) => {
    tab.addEventListener('click', () => afGoToTab(tab.dataset.afTab));
  });

  /* ------------------------------------------------------------------------
     ACCESS MATRIX
     ------------------------------------------------------------------------ */

  function cycleAccess(platformId, roleId) {
    if (!accessState[platformId]) accessState[platformId] = defaultAccessRow();
    const current = accessState[platformId][roleId] || 'none';
    const idx = ACCESS_LEVELS.indexOf(current);
    accessState[platformId][roleId] = ACCESS_LEVELS[(idx + 1) % ACCESS_LEVELS.length];
    persistAccess();
    renderAccessMatrix();
    renderDashboard();
  }

  function renderAccessMatrix() {
    const table = document.getElementById('accessMatrixTable');
    const thead = `<thead><tr><th>Platform</th>${matrixRoles.map((r) => `
      <th>
        <div class="th-with-action">
          <span class="th-label editable" data-rename-role="${r.id}">${escapeHtml(r.label)}</span>
          ${!r.core ? `<button class="icon-btn" data-delete-role="${r.id}" aria-label="Delete role"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>` : ''}
        </div>
      </th>`).join('')}</tr></thead>`;

    const tbody = `<tbody>${platforms.map((p) => `
      <tr>
        <td>
          <div class="platform-name-cell">
            <span>${escapeHtml(p.name)}</span>
            <button class="icon-btn" data-delete-platform="${p.id}" aria-label="Remove platform"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
          </div>
        </td>
        ${matrixRoles.map((role) => {
          const level = (accessState[p.id] && accessState[p.id][role.id]) || 'none';
          return `<td class="access-cell" data-platform="${p.id}" data-role="${role.id}"><span class="access-badge ${ACCESS_CLASS[level]}">${ACCESS_LABEL[level]}</span></td>`;
        }).join('')}
      </tr>
    `).join('')}</tbody>`;

    table.innerHTML = thead + tbody;

    table.querySelectorAll('.access-cell').forEach((cell) => {
      cell.addEventListener('click', () => cycleAccess(cell.dataset.platform, cell.dataset.role));
    });

    table.querySelectorAll('[data-rename-role]').forEach((el) => {
      el.addEventListener('click', () => {
        const role = matrixRoles.find((r) => r.id === el.dataset.renameRole);
        if (!role) return;
        const next = prompt('Rename role:', role.label);
        if (!next || !next.trim() || next.trim() === role.label) return;
        role.label = next.trim();
        persistRoles();
        renderAccessMatrix();
      });
    });

    table.querySelectorAll('[data-delete-role]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.deleteRole;
        if (!confirm('Delete this role column? Access levels for it will be removed on every platform.')) return;
        matrixRoles = matrixRoles.filter((r) => r.id !== id);
        Object.keys(accessState).forEach((pid) => { if (accessState[pid]) delete accessState[pid][id]; });
        persistRoles(); persistAccess();
        renderAccessMatrix(); renderDashboard();
      });
    });

    table.querySelectorAll('[data-delete-platform]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.deletePlatform;
        if (!confirm('Remove this platform? It will also disappear from Platform Audit.')) return;
        removePlatform(id);
        renderAccessMatrix();
        renderPlatformAudit(document.getElementById('auditSearch').value);
        renderDashboard();
      });
    });

    document.getElementById('accessLegend').innerHTML = ACCESS_LEVELS.map((lvl) => `
      <div class="legend-item"><span class="legend-swatch ${ACCESS_CLASS[lvl]}"></span>${ACCESS_LABEL[lvl]}</div>
    `).join('');
  }

  document.getElementById('addRoleBtn').addEventListener('click', () => {
    const label = prompt('New role name (e.g. "Content Agency", "Freelancer — Ads"):');
    if (!label || !label.trim()) return;
    const role = { id: uid('role'), label: label.trim(), core: false };
    matrixRoles.push(role);
    platforms.forEach((p) => { if (!accessState[p.id]) accessState[p.id] = defaultAccessRow(); accessState[p.id][role.id] = 'none'; });
    persistRoles(); persistAccess();
    renderAccessMatrix();
  });

  /* ------------------------------------------------------------------------
     PLATFORM AUDIT
     ------------------------------------------------------------------------ */

  function renderPlatformAudit(filter) {
    const q = (filter || '').toLowerCase();
    const grid = document.getElementById('platformAuditGrid');
    const filtered = platforms.filter((p) => !q || p.name.toLowerCase().includes(q));

    grid.innerHTML = filtered.map((p) => {
      const qwCount = quickWins.filter((qw) => qw.platform === p.name).length;
      return `
      <div class="platform-audit-card" data-platform-card="${p.id}">
        <div class="platform-audit-head">
          <div class="platform-audit-name-group">
            <span class="platform-audit-name">${escapeHtml(p.name)}</span>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <select class="status-select ${STATUS_META[p.status].chip}" data-status-for="${p.id}">
              ${STATUS_ORDER.map((s) => `<option value="${s}" ${s === p.status ? 'selected' : ''}>${STATUS_META[s].label}</option>`).join('')}
            </select>
            <button class="icon-btn" data-delete-platform-card="${p.id}" aria-label="Remove platform"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
          </div>
        </div>
        <div class="platform-audit-meta">
          <div>
            <div class="pa-meta-label">Tracking</div>
            <select class="cell-select" data-tracking-for="${p.id}" style="padding-left:0;">${TRACKING_OPTIONS.map((o) => `<option ${o === p.tracking ? 'selected' : ''}>${o}</option>`).join('')}</select>
          </div>
          <div>
            <div class="pa-meta-label">2FA</div>
            <select class="cell-select" data-twofa-for="${p.id}" style="padding-left:0;">${TWOFA_OPTIONS.map((o) => `<option ${o === p.twoFA ? 'selected' : ''}>${o}</option>`).join('')}</select>
          </div>
        </div>
        ${qwCount > 0 ? `<button class="pa-quickwins" data-goto-quickwins="1">${qwCount} quick win${qwCount > 1 ? 's' : ''} linked</button>` : ''}

        <div class="pa-custom-fields">
          ${p.customFields.map((f) => `
            <div class="pa-custom-field" data-field-row="${f.id}">
              <span class="pa-custom-field-label">${escapeHtml(f.label)}</span>
              <span class="pa-custom-field-value" contenteditable="true" data-platform="${p.id}" data-field="${f.id}">${escapeHtml(f.value)}</span>
              <button class="icon-btn" data-delete-field="${f.id}" data-platform-for-field="${p.id}" aria-label="Delete field"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
            </div>
          `).join('')}
          <button class="pa-add-field-btn" data-add-field="${p.id}">+ Add field</button>
        </div>

        <textarea class="pa-notes-area" rows="2" placeholder="Notes…" data-notes-for="${p.id}">${escapeHtml(p.notes)}</textarea>
      </div>
    `;
    }).join('');

    attachPlatformAuditDelegation();
  }

  function attachPlatformAuditDelegation() {
    const grid = document.getElementById('platformAuditGrid');

    grid.querySelectorAll('[data-status-for]').forEach((sel) => {
      sel.addEventListener('change', () => {
        const p = findPlatform(sel.dataset.statusFor);
        if (!p) return;
        p.status = sel.value;
        persistPlatforms();
        renderPlatformAudit(document.getElementById('auditSearch').value);
        renderDashboard();
      });
    });

    grid.querySelectorAll('[data-tracking-for]').forEach((sel) => {
      sel.addEventListener('change', () => {
        const p = findPlatform(sel.dataset.trackingFor);
        if (!p) return;
        p.tracking = sel.value;
        persistPlatforms();
      });
    });

    grid.querySelectorAll('[data-twofa-for]').forEach((sel) => {
      sel.addEventListener('change', () => {
        const p = findPlatform(sel.dataset.twofaFor);
        if (!p) return;
        p.twoFA = sel.value;
        persistPlatforms();
        renderDashboard();
      });
    });

    grid.querySelectorAll('[data-delete-platform-card]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('Remove this platform? It will also disappear from the Access Matrix.')) return;
        removePlatform(btn.dataset.deletePlatformCard);
        renderPlatformAudit(document.getElementById('auditSearch').value);
        renderAccessMatrix();
        renderDashboard();
      });
    });

    grid.querySelectorAll('[data-goto-quickwins]').forEach((btn) => btn.addEventListener('click', () => goToView('quickwins')));

    grid.querySelectorAll('.pa-custom-field-value').forEach((el) => {
      el.addEventListener('focusout', () => {
        const p = findPlatform(el.dataset.platform);
        if (!p) return;
        const field = p.customFields.find((f) => f.id === el.dataset.field);
        if (!field) return;
        field.value = el.textContent.trim();
        persistPlatforms();
      });
    });

    grid.querySelectorAll('[data-delete-field]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = findPlatform(btn.dataset.platformForField);
        if (!p) return;
        p.customFields = p.customFields.filter((f) => f.id !== btn.dataset.deleteField);
        persistPlatforms();
        renderPlatformAudit(document.getElementById('auditSearch').value);
      });
    });

    grid.querySelectorAll('[data-add-field]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = findPlatform(btn.dataset.addField);
        if (!p) return;
        const label = prompt('Field name (e.g. "Active Campaigns", "Posts This Month", "Videos Published"):');
        if (!label || !label.trim()) return;
        const value = prompt('Value:', '') || '';
        p.customFields.push({ id: uid('cf'), label: label.trim(), value: value.trim() });
        persistPlatforms();
        renderPlatformAudit(document.getElementById('auditSearch').value);
      });
    });

    grid.querySelectorAll('[data-notes-for]').forEach((ta) => {
      ta.addEventListener('focusout', () => {
        const p = findPlatform(ta.dataset.notesFor);
        if (!p) return;
        p.notes = ta.value.trim();
        persistPlatforms();
      });
    });
  }

  document.getElementById('auditSearch').addEventListener('input', (e) => renderPlatformAudit(e.target.value));

  document.getElementById('addPlatformBtn').addEventListener('click', () => {
    const name = prompt('New platform name:');
    if (!name || !name.trim()) return;
    if (findPlatformByName(name.trim())) { alert('That platform already exists.'); return; }
    addPlatform(name.trim());
    renderPlatformAudit(document.getElementById('auditSearch').value);
    renderAccessMatrix();
    renderDashboard();
  });

  /* ------------------------------------------------------------------------
     QUICK WINS — KANBAN
     ------------------------------------------------------------------------ */

  const KANBAN_COLUMNS = ['backlog', 'doing', 'done'];
  const PRIORITY_TAG_CLASS = { High: 'chip-red', Medium: 'chip-amber', Low: 'chip-navy' };

  function isOverdue(qw) {
    if (!qw.dueDate || qw.status === 'done') return false;
    const due = new Date(qw.dueDate + 'T23:59:59');
    return due.getTime() < Date.now();
  }

  function renderKanban() {
    KANBAN_COLUMNS.forEach((status) => {
      const list = document.getElementById('list' + capitalize(status));
      const items = quickWins.filter((q) => q.status === status);
      document.getElementById('count' + capitalize(status)).textContent = items.length;

      list.innerHTML = items.map((q) => `
        <div class="kanban-card" draggable="true" data-id="${q.id}" title="${findProjectByTag(q.platform) ? 'Click para ver el proyecto ' + escapeHtml(findProjectByTag(q.platform).name) : ''}">
          <div class="kanban-card-head">
            <h4>${escapeHtml(q.title)}</h4>
            <button class="kanban-edit-btn" data-edit-qw="${q.id}" aria-label="Edit"><svg viewBox="0 0 24 24"><path d="M4 20h4L18.5 9.5a2 2 0 000-2.8l-1.2-1.2a2 2 0 00-2.8 0L4 16v4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></button>
          </div>
          <div class="kanban-card-footer">
            <span class="kanban-platform">${escapeHtml(q.platform)}</span>
            <span class="kanban-tag ${PRIORITY_TAG_CLASS[q.priority] || 'chip-navy'}">${q.priority}</span>
          </div>
          ${q.dueDate ? `<div class="kanban-due ${isOverdue(q) ? 'overdue' : ''}">Due ${formatDate(q.dueDate)}${isOverdue(q) ? ' · overdue' : ''}</div>` : ''}
        </div>
      `).join('');
    });

    attachKanbanDnD();
    attachKanbanEdit();
    attachKanbanCardNav();
  }

  function attachKanbanEdit() {
    document.querySelectorAll('[data-edit-qw]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openQuickWinModal(quickWins.find((q) => q.id === btn.dataset.editQw));
      });
    });
  }

  function findProjectByTag(tag) {
    return projects.find((p) => Array.isArray(p.tags) && p.tags.includes(tag));
  }

  function goToProjectFromTag(tag) {
    const project = findProjectByTag(tag);
    goToView('projects');
    if (project) showProjectsDetailMode(project.id);
  }

  function attachKanbanCardNav() {
    document.querySelectorAll('.kanban-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-edit-qw]')) return;
        const qw = quickWins.find((q) => q.id === card.dataset.id);
        if (!qw) return;
        goToProjectFromTag(qw.platform);
      });
    });
  }

  function openQuickWinModal(existing) {
    const platformNames = Array.from(new Set([...QW_PROJECT_TAGS, ...platforms.map((p) => p.name)]));
    if (existing && !platformNames.includes(existing.platform)) platformNames.push(existing.platform);

    openModal({
      title: existing ? 'Editar ítem' : 'Nuevo ítem',
      submitLabel: existing ? 'Guardar cambios' : 'Agregar ítem',
      fields: [
        { key: 'title', label: 'Título', type: 'text', value: existing ? existing.title : '' },
        { key: 'platform', label: 'Proyecto / Plataforma', type: 'select', options: platformNames, value: existing ? existing.platform : platformNames[0] },
        { key: 'priority', label: 'Prioridad', type: 'select', options: PRIORITY_OPTIONS, value: existing ? existing.priority : 'Medium' },
        { key: 'status', label: 'Estado', type: 'select', options: ['backlog', 'doing', 'done'], value: existing ? existing.status : 'backlog' },
        { key: 'dueDate', label: 'Fecha límite', type: 'date', value: existing ? existing.dueDate : '' },
      ],
      onSubmit: (values) => {
        if (!values.title.trim()) return;
        if (existing) {
          Object.assign(existing, values);
        } else {
          quickWins.push({ id: uid('qw'), ...values });
        }
        persistQuickWins();
        renderKanban();
        renderDashboard();
      },
    });
  }

  function attachKanbanDnD() {
    document.querySelectorAll('.kanban-card').forEach((card) => {
      card.addEventListener('dragstart', () => card.classList.add('dragging'));
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        persistQuickWins();
        renderDashboard();
      });
    });

    document.querySelectorAll('.kanban-list').forEach((list) => {
      list.addEventListener('dragover', (e) => {
        e.preventDefault();
        list.classList.add('drag-over');
        const dragging = document.querySelector('.kanban-card.dragging');
        if (!dragging) return;
        const after = getDragAfterElement(list, e.clientY);
        if (after == null) list.appendChild(dragging); else list.insertBefore(dragging, after);
      });
      list.addEventListener('dragleave', () => list.classList.remove('drag-over'));
      list.addEventListener('drop', () => {
        list.classList.remove('drag-over');
        const newStatus = list.closest('.kanban-column').dataset.status;
        Array.from(list.querySelectorAll('.kanban-card')).forEach((c) => {
          const item = quickWins.find((q) => q.id === c.dataset.id);
          if (item) item.status = newStatus;
        });
        KANBAN_COLUMNS.forEach((s) => {
          document.getElementById('count' + capitalize(s)).textContent = document.getElementById('list' + capitalize(s)).children.length;
        });
      });
    });
  }

  function getDragAfterElement(container, y) {
    const cards = Array.from(container.querySelectorAll('.kanban-card:not(.dragging)'));
    return cards.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  document.getElementById('addQuickWinBtn').addEventListener('click', () => openQuickWinModal(null));

  /* ------------------------------------------------------------------------
     REPORTS — tabs (General / Campañas)
     ------------------------------------------------------------------------ */

  function reportsGoToTab(name) {
    document.querySelectorAll('#reportsTabs .af-tab').forEach((t) => t.classList.toggle('active', t.dataset.reportsTab === name));
    document.querySelectorAll('.reports-tab-panel').forEach((p) => p.classList.toggle('active', p.id === 'reportsPanel-' + name));
  }
  document.querySelectorAll('#reportsTabs .af-tab').forEach((tab) => {
    tab.addEventListener('click', () => reportsGoToTab(tab.dataset.reportsTab));
  });

  /* ------------------------------------------------------------------------
     MEETING NOTES
     ------------------------------------------------------------------------ */

  function renderNotes() {
    const list = document.getElementById('notesList');
    if (notes.length === 0) {
      list.innerHTML = '<div class="note-empty">No meeting notes yet — the first one you save will show up here.</div>';
      return;
    }
    list.innerHTML = notes.map((n) => `
      <div class="note-card">
        <div class="note-card-head"><h4>${escapeHtml(n.title)}</h4><span class="note-card-date">${n.date || ''}</span></div>
        ${n.attendees ? `<div class="note-card-attendees">Attendees: ${escapeHtml(n.attendees)}</div>` : ''}
        ${n.agenda ? `<div class="note-card-section"><span>Agenda</span><p>${escapeHtml(n.agenda)}</p></div>` : ''}
        ${n.decisions ? `<div class="note-card-section"><span>Decisions</span><p>${escapeHtml(n.decisions)}</p></div>` : ''}
        ${n.actions ? `<div class="note-card-section"><span>Action Items</span><p>${escapeHtml(n.actions)}</p></div>` : ''}
      </div>
    `).join('');
  }

  document.getElementById('saveNoteBtn').addEventListener('click', () => {
    const title = document.getElementById('noteTitle').value.trim();
    if (!title) { document.getElementById('noteTitle').focus(); return; }
    notes.unshift({
      title,
      date: document.getElementById('noteDate').value,
      attendees: document.getElementById('noteAttendees').value.trim(),
      agenda: document.getElementById('noteAgenda').value.trim(),
      decisions: document.getElementById('noteDecisions').value.trim(),
      actions: document.getElementById('noteActions').value.trim(),
    });
    persistNotes();
    ['noteTitle', 'noteDate', 'noteAttendees', 'noteAgenda', 'noteDecisions', 'noteActions'].forEach((id) => { document.getElementById(id).value = ''; });
    renderNotes();
  });

  /* ------------------------------------------------------------------------
     BRIEFS
     ------------------------------------------------------------------------ */

  const BRIEF_FIELD_IDS = [
    'briefBusinessUnit', 'briefBrand', 'briefMarket', 'briefRequester', 'briefRequestDate', 'briefLaunchDate',
    'briefProjectName', 'briefBusinessObjective', 'briefMarketingObjective', 'briefAudience', 'briefContext',
    'briefChannels', 'briefProducts', 'briefBudget', 'briefKpi', 'briefKeyMessage',
    'briefStartDate', 'briefEndDate', 'briefNeedsDesign', 'briefReferences', 'briefNotes',
  ];

  function renderBriefs() {
    const list = document.getElementById('briefsList');
    if (briefs.length === 0) {
      list.innerHTML = '<div class="brief-empty">No hay briefs registrados todavía — el primero que guardes aparecerá aquí.</div>';
      return;
    }
    list.innerHTML = briefs.map((b) => `
      <div class="brief-card" data-id="${b.id}">
        <div class="brief-card-head">
          <div class="brief-card-title-wrap">
            <h4>${escapeHtml(b.projectName || 'Sin nombre')}</h4>
            <div class="brief-card-tags">
              <span class="chip chip-navy"><span class="chip-dot"></span>${escapeHtml(b.businessUnit || '')}</span>
              <span class="chip chip-navy"><span class="chip-dot"></span>${escapeHtml(b.brand || '')}</span>
              ${b.needsDesign === 'yes' ? '<span class="chip chip-amber"><span class="chip-dot"></span>Requiere diseño (Tier 2)</span>' : ''}
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="brief-card-date">${b.requestDate || ''}</span>
            <button class="icon-btn brief-delete-btn" data-id="${b.id}" aria-label="Delete brief">
              <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
        <div class="brief-card-grid">
          <div class="brief-card-field"><span>Mercado</span><p>${escapeHtml(b.market || '—')}</p></div>
          <div class="brief-card-field"><span>Solicitante</span><p>${escapeHtml(b.requester || '—')}</p></div>
          <div class="brief-card-field"><span>Lanzamiento deseado</span><p>${escapeHtml(b.launchDate || '—')}</p></div>
          <div class="brief-card-field"><span>Objetivo de marketing digital</span><p>${escapeHtml(b.marketingObjective || '—')}</p></div>
          <div class="brief-card-field"><span>Público objetivo</span><p>${escapeHtml(b.audience || '—')}</p></div>
          <div class="brief-card-field"><span>Canales digitales</span><p>${escapeHtml(b.channels || '—')}</p></div>
          <div class="brief-card-field"><span>Presupuesto estimado</span><p>${escapeHtml(b.budget || '—')}</p></div>
          <div class="brief-card-field"><span>KPI principal</span><p>${escapeHtml(b.kpi || '—')}</p></div>
          ${b.businessObjective ? `<div class="brief-card-field"><span>Objetivo de negocio</span><p>${escapeHtml(b.businessObjective)}</p></div>` : ''}
          ${b.context ? `<div class="brief-card-field"><span>Contexto</span><p>${escapeHtml(b.context)}</p></div>` : ''}
          ${b.products ? `<div class="brief-card-field"><span>Producto(s) / SKU</span><p>${escapeHtml(b.products)}</p></div>` : ''}
          ${b.keyMessage ? `<div class="brief-card-field"><span>Mensaje clave</span><p>${escapeHtml(b.keyMessage)}</p></div>` : ''}
          <div class="brief-card-field"><span>Fecha de inicio</span><p>${escapeHtml(b.startDate || '—')}</p></div>
          <div class="brief-card-field"><span>Fecha de fin</span><p>${escapeHtml(b.endDate || '—')}</p></div>
          ${b.references ? `<div class="brief-card-field"><span>Referencias</span><p>${escapeHtml(b.references)}</p></div>` : ''}
          ${b.notes ? `<div class="brief-card-field"><span>Notas</span><p>${escapeHtml(b.notes)}</p></div>` : ''}
        </div>
      </div>
    `).join('');
  }

  document.getElementById('briefsList').addEventListener('click', (e) => {
    const delBtn = e.target.closest('.brief-delete-btn');
    if (delBtn) {
      briefs = briefs.filter((b) => b.id !== delBtn.dataset.id);
      persistBriefs();
      renderBriefs();
    }
  });

  document.getElementById('saveBriefBtn').addEventListener('click', () => {
    const projectName = document.getElementById('briefProjectName').value.trim();
    if (!projectName) { document.getElementById('briefProjectName').focus(); return; }
    briefs.unshift({
      id: uid('brief'),
      businessUnit: document.getElementById('briefBusinessUnit').value,
      brand: document.getElementById('briefBrand').value,
      market: document.getElementById('briefMarket').value.trim(),
      requester: document.getElementById('briefRequester').value.trim(),
      requestDate: document.getElementById('briefRequestDate').value,
      launchDate: document.getElementById('briefLaunchDate').value,
      projectName,
      businessObjective: document.getElementById('briefBusinessObjective').value.trim(),
      marketingObjective: document.getElementById('briefMarketingObjective').value,
      audience: document.getElementById('briefAudience').value.trim(),
      context: document.getElementById('briefContext').value.trim(),
      channels: document.getElementById('briefChannels').value.trim(),
      products: document.getElementById('briefProducts').value.trim(),
      budget: document.getElementById('briefBudget').value.trim(),
      kpi: document.getElementById('briefKpi').value.trim(),
      keyMessage: document.getElementById('briefKeyMessage').value.trim(),
      startDate: document.getElementById('briefStartDate').value,
      endDate: document.getElementById('briefEndDate').value,
      needsDesign: document.getElementById('briefNeedsDesign').value,
      references: document.getElementById('briefReferences').value.trim(),
      notes: document.getElementById('briefNotes').value.trim(),
    });
    persistBriefs();
    BRIEF_FIELD_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el.tagName === 'SELECT') { el.selectedIndex = 0; } else { el.value = ''; }
    });
    renderBriefs();
  });

  /* ------------------------------------------------------------------------
     LINKEDIN B2B (antes "Content Inputs")
     ------------------------------------------------------------------------ */

  const CONTENT_INPUT_FIELD_IDS = [
    'ciAuthor', 'ciPublishDate', 'ciPillar', 'ciLanguage', 'ciTopic', 'ciCopy', 'ciSupport',
    'ciDoNotMention', 'ciStatus', 'ciPostsFirst', 'ciReposts', 'ciVisualType', 'ciVisualLink',
    'ciUrgency', 'ciNotes',
  ];

  const CI_STATUS_CHIP = {
    'En revisión': 'chip-amber',
    'Listo para postear': 'chip-green',
    'Publicado': 'chip-navy',
  };
  const CI_STATUS_OPTIONS = ['En revisión', 'Listo para postear', 'Publicado'];

  let ciFilterAuthorValue = '';

  function renderContentInputs() {
    const list = document.getElementById('contentInputsList');
    const filtered = ciFilterAuthorValue
      ? contentInputs.filter((c) => c.author === ciFilterAuthorValue)
      : contentInputs;

    if (filtered.length === 0) {
      list.innerHTML = contentInputs.length === 0
        ? '<div class="brief-empty">No hay posts registrados todavía, el primero que guardes aparecerá aquí.</div>'
        : '<div class="brief-empty">No hay posts para esta persona / área todavía.</div>';
      return;
    }

    list.innerHTML = filtered.map((c) => `
      <div class="brief-card" data-id="${c.id}">
        <div class="brief-card-head">
          <div class="brief-card-title-wrap">
            <strong>${escapeHtml(c.author)} · ${escapeHtml(c.topic || c.pillar || 'Sin tema')}</strong>
            <div class="brief-card-tags">
              <span class="tag">${escapeHtml(c.pillar)}</span>
              <span class="tag">${escapeHtml(c.language)}</span>
              <span class="tag">${escapeHtml(c.visualType || '—')}</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <select class="status-select ${CI_STATUS_CHIP[c.status] || 'chip-navy'}" data-ci-status-for="${c.id}">
              ${CI_STATUS_OPTIONS.map((s) => `<option value="${s}" ${s === c.status ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
            <button class="icon-btn content-input-delete-btn" data-id="${c.id}" aria-label="Delete content input">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
        <div class="brief-card-grid">
          ${c.copy ? `<div class="brief-card-field"><span>Copy</span><p>${escapeHtml(c.copy)}</p></div>` : '<div class="brief-card-field"><span>Copy</span><p>— todavía sin copy final —</p></div>'}
          ${c.support ? `<div class="brief-card-field"><span>Dato / historia de soporte</span><p>${escapeHtml(c.support)}</p></div>` : ''}
          ${c.doNotMention ? `<div class="brief-card-field"><span>No mencionar</span><p>${escapeHtml(c.doNotMention)}</p></div>` : ''}
          <div class="brief-card-field"><span>Publicación</span><p>Publica ${escapeHtml(c.postsFirst || c.author)}${c.reposts && c.reposts !== 'No aplica' ? `, repostea ${escapeHtml(c.reposts)}` : ''} · ${escapeHtml(c.publishDate || 'sin fecha')}</p></div>
          ${c.visualLink ? `<div class="brief-card-field"><span>Material gráfico</span><p>${escapeHtml(c.visualLink)}</p></div>` : ''}
          ${c.notes ? `<div class="brief-card-field"><span>Notas</span><p>${escapeHtml(c.notes)}</p></div>` : ''}
        </div>
      </div>
    `).join('');
  }

  document.getElementById('contentInputsList').addEventListener('click', (e) => {
    const delBtn = e.target.closest('.content-input-delete-btn');
    if (delBtn) {
      contentInputs = contentInputs.filter((c) => c.id !== delBtn.dataset.id);
      persistContentInputs();
      renderContentInputs();
    }
  });

  document.getElementById('contentInputsList').addEventListener('change', (e) => {
    const sel = e.target.closest('[data-ci-status-for]');
    if (sel) {
      const item = contentInputs.find((c) => c.id === sel.dataset.ciStatusFor);
      if (item) {
        item.status = sel.value;
        persistContentInputs();
        renderContentInputs();
      }
    }
  });

  document.getElementById('ciFilterAuthor').addEventListener('change', (e) => {
    ciFilterAuthorValue = e.target.value;
    renderContentInputs();
  });

  document.getElementById('saveContentInputBtn').addEventListener('click', () => {
    const topic = document.getElementById('ciTopic').value.trim();
    if (!topic) { document.getElementById('ciTopic').focus(); return; }
    contentInputs.unshift({
      id: uid('ci'),
      author: document.getElementById('ciAuthor').value,
      publishDate: document.getElementById('ciPublishDate').value,
      pillar: document.getElementById('ciPillar').value,
      language: document.getElementById('ciLanguage').value,
      topic,
      copy: document.getElementById('ciCopy').value.trim(),
      support: document.getElementById('ciSupport').value.trim(),
      doNotMention: document.getElementById('ciDoNotMention').value.trim(),
      status: document.getElementById('ciStatus').value,
      postsFirst: document.getElementById('ciPostsFirst').value,
      reposts: document.getElementById('ciReposts').value,
      visualType: document.getElementById('ciVisualType').value,
      visualLink: document.getElementById('ciVisualLink').value.trim(),
      urgency: document.getElementById('ciUrgency').value,
      notes: document.getElementById('ciNotes').value.trim(),
    });
    persistContentInputs();
    CONTENT_INPUT_FIELD_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el.tagName === 'SELECT') { el.selectedIndex = 0; } else { el.value = ''; }
    });
    renderContentInputs();
  });

  /* ------------------------------------------------------------------------
     CONTENT CALENDAR
     ------------------------------------------------------------------------ */

  const calState = {
    year: 2026,
    month: 7, // August, 0-indexed — mes de prueba
    activeBrands: new Set(BRANDS),
    activePlatforms: new Set(PLATFORM_NAMES),
    campaign: 'Todas',
  };
  let calDraggedJustNow = false;
  const POSTED_OPTIONS = ['No publicado aún', 'Ya publicado'];

  function calMonthLabel(year, month) {
    const label = new Date(year, month, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  function calFilteredPosts() {
    return calendarPosts.filter((p) => calState.activeBrands.has(p.brand)
      && calState.activePlatforms.has(p.platform)
      && (calState.campaign === 'Todas' || p.campaign === calState.campaign));
  }

  function renderCalCampaignFilter() {
    const sel = document.getElementById('calCampaignFilter');
    const campaigns = Array.from(new Set(calendarPosts.map((p) => p.campaign))).filter(Boolean).sort();
    if (!campaigns.includes(calState.campaign) && calState.campaign !== 'Todas') calState.campaign = 'Todas';
    sel.innerHTML = ['Todas', ...campaigns].map((c) => `<option value="${escapeHtml(c)}" ${c === calState.campaign ? 'selected' : ''}>${escapeHtml(c === 'Todas' ? 'Todas las campañas' : c)}</option>`).join('');
  }

  function isoWeekStart(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    return d.toISOString().slice(0, 10);
  }

  function renderCalWeekdayHeader() {
    document.getElementById('calWeekdays').innerHTML = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((l) => `<span>${l}</span>`).join('');
  }

  function renderCalLegend() {
    const wrap = document.getElementById('calLegend');
    const platformSwatches = PLATFORM_NAMES.map((name) => `<span class="cal-legend-item"><span class="cal-legend-swatch" style="background:${PLATFORM_META[name].color}"></span>${escapeHtml(name)}</span>`).join('');
    const kindStyle = { 'Orgánico': 'solid', 'Pautado': 'dashed', 'Dark Post': 'dotted' };
    const kindSwatches = KIND_OPTIONS.map((k) => `<span class="cal-legend-item"><span class="cal-legend-dot" style="background:transparent; border:2px ${kindStyle[k]} var(--ink-soft);"></span>${escapeHtml(k)} — ${escapeHtml(KIND_HINT[k])}</span>`).join('');
    wrap.innerHTML = platformSwatches + '<span class="cal-legend-sep"></span>' + kindSwatches;
  }

  function renderCalFilters() {
    const brandWrap = document.getElementById('calBrandFilters');
    const platWrap = document.getElementById('calPlatformFilters');
    brandWrap.innerHTML = BRANDS.map((b) => `<button class="filter-chip ${calState.activeBrands.has(b) ? 'active' : ''}" data-cal-brand="${escapeHtml(b)}">${escapeHtml(b)}</button>`).join('');
    platWrap.innerHTML = PLATFORM_NAMES.map((p) => `<button class="filter-chip ${calState.activePlatforms.has(p) ? 'active' : ''}" data-cal-platform="${escapeHtml(p)}">${escapeHtml(p)}</button>`).join('');

    brandWrap.querySelectorAll('button').forEach((btn) => btn.addEventListener('click', () => {
      const b = btn.dataset.calBrand;
      if (calState.activeBrands.has(b)) calState.activeBrands.delete(b); else calState.activeBrands.add(b);
      renderCalFilters(); renderCalGrid(); renderCalSummary();
    }));
    platWrap.querySelectorAll('button').forEach((btn) => btn.addEventListener('click', () => {
      const p = btn.dataset.calPlatform;
      if (calState.activePlatforms.has(p)) calState.activePlatforms.delete(p); else calState.activePlatforms.add(p);
      renderCalFilters(); renderCalGrid(); renderCalSummary();
    }));
  }

  function calChipHtml(post) {
    const meta = PLATFORM_META[post.platform] || { color: '#8B93B8', icon: '' };
    return `
      <div class="cal-chip ${KIND_CLASS[post.kind] || ''} ${post.posted ? 'is-posted' : ''}" draggable="true" data-post-id="${post.id}" style="background:${meta.color}" title="${escapeHtml(post.brand)} · ${escapeHtml(post.market)} · ${escapeHtml(post.campaign)} — ${escapeHtml(post.topic)}">
        <button class="cal-chip-tick ${post.posted ? 'is-posted' : ''}" data-toggle-posted="${post.id}" type="button" title="${post.posted ? 'Marcar como no publicado' : 'Marcar como publicado'}">✓</button>
        <span class="cal-chip-icon">${meta.icon}</span>
        <span class="cal-chip-label">${escapeHtml(post.topic)}</span>
      </div>`;
  }

  function renderCalGrid() {
    const grid = document.getElementById('calGrid');
    document.getElementById('calMonthLabel').textContent = calMonthLabel(calState.year, calState.month);

    const firstOfMonth = new Date(calState.year, calState.month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - startOffset);

    const daysInMonth = new Date(calState.year, calState.month + 1, 0).getDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    const posts = calFilteredPosts();
    const todayIso = new Date().toISOString().slice(0, 10);

    let html = '';
    for (let i = 0; i < totalCells; i++) {
      const cellDate = new Date(gridStart);
      cellDate.setDate(cellDate.getDate() + i);
      const iso = cellDate.toISOString().slice(0, 10);
      const outside = cellDate.getMonth() !== calState.month;
      const dayPosts = posts.filter((p) => p.date === iso).sort((a, b) => PLATFORM_NAMES.indexOf(a.platform) - PLATFORM_NAMES.indexOf(b.platform));
      html += `
        <div class="cal-day ${outside ? 'outside' : ''} ${iso === todayIso ? 'today' : ''}" data-date="${iso}">
          <div class="cal-day-head">
            <span class="cal-day-num">${cellDate.getDate()}</span>
            <button class="cal-day-add" data-add-date="${iso}" aria-label="Add post" type="button">+</button>
          </div>
          <div class="cal-chips">${dayPosts.map(calChipHtml).join('')}</div>
        </div>`;
    }
    grid.innerHTML = html;
    attachCalDnD();
    attachCalChipClicks();
    attachCalDayAdd();
    attachCalTickClicks();
  }

  function attachCalChipClicks() {
    document.querySelectorAll('.cal-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        if (calDraggedJustNow) return;
        const post = calendarPosts.find((p) => p.id === chip.dataset.postId);
        if (post) openCalPostModal(post);
      });
    });
  }

  function attachCalTickClicks() {
    document.querySelectorAll('[data-toggle-posted]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const post = calendarPosts.find((p) => p.id === btn.dataset.togglePosted);
        if (!post) return;
        post.posted = !post.posted;
        persistCalendarPosts();
        renderCalGrid();
        renderCalSummary();
      });
    });
  }

  function attachCalDayAdd() {
    document.querySelectorAll('[data-add-date]').forEach((btn) => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); openCalPostModal(null, btn.dataset.addDate); });
    });
  }

  function attachCalDnD() {
    document.querySelectorAll('.cal-chip').forEach((chip) => {
      chip.addEventListener('dragstart', () => { chip.classList.add('dragging'); calDraggedJustNow = true; });
      chip.addEventListener('dragend', () => {
        chip.classList.remove('dragging');
        setTimeout(() => { calDraggedJustNow = false; }, 50);
      });
    });
    document.querySelectorAll('.cal-day').forEach((day) => {
      day.addEventListener('dragover', (e) => { e.preventDefault(); day.classList.add('drag-over'); });
      day.addEventListener('dragleave', () => day.classList.remove('drag-over'));
      day.addEventListener('drop', (e) => {
        e.preventDefault();
        day.classList.remove('drag-over');
        const dragging = document.querySelector('.cal-chip.dragging');
        if (!dragging) return;
        const post = calendarPosts.find((p) => p.id === dragging.dataset.postId);
        if (post && post.date !== day.dataset.date) {
          post.date = day.dataset.date;
          persistCalendarPosts();
          renderCalGrid();
          renderCalSummary();
        }
      });
    });
  }

  function openCalPostModal(existing, presetDate) {
    const oldDel = document.querySelector('.modal-actions [data-cal-delete]');
    if (oldDel) oldDel.remove();

    openModal({
      title: existing ? 'Editar post' : 'Nuevo post',
      submitLabel: existing ? 'Guardar cambios' : 'Agregar post',
      fields: [
        { key: 'date', label: 'Fecha', type: 'date', value: existing ? existing.date : (presetDate || '') },
        { key: 'platform', label: 'Plataforma', type: 'select', options: PLATFORM_NAMES, value: existing ? existing.platform : PLATFORM_NAMES[0] },
        { key: 'brand', label: 'Marca', type: 'select', options: BRANDS, value: existing ? existing.brand : BRANDS[0] },
        { key: 'market', label: 'País / mercado', type: 'text', value: existing ? existing.market : 'USA', placeholder: 'USA, Ecuador, LATAM (general)…' },
        { key: 'campaign', label: 'Campaña (o Genérico / Institucional)', type: 'text', value: existing ? existing.campaign : 'Genérico', placeholder: 'Nombre de campaña, o Genérico / Institucional' },
        { key: 'kind', label: 'Tipo', type: 'select', options: KIND_OPTIONS, value: existing ? existing.kind : 'Orgánico' },
        { key: 'topic', label: 'Tema / qué se publica', type: 'text', value: existing ? existing.topic : '' },
        { key: 'postedLabel', label: 'Estado', type: 'select', options: POSTED_OPTIONS, value: existing && existing.posted ? 'Ya publicado' : 'No publicado aún' },
        { key: 'notes', label: 'Notas', type: 'textarea', value: existing ? existing.notes : '' },
      ],
      onSubmit: (values) => {
        if (!values.date || !values.topic.trim()) return;
        values.posted = values.postedLabel === 'Ya publicado';
        delete values.postedLabel;
        if (existing) { Object.assign(existing, values); }
        else { calendarPosts.push({ id: uid('calp'), ...values }); }
        persistCalendarPosts();
        renderCalCampaignFilter();
        renderCalGrid();
        renderCalSummary();
      },
    });

    if (existing) {
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn btn-ghost';
      delBtn.textContent = 'Eliminar post';
      delBtn.setAttribute('data-cal-delete', '1');
      delBtn.style.marginRight = 'auto';
      delBtn.addEventListener('click', () => {
        calendarPosts = calendarPosts.filter((p) => p.id !== existing.id);
        persistCalendarPosts();
        renderCalCampaignFilter();
        renderCalGrid();
        renderCalSummary();
        closeModal();
      });
      document.querySelector('.modal-actions').prepend(delBtn);
    }
  }

  function renderCalSummary() {
    const wrap = document.getElementById('calSummaryGrid');
    const posts = calFilteredPosts().filter((p) => {
      const d = new Date(p.date + 'T00:00:00');
      return d.getFullYear() === calState.year && d.getMonth() === calState.month;
    });

    const weeks = {};
    posts.forEach((p) => { (weeks[isoWeekStart(p.date)] = weeks[isoWeekStart(p.date)] || []).push(p); });
    const weekKeys = Object.keys(weeks).sort();

    if (!weekKeys.length) {
      wrap.innerHTML = '<p class="view-intro" style="margin:0;">Sin posts programados este mes con los filtros actuales.</p>';
      return;
    }

    const monthShort = calMonthLabel(calState.year, calState.month).split(' ')[0];
    wrap.innerHTML = weekKeys.map((wk) => {
      const items = weeks[wk];
      const uniquePieces = new Set(items.map((p) => p.date + '|' + p.topic)).size;
      const byBrand = {};
      items.forEach((p) => { byBrand[p.brand] = (byBrand[p.brand] || 0) + 1; });
      const brandColor = { 'Holstein Housewares': 'var(--navy)', Connecto: 'var(--blue)', Alessa: 'var(--amber)', Distrivalto: 'var(--ink-faint)' };
      const total = items.length;
      const flagHigh = uniquePieces > 5;
      const start = new Date(wk + 'T00:00:00');
      const end = new Date(start); end.setDate(end.getDate() + 6);
      const label = `${start.getDate()}–${end.getDate()} ${monthShort}`;
      const bar = Object.keys(byBrand).map((b) => `<span style="width:${Math.round((byBrand[b] / total) * 100)}%; background:${brandColor[b] || 'var(--ink-faint)'};"></span>`).join('');
      const countLabel = Object.entries(byBrand).map(([b, c]) => `${b.split(' ')[0]}: <strong>${c}</strong>`).join(' · ');
      return `
        <div class="cal-summary-row">
          <span class="cal-summary-week">${label}</span>
          <span class="cal-summary-bar">${bar}</span>
          <span class="cal-summary-count">${countLabel} · ${uniquePieces} pieza(s) nueva(s), ${total} publicación(es) en total</span>
          <span class="cal-summary-flag ${flagHigh ? 'high' : 'ok'}">${flagHigh ? 'Revisar carga con diseño' : 'Ritmo saludable'}</span>
        </div>`;
    }).join('');
  }

  function renderCalendar() {
    renderCalWeekdayHeader();
    renderCalLegend();
    renderCalFilters();
    renderCalCampaignFilter();
    renderCalGrid();
    renderCalSummary();
  }

  document.getElementById('calCampaignFilter').addEventListener('change', (e) => {
    calState.campaign = e.target.value;
    renderCalGrid();
    renderCalSummary();
  });

  document.getElementById('calPrevBtn').addEventListener('click', () => {
    calState.month -= 1;
    if (calState.month < 0) { calState.month = 11; calState.year -= 1; }
    renderCalGrid(); renderCalSummary();
  });
  document.getElementById('calNextBtn').addEventListener('click', () => {
    calState.month += 1;
    if (calState.month > 11) { calState.month = 0; calState.year += 1; }
    renderCalGrid(); renderCalSummary();
  });
  document.getElementById('addCalPostBtn').addEventListener('click', () => {
    const iso = new Date(calState.year, calState.month, Math.min(new Date().getDate(), 28)).toISOString().slice(0, 10);
    openCalPostModal(null, iso);
  });

  /* ------------------------------------------------------------------------
     TIMELINE
     ------------------------------------------------------------------------ */

  function renderTimeline() {
    const track = document.getElementById('timelineTrack');
    const badgeClass = { done: 'chip-green', current: 'chip-amber', upcoming: 'chip-navy' };
    const badgeLabel = { done: 'Done', current: 'In Progress', upcoming: 'Upcoming' };
    const progress = { done: 100, current: 55, upcoming: 0 };

    track.innerHTML = ROADMAP_STAGES.map((s, i) => `
      <div class="timeline-stage ${s.status}">
        <div class="timeline-marker"><div class="timeline-dot"></div><div class="timeline-line"></div></div>
        <div class="timeline-content">
          <div class="timeline-content-head">
            <h3>Stage ${i + 1} · ${s.title}</h3>
            <span class="timeline-badge ${badgeClass[s.status]}">${badgeLabel[s.status]}</span>
          </div>
          <p>${s.desc}</p>
          <div class="timeline-progress"><div class="timeline-progress-fill" style="width:${progress[s.status]}%"></div></div>
        </div>
      </div>
    `).join('');
  }

  /* ------------------------------------------------------------------------
     SETTINGS
     ------------------------------------------------------------------------ */

  function renderTeam() {
    const list = document.getElementById('teamList');
    list.innerHTML = team.map((t) => `
      <div class="team-member" data-team-row="${t.id}">
        <span class="team-avatar">${initials(t.name)}</span>
        <div class="team-info"><strong>${escapeHtml(t.name)}</strong><span>${escapeHtml(t.role)}</span></div>
        <div class="team-actions">
          <button class="icon-btn" data-edit-team="${t.id}" aria-label="Edit"><svg viewBox="0 0 24 24"><path d="M4 20h4L18.5 9.5a2 2 0 000-2.8l-1.2-1.2a2 2 0 00-2.8 0L4 16v4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></button>
          <button class="icon-btn" data-delete-team="${t.id}" aria-label="Delete"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('[data-edit-team]').forEach((btn) => {
      btn.addEventListener('click', () => openTeamModal(team.find((t) => t.id === btn.dataset.editTeam)));
    });
    list.querySelectorAll('[data-delete-team]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('Remove this team member?')) return;
        team = team.filter((t) => t.id !== btn.dataset.deleteTeam);
        persistTeam();
        renderTeam();
      });
    });
  }

  function openTeamModal(existing) {
    openModal({
      title: existing ? 'Edit Team Member' : 'Add Team Member',
      submitLabel: existing ? 'Save Changes' : 'Add Member',
      fields: [
        { key: 'name', label: 'Name', type: 'text', value: existing ? existing.name : '' },
        { key: 'role', label: 'Role / Title', type: 'text', value: existing ? existing.role : '', placeholder: 'e.g. Marketing Manager · Full Administrator' },
      ],
      onSubmit: (values) => {
        if (!values.name.trim()) return;
        if (existing) {
          existing.name = values.name.trim();
          existing.role = values.role.trim();
        } else {
          team.push({ id: uid('tm'), name: values.name.trim(), role: values.role.trim() });
        }
        persistTeam();
        renderTeam();
      },
    });
  }

  document.getElementById('addTeamBtn').addEventListener('click', () => openTeamModal(null));

  function renderUserChip() {
    document.getElementById('userAvatar').textContent = initials(userProfile.name);
    document.getElementById('userNameLabel').textContent = userProfile.name;
    document.getElementById('userRoleLabel').textContent = userProfile.role;
  }

  document.getElementById('userChipBtn').addEventListener('click', () => {
    openModal({
      title: 'Edit Your Profile',
      submitLabel: 'Save Changes',
      fields: [
        { key: 'name', label: 'Name', type: 'text', value: userProfile.name },
        { key: 'role', label: 'Role / Title', type: 'text', value: userProfile.role },
      ],
      onSubmit: (values) => {
        if (!values.name.trim()) return;
        userProfile = { name: values.name.trim(), role: values.role.trim() };
        persistProfile();
        renderUserChip();
      },
    });
  });

  /* ------------------------------------------------------------------------
     DOCUMENTATION
     ------------------------------------------------------------------------ */

  function renderDocs() {
    const nav = document.getElementById('docsNav');
    const content = document.getElementById('docsContent');

    nav.innerHTML = DOCS.map((d, i) => `<button class="docs-nav-item ${i === 0 ? 'active' : ''}" data-doc="${d.id}">${d.label}</button>`).join('');
    content.innerHTML = DOCS.map((d, i) => `
      <div class="docs-section ${i === 0 ? 'active' : ''}" id="doc-${d.id}">
        <h2>${d.title}</h2>
        ${d.isFileList
          ? `<p>Every deliverable produced so far, in one place. Links open the file directly from this folder.</p>
             <div class="file-hub-grid">
               ${PROJECT_FILES.map((f) => `
                 <a class="file-hub-card" href="${f.href}" target="_blank" rel="noopener">
                   <div class="file-hub-name">${escapeHtml(f.name)}</div>
                   <div class="file-hub-desc">${escapeHtml(f.desc)}</div>
                 </a>
               `).join('')}
             </div>`
          : d.body.map((p) => `<p>${p}</p>`).join('')}
      </div>
    `).join('');

    nav.querySelectorAll('.docs-nav-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        nav.querySelectorAll('.docs-nav-item').forEach((b) => b.classList.remove('active'));
        content.querySelectorAll('.docs-section').forEach((s) => s.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('doc-' + btn.dataset.doc).classList.add('active');
      });
    });
  }

  /* ------------------------------------------------------------------------
     PROJECTS
     ------------------------------------------------------------------------ */

  let projectsState = { selectedId: null };

  function findProject(id) { return projects.find((p) => p.id === id); }

  function computeTaskLeaf(t) {
    if (t.subtasks && t.subtasks.length) {
      const total = t.subtasks.length;
      const done = t.subtasks.filter((s) => s.done).length;
      return { hasSubtasks: true, total, done, pct: Math.round((done / total) * 100), isDone: done === total };
    }
    return { hasSubtasks: false, total: 1, done: t.done ? 1 : 0, pct: t.done ? 100 : 0, isDone: !!t.done };
  }

  function computeProjectProgress(project) {
    let total = 0, done = 0;
    (project.tasks || []).forEach((t) => {
      const leaf = computeTaskLeaf(t);
      total += leaf.total;
      done += leaf.done;
    });
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  function projectStatusMeta(pct) {
    if (pct >= 100) return { label: 'Completado', chip: 'chip-green' };
    if (pct <= 0) return { label: 'Sin iniciar', chip: 'chip-navy' };
    return { label: 'En progreso', chip: 'chip-amber' };
  }

  function showProjectsListMode() {
    projectsState.selectedId = null;
    const detailEl = document.getElementById('projectDetailMode');
    const listEl = document.getElementById('projectsListMode');
    if (detailEl) detailEl.hidden = true;
    if (listEl) listEl.hidden = false;
    renderProjectGrid();
  }

  function showProjectsDetailMode(id) {
    projectsState.selectedId = id;
    const detailEl = document.getElementById('projectDetailMode');
    const listEl = document.getElementById('projectsListMode');
    if (listEl) listEl.hidden = true;
    if (detailEl) detailEl.hidden = false;
    renderProjectDetail();
  }

  function renderProjectGrid() {
    const grid = document.getElementById('projectGrid');
    if (!grid) return;
    if (!projects.length) {
      grid.innerHTML = `<div class="table-empty">No hay proyectos todavía — crea el primero con "+ Add Project".</div>`;
      return;
    }
    grid.innerHTML = projects.map((p) => {
      const { done, total, pct } = computeProjectProgress(p);
      const status = projectStatusMeta(pct);
      return `
        <div class="project-card" data-open-project="${p.id}">
          <div class="project-card-head">
            <h3>${escapeHtml(p.name)}</h3>
            <span class="chip ${status.chip}">${status.label}</span>
          </div>
          <p class="project-card-desc">${escapeHtml(p.description || '')}</p>
          <div class="project-card-meta-row"><span class="project-card-meta-label">Entregable</span><span>${escapeHtml(p.deliverable || '—')}</span></div>
          <div class="timeline-progress"><div class="timeline-progress-fill" style="width:${pct}%"></div></div>
          <div class="project-card-footer">
            <span>${done}/${total} tareas completadas</span>
            <span>${pct}%</span>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('[data-open-project]').forEach((card) => {
      card.addEventListener('click', () => showProjectsDetailMode(card.dataset.openProject));
    });
  }

  function renderProjectDetail() {
    const project = findProject(projectsState.selectedId);
    if (!project) { showProjectsListMode(); return; }

    const { done, total, pct } = computeProjectProgress(project);

    document.getElementById('projectDetailName').textContent = project.name;
    document.getElementById('projectDetailDesc').textContent = project.description || '';
    document.getElementById('projectDetailObjective').textContent = project.objective || '';
    document.getElementById('projectDetailResult').textContent = project.result || '';
    document.getElementById('projectDetailDeliverable').textContent = project.deliverable || '';
    document.getElementById('projectDetailBarFill').style.width = pct + '%';
    document.getElementById('projectDetailPct').textContent = `${done}/${total} tareas · ${pct}%`;

    const list = document.getElementById('projectTaskList');
    if (!project.tasks.length) {
      list.innerHTML = `<div class="table-empty">No hay tasks todavía — agrega la primera con "+ Add Task".</div>`;
    } else {
      list.innerHTML = project.tasks.map((t) => {
        const leaf = computeTaskLeaf(t);
        return `
          <div class="project-task-card" data-ptask-card="${t.id}">
            <div class="project-task-head">
              ${!leaf.hasSubtasks
                ? `<input type="checkbox" class="task-checkbox" data-toggle-ptask="${t.id}" ${t.done ? 'checked' : ''}>`
                : `<span class="project-task-dot ${leaf.isDone ? 'done' : ''}"></span>`}
              <div class="project-task-title ${leaf.isDone ? 'done' : ''}" contenteditable="true" data-ptask-id="${t.id}">${escapeHtml(t.title)}</div>
              ${leaf.hasSubtasks ? `<span class="project-task-count">${leaf.done}/${leaf.total}</span>` : ''}
              <div class="project-task-actions">
                <button class="icon-btn" data-add-psub="${t.id}" aria-label="Add subtask" title="Add subtask">
                  <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                </button>
                <button class="icon-btn" data-delete-ptask="${t.id}" aria-label="Delete task">
                  <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                </button>
              </div>
            </div>
            ${leaf.hasSubtasks ? `
              <div class="timeline-progress project-task-bar"><div class="timeline-progress-fill" style="width:${leaf.pct}%"></div></div>
              <div class="project-subtask-list">
                ${t.subtasks.map((s) => `
                  <div class="project-subtask-row" data-psub-row="${s.id}">
                    <input type="checkbox" class="task-checkbox" data-toggle-psub-task="${t.id}" data-toggle-psub-id="${s.id}" ${s.done ? 'checked' : ''}>
                    <div class="project-subtask-title ${s.done ? 'done' : ''}" contenteditable="true" data-psub-task="${t.id}" data-psub-id="${s.id}">${escapeHtml(s.title)}</div>
                    <button class="icon-btn" data-delete-psub-task="${t.id}" data-delete-psub-id="${s.id}" aria-label="Delete subtask">
                      <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                    </button>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }

    attachProjectDetailDelegation();
  }

  function attachProjectDetailDelegation() {
    const list = document.getElementById('projectTaskList');

    list.querySelectorAll('[data-toggle-ptask]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const project = findProject(projectsState.selectedId);
        const t = project && project.tasks.find((x) => x.id === cb.dataset.togglePtask);
        if (!t) return;
        t.done = cb.checked;
        persistProjects();
        renderProjectDetail();
        renderProjectGrid();
      });
    });

    list.querySelectorAll('[contenteditable][data-ptask-id]').forEach((el) => {
      el.addEventListener('focusout', () => {
        const project = findProject(projectsState.selectedId);
        const t = project && project.tasks.find((x) => x.id === el.dataset.ptaskId);
        if (!t) return;
        t.title = el.textContent.trim();
        persistProjects();
        renderProjectGrid();
      });
    });

    list.querySelectorAll('[data-add-psub]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const project = findProject(projectsState.selectedId);
        const t = project && project.tasks.find((x) => x.id === btn.dataset.addPsub);
        if (!t) return;
        const title = prompt('Nueva subtarea:');
        if (!title || !title.trim()) return;
        if (!t.subtasks) t.subtasks = [];
        t.subtasks.push({ id: uid('pst'), title: title.trim(), done: false });
        persistProjects();
        renderProjectDetail();
        renderProjectGrid();
      });
    });

    list.querySelectorAll('[data-delete-ptask]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('¿Eliminar esta task y sus subtareas?')) return;
        const project = findProject(projectsState.selectedId);
        if (!project) return;
        project.tasks = project.tasks.filter((t) => t.id !== btn.dataset.deletePtask);
        persistProjects();
        renderProjectDetail();
        renderProjectGrid();
      });
    });

    list.querySelectorAll('[data-toggle-psub-id]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const project = findProject(projectsState.selectedId);
        const t = project && project.tasks.find((x) => x.id === cb.dataset.togglePsubTask);
        const s = t && t.subtasks.find((x) => x.id === cb.dataset.togglePsubId);
        if (!s) return;
        s.done = cb.checked;
        persistProjects();
        renderProjectDetail();
        renderProjectGrid();
      });
    });

    list.querySelectorAll('[contenteditable][data-psub-id]').forEach((el) => {
      el.addEventListener('focusout', () => {
        const project = findProject(projectsState.selectedId);
        const t = project && project.tasks.find((x) => x.id === el.dataset.psubTask);
        const s = t && t.subtasks.find((x) => x.id === el.dataset.psubId);
        if (!s) return;
        s.title = el.textContent.trim();
        persistProjects();
      });
    });

    list.querySelectorAll('[data-delete-psub-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const project = findProject(projectsState.selectedId);
        const t = project && project.tasks.find((x) => x.id === btn.dataset.deletePsubTask);
        if (!t) return;
        t.subtasks = t.subtasks.filter((s) => s.id !== btn.dataset.deletePsubId);
        persistProjects();
        renderProjectDetail();
        renderProjectGrid();
      });
    });
  }

  // Static project-detail header fields live outside the re-rendered task list — bind once.
  (function attachProjectHeaderFieldsOnce() {
    const fieldMap = {
      projectDetailName: 'name',
      projectDetailDesc: 'description',
      projectDetailObjective: 'objective',
      projectDetailResult: 'result',
      projectDetailDeliverable: 'deliverable',
    };
    Object.keys(fieldMap).forEach((elId) => {
      const el = document.getElementById(elId);
      if (!el) return;
      el.addEventListener('focusout', () => {
        const project = findProject(projectsState.selectedId);
        if (!project) return;
        project[fieldMap[elId]] = el.textContent.trim();
        persistProjects();
        if (elId === 'projectDetailName') renderProjectGrid();
      });
    });
  })();

  document.getElementById('addProjectBtn').addEventListener('click', () => {
    openModal({
      title: 'Add Project',
      submitLabel: 'Create Project',
      fields: [
        { key: 'name', label: 'Nombre del proyecto', type: 'text', value: '', placeholder: 'e.g. Diagnóstico Ecosistema Digital' },
        { key: 'description', label: 'Descripción', type: 'textarea', value: '' },
        { key: 'objective', label: 'Objetivo', type: 'textarea', value: '' },
        { key: 'result', label: 'Resultado esperado', type: 'textarea', value: '' },
        { key: 'deliverable', label: 'Entregable', type: 'textarea', value: '' },
      ],
      onSubmit: (values) => {
        if (!values.name.trim()) return;
        const project = {
          id: uid('proj'), name: values.name.trim(), description: values.description.trim(),
          objective: values.objective.trim(), result: values.result.trim(), deliverable: values.deliverable.trim(),
          tasks: [],
        };
        projects.push(project);
        persistProjects();
        renderProjectGrid();
        showProjectsDetailMode(project.id);
      },
    });
  });

  document.getElementById('backToProjectsBtn').addEventListener('click', showProjectsListMode);

  document.getElementById('deleteProjectBtn').addEventListener('click', () => {
    const project = findProject(projectsState.selectedId);
    if (!project) return;
    if (!confirm(`¿Eliminar el proyecto "${project.name}" y todas sus tasks?`)) return;
    projects = projects.filter((p) => p.id !== project.id);
    persistProjects();
    showProjectsListMode();
  });

  document.getElementById('addProjectTaskBtn').addEventListener('click', () => {
    const project = findProject(projectsState.selectedId);
    if (!project) return;
    openModal({
      title: 'Add Task',
      submitLabel: 'Add Task',
      fields: [
        { key: 'title', label: 'Título de la task', type: 'text', value: '' },
        { key: 'subtasks', label: 'Subtareas (una por línea, opcional)', type: 'textarea', value: '' },
      ],
      onSubmit: (values) => {
        if (!values.title.trim()) return;
        const subtasks = values.subtasks.split('\n').map((s) => s.trim()).filter(Boolean).map((title) => ({ id: uid('pst'), title, done: false }));
        project.tasks.push({ id: uid('pt'), title: values.title.trim(), done: false, subtasks });
        persistProjects();
        renderProjectDetail();
        renderProjectGrid();
      },
    });
  });

  /* ------------------------------------------------------------------------
     TASKS — 30-60-90 PLAN
     ------------------------------------------------------------------------ */

  const PHASE_LABEL = { '30 days': 'Primeros 30 días', '60 days': '60 días', '90 days': '90 días' };

  function renderTasks() {
    const wrap = document.getElementById('tasksPhases');
    wrap.innerHTML = TASK_PHASES.map((phase) => {
      const items = tasks.filter((t) => t.phase === phase);
      const done = items.filter((t) => t.done).length;
      const pct = items.length ? Math.round((done / items.length) * 100) : 0;
      return `
        <div class="task-phase-card">
          <div class="task-phase-head">
            <h3>${PHASE_LABEL[phase] || phase}</h3>
            <span class="task-phase-count">${done}/${items.length} completado${done === 1 ? '' : 's'}</span>
          </div>
          <div class="timeline-progress" style="margin-bottom:16px;"><div class="timeline-progress-fill" style="width:${pct}%"></div></div>
          <div class="task-list">
            ${items.map((t) => `
              <div class="task-row ${t.done ? 'done' : ''}" data-task-row="${t.id}">
                <input type="checkbox" class="task-checkbox" data-toggle-task="${t.id}" ${t.done ? 'checked' : ''}>
                <div class="task-row-body">
                  <div class="task-row-title">${escapeHtml(t.title)}</div>
                  ${t.desc ? `<div class="task-row-desc">${escapeHtml(t.desc)}</div>` : ''}
                </div>
                <div class="task-row-actions">
                  <button class="icon-btn" data-edit-task="${t.id}" aria-label="Edit"><svg viewBox="0 0 24 24"><path d="M4 20h4L18.5 9.5a2 2 0 000-2.8l-1.2-1.2a2 2 0 00-2.8 0L4 16v4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></button>
                  <button class="icon-btn" data-delete-task="${t.id}" aria-label="Delete"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

    attachTasksDelegation();
  }

  function attachTasksDelegation() {
    const wrap = document.getElementById('tasksPhases');
    wrap.querySelectorAll('[data-toggle-task]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const t = tasks.find((x) => x.id === cb.dataset.toggleTask);
        if (!t) return;
        t.done = cb.checked;
        persistTasks();
        renderTasks();
      });
    });
    wrap.querySelectorAll('[data-edit-task]').forEach((btn) => {
      btn.addEventListener('click', () => openTaskModal(tasks.find((t) => t.id === btn.dataset.editTask)));
    });
    wrap.querySelectorAll('[data-delete-task]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this task?')) return;
        tasks = tasks.filter((t) => t.id !== btn.dataset.deleteTask);
        persistTasks();
        renderTasks();
      });
    });
  }

  function openTaskModal(existing) {
    openModal({
      title: existing ? 'Edit Task' : 'Add Task',
      submitLabel: existing ? 'Save Changes' : 'Add Task',
      fields: [
        { key: 'phase', label: 'Phase', type: 'select', options: TASK_PHASES, value: existing ? existing.phase : TASK_PHASES[0] },
        { key: 'title', label: 'Title', type: 'text', value: existing ? existing.title : '' },
        { key: 'desc', label: 'Description', type: 'textarea', value: existing ? existing.desc : '' },
      ],
      onSubmit: (values) => {
        if (!values.title.trim()) return;
        if (existing) {
          existing.phase = values.phase; existing.title = values.title.trim(); existing.desc = values.desc.trim();
        } else {
          tasks.push({ id: uid('t'), phase: values.phase, title: values.title.trim(), desc: values.desc.trim(), done: false });
        }
        persistTasks();
        renderTasks();
      },
    });
  }

  document.getElementById('addTaskBtn').addEventListener('click', () => openTaskModal(null));

  /* ------------------------------------------------------------------------
     OBJECTIVES & KPIs / OKRs
     ------------------------------------------------------------------------ */

  function renderKpis() {
    const wrap = document.getElementById('kpiList');
    wrap.innerHTML = kpis.map((k) => `
      <div class="kpi-card" data-kpi-card="${k.id}">
        <div class="kpi-card-head">
          <h4 contenteditable="true" data-kpi-id="${k.id}" data-kpi-field="name">${escapeHtml(k.name)}</h4>
          <button class="icon-btn" data-delete-kpi="${k.id}" aria-label="Delete KPI"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
        </div>
        <p class="kpi-desc" contenteditable="true" data-kpi-id="${k.id}" data-kpi-field="desc">${escapeHtml(k.desc)}</p>
        <ul class="kpi-bullets">${k.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
        ${k.note ? `<p class="kpi-note">${escapeHtml(k.note)}</p>` : ''}
      </div>
    `).join('');

    wrap.querySelectorAll('[contenteditable]').forEach((el) => {
      el.addEventListener('focusout', () => {
        const k = kpis.find((x) => x.id === el.dataset.kpiId);
        if (!k) return;
        k[el.dataset.kpiField] = el.textContent.trim();
        persistKpis();
      });
    });
    wrap.querySelectorAll('[data-delete-kpi]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this KPI?')) return;
        kpis = kpis.filter((k) => k.id !== btn.dataset.deleteKpi);
        persistKpis();
        renderKpis();
      });
    });
  }

  document.getElementById('addKpiBtn').addEventListener('click', () => {
    openModal({
      title: 'Add KPI',
      submitLabel: 'Add KPI',
      fields: [
        { key: 'name', label: 'Name', type: 'text', value: '', placeholder: 'e.g. KPI 3 — …' },
        { key: 'desc', label: 'Description', type: 'textarea', value: '' },
        { key: 'bullets', label: 'Bullets (one per line)', type: 'textarea', value: '' },
        { key: 'note', label: 'Note (optional)', type: 'text', value: '' },
      ],
      onSubmit: (values) => {
        if (!values.name.trim()) return;
        kpis.push({
          id: uid('kpi'), name: values.name.trim(), desc: values.desc.trim(),
          bullets: values.bullets.split('\n').map((s) => s.trim()).filter(Boolean),
          note: values.note.trim(),
        });
        persistKpis();
        renderKpis();
      },
    });
  });

  function krSectionsHtml(kr) {
    let html = '';
    if (kr.sections) {
      html += kr.sections.map((s) => `
        <div class="kr-section">
          <div class="kr-section-heading">${escapeHtml(s.heading)}</div>
          <ul class="kr-section-items">${s.items.map((it) => `<li>${escapeHtml(it)}</li>`).join('')}</ul>
        </div>
      `).join('');
    }
    if (kr.campaigns) {
      html += `<div class="kr-campaigns">${kr.campaigns.map((c) => `
        <div class="campaign-brief-card">
          <div class="campaign-brief-name">${escapeHtml(c.name)}</div>
          <table class="campaign-brief-table">
            ${c.fields.map(([label, value]) => `<tr><td class="cb-label">${escapeHtml(label)}</td><td class="cb-value">${escapeHtml(value)}</td></tr>`).join('')}
          </table>
        </div>
      `).join('')}</div>`;
    }
    if (kr.impact) {
      html += `<p class="kr-impact"><b>Impacto a largo plazo:</b> ${escapeHtml(kr.impact)}</p>`;
    }
    return html;
  }

  function renderObjective() {
    document.getElementById('objectiveTitle').textContent = DEFAULT_OBJECTIVE.title;
    document.getElementById('q3Label').textContent = DEFAULT_OBJECTIVE.q3Label;
    document.getElementById('q4Label').textContent = DEFAULT_OBJECTIVE.q4Label;

    ['Q3', 'Q4'].forEach((quarter) => {
      const grid = document.getElementById('krGrid' + quarter);
      const items = keyResults.filter((kr) => kr.quarter === quarter);
      grid.innerHTML = items.map((kr) => `
        <div class="kr-card ${kr.done ? 'done' : ''}" data-kr-card="${kr.id}">
          <div class="kr-card-head">
            <input type="checkbox" class="task-checkbox" data-toggle-krv2="${kr.id}" ${kr.done ? 'checked' : ''}>
            <h4 class="kr-title">${escapeHtml(kr.title)}</h4>
            <div class="kr-card-actions">
              <button class="icon-btn" data-edit-krv2="${kr.id}" aria-label="Edit"><svg viewBox="0 0 24 24"><path d="M4 20h4L18.5 9.5a2 2 0 000-2.8l-1.2-1.2a2 2 0 00-2.8 0L4 16v4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></button>
              <button class="icon-btn" data-delete-krv2="${kr.id}" aria-label="Delete"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
            </div>
          </div>
          <p class="kr-desc">${escapeHtml(kr.desc || '')}</p>
          ${krSectionsHtml(kr)}
        </div>
      `).join('');
    });

    attachObjectiveDelegation();
  }

  function attachObjectiveDelegation() {
    document.querySelectorAll('[data-toggle-krv2]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const kr = keyResults.find((k) => k.id === cb.dataset.toggleKrv2);
        if (!kr) return;
        kr.done = cb.checked;
        persistKeyResults();
        renderObjective();
      });
    });
    document.querySelectorAll('[data-delete-krv2]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this key result?')) return;
        keyResults = keyResults.filter((k) => k.id !== btn.dataset.deleteKrv2);
        persistKeyResults();
        renderObjective();
      });
    });
    document.querySelectorAll('[data-edit-krv2]').forEach((btn) => {
      btn.addEventListener('click', () => openKrModal(keyResults.find((k) => k.id === btn.dataset.editKrv2)));
    });
  }

  // Static "+ Add Key Result" buttons live outside the re-rendered grid — bind once.
  document.querySelectorAll('[data-add-kr]').forEach((btn) => {
    btn.addEventListener('click', () => openKrModal(null, btn.dataset.addKr));
  });

  function openKrModal(existing, quarterForNew) {
    openModal({
      title: existing ? 'Edit Key Result' : 'Add Key Result',
      submitLabel: existing ? 'Save Changes' : 'Add Key Result',
      fields: [
        { key: 'title', label: 'Title', type: 'text', value: existing ? existing.title : '' },
        { key: 'desc', label: 'Description', type: 'textarea', value: existing ? existing.desc : '' },
      ],
      onSubmit: (values) => {
        if (!values.title.trim()) return;
        if (existing) {
          existing.title = values.title.trim();
          existing.desc = values.desc.trim();
        } else {
          keyResults.push({ id: uid('kr'), quarter: quarterForNew || 'Q3', title: values.title.trim(), desc: values.desc.trim(), done: false });
        }
        persistKeyResults();
        renderObjective();
      },
    });
  }

  function renderCampaignMetricsGuide() {
    document.getElementById('campaignMetricsBody').innerHTML = CAMPAIGN_METRICS_GUIDE.map(([obj, metrics]) => `
      <tr><td><b>${escapeHtml(obj)}</b></td><td>${escapeHtml(metrics)}</td></tr>
    `).join('');
  }

  /* ------------------------------------------------------------------------
     CAMPAIGN KPIs — table + growth chart + export
     ------------------------------------------------------------------------ */

  let campaignState = { search: '', platform: 'All' };
  let growthChart = null;

  function campaignPlatformOptionsHtml(selected) {
    const opts = campaignPlatforms.map((p) => `<option value="${escapeHtml(p)}" ${p === selected ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('');
    return opts + `<option value="__add__">+ Add new platform…</option>`;
  }

  function addCampaignPlatform(name) {
    if (!campaignPlatforms.includes(name)) {
      campaignPlatforms.push(name);
      persistCampaignPlatforms();
    }
  }

  function renderCampaignFilters() {
    const wrap = document.getElementById('campaignPlatformFilters');
    const options = ['All', ...campaignPlatforms];
    wrap.innerHTML = options.map((p) => `<button class="filter-chip ${campaignState.platform === p ? 'active' : ''}" data-cplatform="${escapeHtml(p)}">${escapeHtml(p)}</button>`).join('');
    wrap.querySelectorAll('button').forEach((btn) => btn.addEventListener('click', () => {
      campaignState.platform = btn.dataset.cplatform;
      renderCampaignFilters();
      renderCampaignTable();
    }));
  }

  function renderCampaignHead() {
    const thead = document.getElementById('campaignHead');
    thead.innerHTML = `<tr>${campaignColumns.map((c) => `
      <th>
        <div class="th-with-action">
          <span class="th-label">${escapeHtml(c.label)}</span>
          ${!c.core ? `<button class="icon-btn" data-delete-ccol="${c.key}" aria-label="Delete column"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>` : ''}
        </div>
      </th>`).join('')}<th></th></tr>`;

    thead.querySelectorAll('[data-delete-ccol]').forEach((btn) => btn.addEventListener('click', () => {
      const key = btn.dataset.deleteCcol;
      if (!confirm('Delete this KPI column? This removes it from every entry.')) return;
      campaignColumns = campaignColumns.filter((c) => c.key !== key);
      campaignRows.forEach((r) => { delete r[key]; });
      persistCampaignColumns(); persistCampaignRows();
      renderCampaignHead(); renderCampaignTable(); renderChartControls(); renderGrowthChart();
    }));
  }

  function campaignCellHtml(col, row) {
    const value = row[col.key] != null ? row[col.key] : '';
    if (col.type === 'campaignPlatform') {
      return `<td><select class="cell-select" data-crow="${row.id}" data-ckey="platform">${campaignPlatformOptionsHtml(value)}</select></td>`;
    }
    if (col.type === 'date') {
      return `<td><input type="date" class="cell-select" data-crow="${row.id}" data-ckey="period" value="${escapeHtml(value)}"></td>`;
    }
    if (col.type === 'number') {
      return `<td contenteditable="true" data-crow="${row.id}" data-ckey="${col.key}" class="num-cell">${escapeHtml(value)}</td>`;
    }
    return `<td contenteditable="true" data-crow="${row.id}" data-ckey="${col.key}">${escapeHtml(value)}</td>`;
  }

  function renderCampaignTable() {
    const q = campaignState.search.toLowerCase();
    const rows = campaignRows.filter((r) => {
      const matchesSearch = !q || (r.campaign || '').toLowerCase().includes(q);
      const matchesPlatform = campaignState.platform === 'All' || r.platform === campaignState.platform;
      return matchesSearch && matchesPlatform;
    }).sort((a, b) => (a.period || '').localeCompare(b.period || ''));

    const body = document.getElementById('campaignBody');
    const empty = document.getElementById('campaignEmpty');

    if (rows.length === 0) { body.innerHTML = ''; empty.hidden = false; return; }
    empty.hidden = true;

    body.innerHTML = rows.map((r) => `
      <tr>
        ${campaignColumns.map((c) => campaignCellHtml(c, r)).join('')}
        <td class="row-delete-cell"><button class="icon-btn" data-delete-crow="${r.id}" aria-label="Delete entry"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></td>
      </tr>
    `).join('');
  }

  function campaignBodyDelegation() {
    const body = document.getElementById('campaignBody');

    body.addEventListener('focusout', (e) => {
      const td = e.target.closest('td[contenteditable="true"]');
      if (!td) return;
      const row = campaignRows.find((r) => r.id === td.dataset.crow);
      if (!row) return;
      row[td.dataset.ckey] = td.textContent.trim();
      persistCampaignRows();
      renderChartControls();
      renderGrowthChart();
    });

    body.addEventListener('change', (e) => {
      const el = e.target.closest('[data-crow]');
      if (!el) return;
      const row = campaignRows.find((r) => r.id === el.dataset.crow);
      if (!row) return;
      const key = el.dataset.ckey;

      if (key === 'platform' && el.value === '__add__') {
        const name = prompt('New platform name:');
        if (!name || !name.trim()) { el.value = row.platform || ''; return; }
        addCampaignPlatform(name.trim());
        row.platform = name.trim();
        persistCampaignRows();
        renderCampaignFilters();
        renderCampaignTable();
        renderChartControls();
        renderGrowthChart();
        return;
      }

      row[key] = el.value;
      persistCampaignRows();
      renderGrowthChart();
    });

    body.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-delete-crow]');
      if (!btn) return;
      if (!confirm('Delete this campaign entry?')) return;
      campaignRows = campaignRows.filter((r) => r.id !== btn.dataset.deleteCrow);
      persistCampaignRows();
      renderCampaignTable();
      renderGrowthChart();
    });
  }

  document.getElementById('campaignSearch').addEventListener('input', (e) => { campaignState.search = e.target.value; renderCampaignTable(); });

  document.getElementById('addCampaignRowBtn').addEventListener('click', () => {
    const row = { id: uid('camp') };
    campaignColumns.forEach((c) => {
      if (c.key === 'platform') row.platform = campaignPlatforms[0] || '';
      else if (c.key === 'period') row.period = new Date().toISOString().slice(0, 10);
      else row[c.key] = '';
    });
    campaignRows.unshift(row);
    persistCampaignRows();
    renderCampaignTable();
    renderChartControls();
    renderGrowthChart();
  });

  document.getElementById('addCampaignColumnBtn').addEventListener('click', () => {
    const name = prompt('New KPI column name (e.g. "Conversions", "Video Views"):');
    if (!name || !name.trim()) return;
    const aggInput = (prompt('How should months be aggregated for this KPI — type "sum" or "avg":', 'sum') || 'sum').trim().toLowerCase();
    const agg = aggInput === 'avg' ? 'avg' : 'sum';
    const key = 'kpi_' + slugify(name) + '_' + uid('c');
    campaignColumns.push({ key, label: name.trim(), type: 'number', agg, core: false });
    campaignRows.forEach((r) => { r[key] = ''; });
    persistCampaignColumns(); persistCampaignRows();
    renderCampaignHead(); renderCampaignTable(); renderChartControls(); renderGrowthChart();
  });

  document.getElementById('addCampaignPlatformBtn').addEventListener('click', () => {
    const name = prompt('New platform / channel name:');
    if (!name || !name.trim()) return;
    if (campaignPlatforms.includes(name.trim())) { alert('That platform already exists.'); return; }
    addCampaignPlatform(name.trim());
    renderCampaignFilters();
  });

  /* ---- Growth chart ---- */

  function renderChartControls() {
    const metricSel = document.getElementById('chartMetricSelect');
    const platformSel = document.getElementById('chartPlatformSelect');
    const metricCols = campaignColumns.filter((c) => c.type === 'number');
    const prevMetric = metricSel.value;
    const prevPlatform = platformSel.value;

    metricSel.innerHTML = metricCols.map((c) => `<option value="${c.key}">${escapeHtml(c.label)}</option>`).join('');
    if (metricCols.some((c) => c.key === prevMetric)) metricSel.value = prevMetric;

    platformSel.innerHTML = ['All Platforms', ...campaignPlatforms].map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');
    if (prevPlatform && (prevPlatform === 'All Platforms' || campaignPlatforms.includes(prevPlatform))) platformSel.value = prevPlatform;
  }

  // Agrupa campaignRows por fecha para armar una curva — reutilizable tanto
  // para el chart general (filtrado por plataforma) como para la curva de
  // un reporte de campaña puntual (filtrado por nombre de campaña).
  function buildGrowthSeries(metricKey, opts) {
    opts = opts || {};
    const col = campaignColumns.find((c) => c.key === metricKey);
    if (!col) return null;
    const filtered = campaignRows.filter((r) => {
      const platformOk = !opts.platform || opts.platform === 'All Platforms' || r.platform === opts.platform;
      const campaignOk = !opts.campaign || (r.campaign || '').trim().toLowerCase() === opts.campaign.trim().toLowerCase();
      return platformOk && campaignOk;
    });
    const byDate = {};
    filtered.forEach((r) => {
      const d = r.period || 'Sin fecha';
      const v = parseFloat(r[metricKey]);
      if (isNaN(v)) return;
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(v);
    });
    const dates = Object.keys(byDate).sort();
    if (!dates.length) return { col, labels: [], values: [] };
    const values = dates.map((d) => {
      const arr = byDate[d];
      const sum = arr.reduce((a, b) => a + b, 0);
      return col.agg === 'avg' ? Math.round((sum / arr.length) * 100) / 100 : sum;
    });
    return { col, labels: dates, values };
  }

  function drawLineChart(canvas, series, label, existingChart, extraOptions) {
    if (existingChart) existingChart.destroy();
    // extraOptions.animation === false se usa para el snapshot que exporta el
    // PDF: toBase64Image() se llama justo despues del constructor, y con la
    // animacion por defecto de Chart.js (~1s, via requestAnimationFrame) ese
    // primer frame todavia no dibujo nada -- el resultado es una imagen en
    // blanco (la curva "no se ve"). Desactivando la animacion, Chart.js dibuja
    // de forma sincrona dentro del propio constructor y el snapshot sale bien.
    const animation = extraOptions && extraOptions.animation === false ? false : undefined;
    return new window.Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: series.labels,
        datasets: [{
          label,
          data: series.values,
          borderColor: '#1D2B7F',
          backgroundColor: 'rgba(61,183,255,0.18)',
          borderWidth: 2.5,
          pointBackgroundColor: '#3DB7FF',
          pointRadius: 4,
          tension: 0.3,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation,
        plugins: { legend: { display: true, labels: { color: '#4B5478', font: { family: 'Inter' } } } },
        scales: {
          x: { ticks: { color: '#8B93B8' }, grid: { display: false } },
          y: { ticks: { color: '#8B93B8' }, grid: { color: 'rgba(29,43,127,0.06)' }, beginAtZero: true },
        },
      },
    });
  }

  function renderGrowthChart() {
    const metricSel = document.getElementById('chartMetricSelect');
    const platformSel = document.getElementById('chartPlatformSelect');
    const canvas = document.getElementById('growthChartCanvas');
    const emptyEl = document.getElementById('chartEmpty');
    const captionEl = document.getElementById('chartCaption');
    const metricKey = metricSel.value;
    const platformFilter = platformSel.value;

    const series = buildGrowthSeries(metricKey, { platform: platformFilter });

    const hideAll = () => {
      if (growthChart) { growthChart.destroy(); growthChart = null; }
      canvas.hidden = true;
      emptyEl.hidden = false;
      if (captionEl) captionEl.hidden = true;
    };

    if (typeof window.Chart === 'undefined') {
      hideAll();
      emptyEl.textContent = 'No se pudo cargar la librería de gráficos (Chart.js) — revisa tu conexión a internet y recarga la página.';
      return;
    }
    if (!series || series.labels.length === 0) {
      hideAll();
      emptyEl.textContent = 'Agrega al menos una entrada para ver la curva de crecimiento.';
      return;
    }
    canvas.hidden = false;
    emptyEl.hidden = true;

    growthChart = drawLineChart(canvas, series, `${series.col.label} — ${platformFilter || 'All Platforms'}`, growthChart);
    if (captionEl) {
      if (series.labels.length === 1) {
        captionEl.hidden = false;
        captionEl.textContent = 'Un solo corte cargado por ahora (un punto) — agrega más fechas para ver la tendencia.';
      } else {
        captionEl.hidden = true;
      }
    }
  }

  document.getElementById('chartMetricSelect').addEventListener('change', renderGrowthChart);
  document.getElementById('chartPlatformSelect').addEventListener('change', renderGrowthChart);

  document.getElementById('exportChartPngBtn').addEventListener('click', () => {
    if (!growthChart) { alert('Add data first — there is no chart to export yet.'); return; }
    const link = document.createElement('a');
    link.download = 'campaign-growth-curve.png';
    link.href = growthChart.toBase64Image();
    link.click();
  });

  document.getElementById('exportCsvBtn').addEventListener('click', () => {
    if (campaignRows.length === 0) { alert('Add data first — there is nothing to export yet.'); return; }
    const headers = campaignColumns.map((c) => c.label);
    const lines = [headers.join(',')];
    campaignRows.forEach((r) => {
      const line = campaignColumns.map((c) => {
        const v = String(r[c.key] != null ? r[c.key] : '').replace(/"/g, '""');
        return v.includes(',') ? `"${v}"` : v;
      });
      lines.push(line.join(','));
    });
    try {
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'campaign-kpis.csv';
      link.click();
    } catch (err) {
      alert('Could not export CSV in this environment. Try opening the HUB in a standard browser.');
    }
  });

  /* ------------------------------------------------------------------------
     REPORTS — Campañas: banco + builder de reporte estándar
     Mismos campos para todas las campañas (Campaña y periodo, Mercado(s),
     Producto(s) foco, Canales con sus KPIs, Presupuesto, Contenido publicado,
     Resultados, Aprendizajes), más una curva de crecimiento que se arma sola
     leyendo los datos ya cargados en General (tab de al lado), filtrados por
     el nombre exacto de la campaña — así no se carga el dato dos veces.
     ------------------------------------------------------------------------ */

  let campaignReportSearchState = '';
  let crBuilderState = null;
  let crChart = null;

  function freshCRState() {
    return {
      editingId: null,
      name: '',
      periodStart: '',
      periodEnd: '',
      markets: '',
      focusProducts: '',
      objective: '',
      budgetConfirmed: '',
      budgetSpent: '',
      channels: [{ id: uid('ch'), name: '', kind: 'paid', kpis: [{ id: uid('kpi'), label: '', value: '' }] }],
      demographics: { resultsKpis: [], reachKpis: [], notes: '' },
      content: [],
      results: '',
      observations: '',
      methodology: '',
      learnings: '',
      nextSteps: '',
      chartMetric: '',
      chartPlatform: 'All Platforms',
    };
  }

  // Un canal es "comercio / atribución" (Amazon Attribution, Walmart…) si se
  // marcó explícitamente al agregarlo, o — para reportes viejos que no
  // tenían este campo — si su nombre lo delata. Así el PDF separa ventas
  // atribuidas de métricas de entrega de pauta, que son cosas distintas.
  function crChannelKind(ch) {
    if (ch.kind === 'commerce' || ch.kind === 'paid') return ch.kind;
    const n = (ch.name || '').toLowerCase();
    return (n.includes('attribution') || n.includes('walmart') || n.includes('amazon')) ? 'commerce' : 'paid';
  }

  function crBudgetPct(s) {
    const conf = parseFloat(s.budgetConfirmed);
    const spent = parseFloat(s.budgetSpent);
    if (!conf || isNaN(conf) || isNaN(spent)) return null;
    return Math.round((spent / conf) * 100);
  }

  function crFormatDate(iso) {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function crPeriodLabel(report) {
    if (!report.periodStart && !report.periodEnd) return '—';
    if (report.periodStart && report.periodEnd) return `${crFormatDate(report.periodStart)} – ${crFormatDate(report.periodEnd)}`;
    return crFormatDate(report.periodStart || report.periodEnd);
  }

  // Convierte un screenshot subido a JPEG redimensionado (máx 1100px de
  // ancho) antes de guardarlo como base64 — para no inflar el registro con
  // fotos de cámara de varios MB cada una.
  function crResizeImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error('No se pudo leer el archivo.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('No se pudo leer la imagen.'));
        img.onload = () => {
          const maxWidth = 1100;
          const scale = Math.min(1, maxWidth / img.width);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function crMetricOptions() {
    return campaignColumns.filter((c) => c.type === 'number');
  }

  function renderCRBuilderChart() {
    const canvas = document.getElementById('crChartCanvas');
    const empty = document.getElementById('crChartEmpty');
    const caption = document.getElementById('crChartCaption');
    if (!canvas || !crBuilderState) return;
    const s = crBuilderState;
    const series = s.chartMetric && s.name.trim() ? buildGrowthSeries(s.chartMetric, { platform: s.chartPlatform, campaign: s.name }) : null;

    const hideAll = () => {
      if (crChart) { crChart.destroy(); crChart = null; }
      canvas.hidden = true;
      empty.hidden = false;
      if (caption) caption.hidden = true;
    };

    if (!s.name.trim()) {
      hideAll();
      empty.textContent = 'Escribe el nombre de la campaña arriba — la curva busca en General las filas con ese mismo nombre.';
      return;
    }
    if (typeof window.Chart === 'undefined') {
      hideAll();
      empty.textContent = 'No se pudo cargar la librería de gráficos (Chart.js) — revisa tu conexión a internet y recarga la página. Los datos siguen guardados, solo falta la librería para dibujar la curva.';
      return;
    }
    if (!series || series.labels.length === 0) {
      hideAll();
      empty.textContent = `No hay datos en General todavía con el nombre de campaña "${s.name.trim()}". Cárgalos ahí (tab General) y esta curva se arma sola.`;
      return;
    }
    canvas.hidden = false;
    empty.hidden = true;
    crChart = drawLineChart(canvas, series, `${series.col.label} — ${s.chartPlatform || 'All Platforms'}`, crChart);
    if (caption) {
      if (series.labels.length === 1) {
        caption.hidden = false;
        caption.textContent = 'Por ahora hay un solo corte cargado en General (un punto) — a medida que agregues más fechas de esta misma campaña ahí, la curva se arma sola.';
      } else {
        caption.hidden = true;
      }
    }
  }

  function crChannelHtml(ch) {
    return `
      <div class="cr-channel-card" data-cr-channel="${ch.id}">
        <div class="cr-channel-head">
          <input type="text" class="text-input" list="crChannelSuggestions" placeholder="Canal — ej. Meta, TikTok, Amazon Attribution" data-cr-channel-name="${ch.id}" value="${escapeHtml(ch.name)}">
          <button class="icon-btn" data-cr-delete-channel="${ch.id}" title="Eliminar canal" aria-label="Eliminar canal">
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
        </div>
        <div class="cr-kpi-list">
          ${ch.kpis.map((k) => `
            <div class="cr-kpi-row" data-cr-kpi="${k.id}">
              <input type="text" class="text-input" placeholder="KPI — ej. Reach" data-cr-kpi-field="label" data-cr-channel="${ch.id}" data-cr-kpi="${k.id}" value="${escapeHtml(k.label)}">
              <input type="text" class="text-input" placeholder="Valor — ej. 42,300" data-cr-kpi-field="value" data-cr-channel="${ch.id}" data-cr-kpi="${k.id}" value="${escapeHtml(k.value)}">
              <button class="icon-btn icon-btn-tiny" data-cr-delete-kpi="${k.id}" data-cr-channel="${ch.id}" title="Eliminar KPI" aria-label="Eliminar KPI">
                <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
              </button>
            </div>`).join('')}
        </div>
        <button class="btn btn-ghost btn-small" data-cr-add-kpi="${ch.id}">+ Agregar KPI</button>
      </div>`;
  }

  // Filas de KPI para los dos paneles de demografía (Resultados / Alcance),
  // igual de simples que las de un canal pero sin estar atadas a uno —
  // reusan el mismo patrón visual (label + value + borrar).
  function crDemoKpiRowHtml(listKey, k) {
    return `
      <div class="cr-kpi-row" data-cr-demo-kpi="${k.id}">
        <input type="text" class="text-input" placeholder="Ej. Mujeres" data-cr-demo-field="label" data-cr-demo-list="${listKey}" data-cr-demo-kpi="${k.id}" value="${escapeHtml(k.label)}">
        <input type="text" class="text-input" placeholder="Ej. 62% (1,302) · CPR $0.14" data-cr-demo-field="value" data-cr-demo-list="${listKey}" data-cr-demo-kpi="${k.id}" value="${escapeHtml(k.value)}">
        <button class="icon-btn icon-btn-tiny" data-cr-demo-delete-kpi="${k.id}" data-cr-demo-list="${listKey}" title="Eliminar" aria-label="Eliminar">
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
      </div>`;
  }

  function crContentItemHtml(it) {
    return `
      <div class="cr-content-card" data-cr-content="${it.id}">
        <div class="cr-content-thumb">
          ${it.image
            ? `<img src="${it.image}" alt="">`
            : `<label class="cr-content-upload">
                <input type="file" accept="image/*" data-cr-content-upload="${it.id}" hidden>
                <svg viewBox="0 0 24 24"><path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>
                <span>Subir screenshot</span>
              </label>`}
        </div>
        <input type="text" class="text-input" placeholder="Link (opcional)" data-cr-content-field="link" data-cr-content="${it.id}" value="${escapeHtml(it.link)}">
        <input type="text" class="text-input" placeholder="Caption — ej. KV principal, Reel #1…" data-cr-content-field="caption" data-cr-content="${it.id}" value="${escapeHtml(it.caption)}">
        <button class="icon-btn" data-cr-delete-content="${it.id}" title="Eliminar pieza" aria-label="Eliminar pieza">
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </div>`;
  }

  function renderCRBuilderBody() {
    const body = document.getElementById('crBuilderBody');
    if (!body || !crBuilderState) return;
    const s = crBuilderState;
    const metricOptions = crMetricOptions();
    if (!s.chartMetric && metricOptions.length) s.chartMetric = metricOptions[0].key;

    document.getElementById('crBuilderTitle').textContent = s.editingId ? 'Editar Reporte de Campaña' : 'Nuevo Reporte de Campaña';

    body.innerHTML = `
      <datalist id="crChannelSuggestions">${campaignPlatforms.map((p) => `<option value="${escapeHtml(p)}">`).join('')}</datalist>

      <div class="af-builder-step-label">Datos generales</div>
      <div class="brief-form-grid" style="grid-template-columns: repeat(2, 1fr);">
        <div class="field-group">
          <label class="field-label">Nombre de la campaña</label>
          <input type="text" class="text-input" id="crFormName" value="${escapeHtml(s.name)}" placeholder="Ej. Back to School USA 2026">
        </div>
        <div class="field-group">
          <label class="field-label">Mercado(s)</label>
          <input type="text" class="text-input" id="crFormMarkets" value="${escapeHtml(s.markets)}" placeholder="Ej. USA — o Ecuador, República Dominicana">
        </div>
      </div>
      <div class="brief-form-grid" style="grid-template-columns: repeat(2, 1fr);">
        <div class="field-group">
          <label class="field-label">Periodo — inicio</label>
          <input type="date" class="text-input" id="crFormPeriodStart" value="${escapeHtml(s.periodStart)}">
        </div>
        <div class="field-group">
          <label class="field-label">Periodo — fin</label>
          <input type="date" class="text-input" id="crFormPeriodEnd" value="${escapeHtml(s.periodEnd)}">
        </div>
      </div>
      <div class="field-group">
        <label class="field-label">Producto(s) foco</label>
        <input type="text" class="text-input" id="crFormFocusProducts" value="${escapeHtml(s.focusProducts)}" placeholder="SKU(s) hero de la campaña">
      </div>
      <div class="field-group">
        <label class="field-label">Objetivo de la campaña</label>
        <input type="text" class="text-input" id="crFormObjective" value="${escapeHtml(s.objective)}" placeholder="Ej. Generar ventas atribuidas en Amazon durante el regreso a clases">
      </div>

      <div class="af-builder-step-label">Presupuesto</div>
      <div class="brief-form-grid" style="grid-template-columns: repeat(2, 1fr);">
        <div class="field-group">
          <label class="field-label">Confirmado ($)</label>
          <input type="text" class="text-input" id="crFormBudgetConfirmed" value="${escapeHtml(s.budgetConfirmed)}" placeholder="Ej. 1,200">
        </div>
        <div class="field-group">
          <label class="field-label">Gastado ($)</label>
          <input type="text" class="text-input" id="crFormBudgetSpent" value="${escapeHtml(s.budgetSpent)}" placeholder="Ej. 980">
        </div>
      </div>
      <div class="cr-budget-pct" id="crBudgetPctLine"></div>

      <div class="af-builder-step-label">Resultados por canal — Paid Media</div>
      <p class="af-builder-hint">Meta, TikTok, Pinterest, Google Ads, LinkedIn… — métricas de entrega de pauta (alcance, impresiones, clics, spend). Un canal por plataforma, con los KPIs headline que apliquen.</p>
      <div class="cr-channel-list">${s.channels.filter((c) => crChannelKind(c) === 'paid').map(crChannelHtml).join('') || '<p class="cr-print-empty">Sin canales de paid media todavía.</p>'}</div>
      <button class="btn btn-ghost btn-small" data-cr-add-channel-kind="paid">+ Agregar Canal — Paid Media</button>

      <div class="af-builder-step-label">Resultados de Comercio / Atribución</div>
      <p class="af-builder-hint">Amazon Attribution, Walmart Connect… — el funnel de venta real (clicks, vistas de producto, add-to-cart, compras, ventas atribuidas). Esta es la parte que suele importar más: ventas.</p>
      <div class="cr-channel-list cr-channel-list-commerce">${s.channels.filter((c) => crChannelKind(c) === 'commerce').map(crChannelHtml).join('') || '<p class="cr-print-empty">Sin canales de comercio/atribución todavía.</p>'}</div>
      <button class="btn btn-ghost btn-small" data-cr-add-channel-kind="commerce">+ Agregar Canal — Comercio / Atribución</button>

      <div class="af-builder-step-label">Datos demográficos — edad y sexo</div>
      <p class="af-builder-hint">De la pestaña "Datos demográficos" de Meta Ads Manager. Cargá el desglose por sexo tanto para Resultados (a quién le convirtió la pauta) como para Alcance (a quién le llegó) — suelen contar historias distintas.</p>
      <div class="brief-form-grid" style="grid-template-columns: repeat(2, 1fr); gap: 16px;">
        <div>
          <div class="af-builder-hint" style="margin-top:0; font-weight:700; color: var(--navy);">Por Resultados</div>
          <div class="cr-kpi-list">${s.demographics.resultsKpis.map((k) => crDemoKpiRowHtml('resultsKpis', k)).join('') || '<p class="cr-print-empty">Sin datos todavía.</p>'}</div>
          <button class="btn btn-ghost btn-small" data-cr-demo-add="resultsKpis">+ Agregar</button>
        </div>
        <div>
          <div class="af-builder-hint" style="margin-top:0; font-weight:700; color: var(--navy);">Por Alcance</div>
          <div class="cr-kpi-list">${s.demographics.reachKpis.map((k) => crDemoKpiRowHtml('reachKpis', k)).join('') || '<p class="cr-print-empty">Sin datos todavía.</p>'}</div>
          <button class="btn btn-ghost btn-small" data-cr-demo-add="reachKpis">+ Agregar</button>
        </div>
      </div>
      <div class="field-group" style="margin-top:10px;">
        <label class="field-label">Patrón por edad (opcional)</label>
        <textarea class="text-area" id="crFormDemoNotes" rows="2" placeholder="Ej. En alcance, mujeres 65+ es el grupo más grande por lejos; en resultados la conversión crece con la edad en ambos sexos.">${escapeHtml(s.demographics.notes)}</textarea>
      </div>

      <div class="af-builder-step-label">Curva de crecimiento</div>
      <p class="af-builder-hint">Se arma sola con lo ya cargado en General (tab de al lado) para filas con este mismo nombre de campaña — mientras más cortes de fecha cargues ahí, mejor se ve la tendencia.</p>
      <div class="chart-controls">
        <div class="chart-control">
          <label>Metric</label>
          <select id="crChartMetricSelect">${metricOptions.map((c) => `<option value="${c.key}" ${c.key === s.chartMetric ? 'selected' : ''}>${escapeHtml(c.label)}</option>`).join('')}</select>
        </div>
        <div class="chart-control">
          <label>Platform</label>
          <select id="crChartPlatformSelect">${['All Platforms', ...campaignPlatforms].map((p) => `<option value="${escapeHtml(p)}" ${p === s.chartPlatform ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('')}</select>
        </div>
      </div>
      <div class="chart-canvas-wrap chart-canvas-wrap-small">
        <canvas id="crChartCanvas"></canvas>
      </div>
      <div class="chart-empty" id="crChartEmpty"></div>
      <div class="chart-caption" id="crChartCaption" hidden></div>

      <div class="af-builder-step-label">Contenido publicado — screenshots</div>
      <p class="af-builder-hint">Aquí subes las capturas de los anuncios, posts o videos que corrieron (JPG/PNG) — clic en el cuadro punteado de abajo para elegir el archivo. El link es opcional.</p>
      <div class="cr-content-grid">${s.content.map(crContentItemHtml).join('')}</div>
      <button class="btn btn-ghost btn-small" id="crAddContentBtn">+ Agregar screenshot / pieza</button>

      <div class="af-builder-step-label">Resultados y desempeño</div>
      <p class="af-builder-hint">Sin meta contra qué comparar todavía — por ahora es mostrar lo que dio la campaña; el próximo año ya se compara campaña a campaña.</p>
      <textarea class="text-area" id="crFormResults" rows="3" placeholder="Qué resultó la campaña, en libre…">${escapeHtml(s.results)}</textarea>

      <div class="af-builder-step-label">Observaciones</div>
      <p class="af-builder-hint">Notas del día a día — qué llamó la atención, qué se ajustó a mitad de campaña, contexto que no se ve solo en los números.</p>
      <textarea class="text-area" id="crFormObservations" rows="3" placeholder="Ej. Instagram concentró el spend, Facebook casi no tuvo delivery…">${escapeHtml(s.observations)}</textarea>

      <div class="af-builder-step-label">Metodología y limitaciones de medición</div>
      <p class="af-builder-hint">Qué mide cada fuente y qué se le escapa (ventanas de atribución, compras diferidas, cross-device) — para que quien lea el reporte no tome los números como el 100% del impacto real.</p>
      <textarea class="text-area" id="crFormMethodology" rows="3" placeholder="Ej. Amazon Attribution solo cuenta compras dentro de su ventana de atribución vía el último clic…">${escapeHtml(s.methodology)}</textarea>

      <div class="af-builder-step-label">Aprendizajes</div>
      <textarea class="text-area" id="crFormLearnings" rows="3" placeholder="Qué se ajusta para la siguiente campaña (opcional)…">${escapeHtml(s.learnings)}</textarea>

      <div class="af-builder-step-label">Próximos pasos</div>
      <textarea class="text-area" id="crFormNextSteps" rows="3" placeholder="Qué se hace con esto — ej. aplicar el mismo split de canal en Heritage Month…">${escapeHtml(s.nextSteps)}</textarea>

      <div class="af-builder-actions">
        <div>${s.editingId ? '<button class="btn btn-ghost" id="crBuilderDeleteBtn">Eliminar reporte</button>' : ''}</div>
        <div class="af-builder-actions-right">
          <button class="btn btn-ghost" id="crBuilderCancelBtn">Cancelar</button>
          <button class="btn btn-primary" id="crBuilderSaveBtn">Guardar Reporte</button>
        </div>
      </div>
    `;

    // ---- wiring: campos simples (sin re-render completo) ----
    const updateBudgetPctLine = () => {
      const line = document.getElementById('crBudgetPctLine');
      if (!line) return;
      const pct = crBudgetPct(s);
      if (pct === null) { line.textContent = ''; return; }
      line.textContent = `${pct}% del presupuesto confirmado gastado hasta ahora.`;
      line.classList.toggle('cr-budget-pct-over', pct > 100);
    };
    updateBudgetPctLine();

    document.getElementById('crFormName').addEventListener('input', (e) => { s.name = e.target.value; });
    document.getElementById('crFormName').addEventListener('change', renderCRBuilderChart);
    document.getElementById('crFormMarkets').addEventListener('input', (e) => { s.markets = e.target.value; });
    document.getElementById('crFormPeriodStart').addEventListener('input', (e) => { s.periodStart = e.target.value; });
    document.getElementById('crFormPeriodEnd').addEventListener('input', (e) => { s.periodEnd = e.target.value; });
    document.getElementById('crFormFocusProducts').addEventListener('input', (e) => { s.focusProducts = e.target.value; });
    document.getElementById('crFormObjective').addEventListener('input', (e) => { s.objective = e.target.value; });
    document.getElementById('crFormBudgetConfirmed').addEventListener('input', (e) => { s.budgetConfirmed = e.target.value; updateBudgetPctLine(); });
    document.getElementById('crFormBudgetSpent').addEventListener('input', (e) => { s.budgetSpent = e.target.value; updateBudgetPctLine(); });
    document.getElementById('crFormResults').addEventListener('input', (e) => { s.results = e.target.value; });
    document.getElementById('crFormObservations').addEventListener('input', (e) => { s.observations = e.target.value; });
    document.getElementById('crFormMethodology').addEventListener('input', (e) => { s.methodology = e.target.value; });
    document.getElementById('crFormLearnings').addEventListener('input', (e) => { s.learnings = e.target.value; });
    document.getElementById('crFormNextSteps').addEventListener('input', (e) => { s.nextSteps = e.target.value; });

    // ---- canales ----
    body.querySelectorAll('[data-cr-channel-name]').forEach((el) => {
      el.addEventListener('input', (e) => {
        const ch = s.channels.find((c) => c.id === el.dataset.crChannelName);
        if (ch) ch.name = e.target.value;
      });
    });
    body.querySelectorAll('[data-cr-kpi-field]').forEach((el) => {
      el.addEventListener('input', (e) => {
        const ch = s.channels.find((c) => c.id === el.dataset.crChannel);
        const kpi = ch && ch.kpis.find((k) => k.id === el.dataset.crKpi);
        if (kpi) kpi[el.dataset.crKpiField] = e.target.value;
      });
    });
    body.querySelectorAll('[data-cr-add-kpi]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ch = s.channels.find((c) => c.id === btn.dataset.crAddKpi);
        if (!ch) return;
        ch.kpis.push({ id: uid('kpi'), label: '', value: '' });
        renderCRBuilderBody();
        renderCRBuilderChart();
      });
    });
    body.querySelectorAll('[data-cr-delete-kpi]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ch = s.channels.find((c) => c.id === btn.dataset.crChannel);
        if (!ch) return;
        ch.kpis = ch.kpis.filter((k) => k.id !== btn.dataset.crDeleteKpi);
        renderCRBuilderBody();
        renderCRBuilderChart();
      });
    });
    body.querySelectorAll('[data-cr-delete-channel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('¿Eliminar este canal y sus KPIs?')) return;
        s.channels = s.channels.filter((c) => c.id !== btn.dataset.crDeleteChannel);
        renderCRBuilderBody();
        renderCRBuilderChart();
      });
    });
    body.querySelectorAll('[data-cr-add-channel-kind]').forEach((btn) => {
      btn.addEventListener('click', () => {
        s.channels.push({ id: uid('ch'), name: '', kind: btn.dataset.crAddChannelKind, kpis: [{ id: uid('kpi'), label: '', value: '' }] });
        renderCRBuilderBody();
        renderCRBuilderChart();
      });
    });

    // ---- demografía (edad y sexo) ----
    body.querySelectorAll('[data-cr-demo-field]').forEach((el) => {
      el.addEventListener('input', (e) => {
        const list = s.demographics[el.dataset.crDemoList];
        const kpi = list && list.find((k) => k.id === el.dataset.crDemoKpi);
        if (kpi) kpi[el.dataset.crDemoField] = e.target.value;
      });
    });
    body.querySelectorAll('[data-cr-demo-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        s.demographics[btn.dataset.crDemoAdd].push({ id: uid('kpi'), label: '', value: '' });
        renderCRBuilderBody();
      });
    });
    body.querySelectorAll('[data-cr-demo-delete-kpi]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const list = s.demographics[btn.dataset.crDemoList];
        if (!list) return;
        s.demographics[btn.dataset.crDemoList] = list.filter((k) => k.id !== btn.dataset.crDemoDeleteKpi);
        renderCRBuilderBody();
      });
    });
    const demoNotesEl = document.getElementById('crFormDemoNotes');
    if (demoNotesEl) demoNotesEl.addEventListener('input', (e) => { s.demographics.notes = e.target.value; });

    // ---- contenido publicado ----
    body.querySelectorAll('[data-cr-content-field]').forEach((el) => {
      el.addEventListener('input', (e) => {
        const it = s.content.find((c) => c.id === el.dataset.crContent);
        if (it) it[el.dataset.crContentField] = e.target.value;
      });
    });
    body.querySelectorAll('[data-cr-delete-content]').forEach((btn) => {
      btn.addEventListener('click', () => {
        s.content = s.content.filter((c) => c.id !== btn.dataset.crDeleteContent);
        renderCRBuilderBody();
        renderCRBuilderChart();
      });
    });
    body.querySelectorAll('[data-cr-content-upload]').forEach((input) => {
      input.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
          const dataUrl = await crResizeImageFile(file);
          const it = s.content.find((c) => c.id === input.dataset.crContentUpload);
          if (it) it.image = dataUrl;
          renderCRBuilderBody();
          renderCRBuilderChart();
        } catch (err) {
          alert('No se pudo cargar esa imagen. Prueba con otro archivo.');
        }
      });
    });
    document.getElementById('crAddContentBtn').addEventListener('click', () => {
      s.content.push({ id: uid('cc'), image: '', link: '', caption: '' });
      renderCRBuilderBody();
      renderCRBuilderChart();
    });

    // ---- curva de crecimiento ----
    document.getElementById('crChartMetricSelect').addEventListener('change', (e) => { s.chartMetric = e.target.value; renderCRBuilderChart(); });
    document.getElementById('crChartPlatformSelect').addEventListener('change', (e) => { s.chartPlatform = e.target.value; renderCRBuilderChart(); });

    document.getElementById('crBuilderCancelBtn').addEventListener('click', closeCRBuilder);
    document.getElementById('crBuilderSaveBtn').addEventListener('click', saveCRFromBuilder);
    const delBtn = document.getElementById('crBuilderDeleteBtn');
    if (delBtn) delBtn.addEventListener('click', () => {
      if (!confirm('¿Eliminar este reporte de campaña?')) return;
      campaignReports = campaignReports.filter((r) => r.id !== s.editingId);
      persistCampaignReports();
      closeCRBuilder();
      renderCampaignReportBank();
    });

    renderCRBuilderChart();
  }

  function openCRBuilder(existing) {
    // Backfill sobre freshCRState() en vez de usar el existing tal cual —
    // así un reporte guardado antes de que existieran campos como
    // Objetivo/Observaciones/Próximos pasos (o el "kind" de canal) no
    // rompe el builder ni el guardado al reabrirlo.
    crBuilderState = existing ? Object.assign(freshCRState(), JSON.parse(JSON.stringify(existing))) : freshCRState();
    if (existing) {
      crBuilderState.editingId = existing.id;
      crBuilderState.channels = (existing.channels && existing.channels.length)
        ? existing.channels.map((ch) => ({ id: ch.id, name: ch.name || '', kind: crChannelKind(ch), kpis: (ch.kpis || []).map((k) => ({ id: k.id, label: k.label || '', value: k.value || '' })) }))
        : freshCRState().channels;
      const d = existing.demographics || {};
      crBuilderState.demographics = {
        resultsKpis: (d.resultsKpis || []).map((k) => ({ id: k.id || uid('kpi'), label: k.label || '', value: k.value || '' })),
        reachKpis: (d.reachKpis || []).map((k) => ({ id: k.id || uid('kpi'), label: k.label || '', value: k.value || '' })),
        notes: d.notes || '',
      };
    }
    renderCRBuilderBody();
    document.getElementById('crBuilderOverlay').classList.add('active');
  }

  function closeCRBuilder() {
    document.getElementById('crBuilderOverlay').classList.remove('active');
    if (crChart) { crChart.destroy(); crChart = null; }
    crBuilderState = null;
  }

  function saveCRFromBuilder() {
    const s = crBuilderState;
    if (!s.name.trim()) { alert('Ponle un nombre a la campaña antes de guardar.'); return; }
    const cleaned = {
      id: s.editingId || uid('creport'),
      name: s.name.trim(),
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
      markets: s.markets.trim(),
      focusProducts: s.focusProducts.trim(),
      objective: s.objective.trim(),
      budgetConfirmed: s.budgetConfirmed.trim(),
      budgetSpent: s.budgetSpent.trim(),
      channels: s.channels
        .map((ch) => ({ id: ch.id, name: ch.name.trim(), kind: crChannelKind(ch), kpis: ch.kpis.filter((k) => k.label.trim() || k.value.trim()) }))
        .filter((ch) => ch.name),
      demographics: {
        resultsKpis: s.demographics.resultsKpis.filter((k) => k.label.trim() || k.value.trim()),
        reachKpis: s.demographics.reachKpis.filter((k) => k.label.trim() || k.value.trim()),
        notes: s.demographics.notes.trim(),
      },
      content: s.content,
      results: s.results.trim(),
      observations: s.observations.trim(),
      methodology: s.methodology.trim(),
      learnings: s.learnings.trim(),
      nextSteps: s.nextSteps.trim(),
      createdDate: s.editingId
        ? (campaignReports.find((r) => r.id === s.editingId) || {}).createdDate
        : new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    if (s.editingId) {
      const idx = campaignReports.findIndex((r) => r.id === s.editingId);
      if (idx !== -1) campaignReports[idx] = cleaned; else campaignReports.unshift(cleaned);
    } else {
      campaignReports.unshift(cleaned);
    }
    persistCampaignReports();
    closeCRBuilder();
    renderCampaignReportBank();
  }

  function renderCampaignReportBank() {
    const body = document.getElementById('campaignReportBody');
    const empty = document.getElementById('campaignReportEmpty');
    if (!body) return;
    const q = campaignReportSearchState.toLowerCase();
    const rows = !q ? campaignReports : campaignReports.filter((r) =>
      (r.name || '').toLowerCase().includes(q) || (r.markets || '').toLowerCase().includes(q));

    if (rows.length === 0) { body.innerHTML = ''; if (empty) empty.hidden = false; return; }
    if (empty) empty.hidden = true;

    body.innerHTML = rows.map((r) => `
      <tr>
        <td>${escapeHtml(r.name)}</td>
        <td>${crPeriodLabel(r)}</td>
        <td>${escapeHtml(r.markets || '—')}</td>
        <td>${escapeHtml((r.channels || []).map((c) => c.name).filter(Boolean).join(', ') || '—')}</td>
        <td class="af-campaign-actions-cell">
          <button class="icon-btn" data-cr-view="${r.id}" aria-label="Ver / Editar" title="Ver / Editar"><svg viewBox="0 0 24 24"><path d="M4 12s3.5-6 8-6 8 6 8 6-3.5 6-8 6-8-6-8-6z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button>
          <button class="icon-btn" data-cr-export="${r.id}" aria-label="Exportar PDF" title="Exportar PDF"><svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9 13h6M9 16h6M9 10h2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </td>
      </tr>
    `).join('');

    body.querySelectorAll('[data-cr-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const r = campaignReports.find((x) => x.id === btn.dataset.crView);
        if (r) openCRBuilder(r);
      });
    });
    body.querySelectorAll('[data-cr-export]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const r = campaignReports.find((x) => x.id === btn.dataset.crExport);
        if (r) exportCampaignReportPDF(r);
      });
    });
  }

  function crKpiListHtml(kpis) {
    if (!kpis || !kpis.length) return `<p class="cr-print-empty">Sin KPIs cargados.</p>`;
    return `<ul class="cr-print-kpi-list">${kpis.filter((k) => k.label.trim() || k.value.trim()).map((k) => `<li><b>${escapeHtml(k.label || '—')}:</b> ${escapeHtml(k.value || '—')}</li>`).join('')}</ul>`;
  }

  // Los KPIs de comercio/atribución (compras, ventas, add-to-cart…) van como
  // tarjetas grandes tipo "stat", no como lista — son el resultado que más
  // le importa al negocio y se pierden si se ven igual que un KPI de pauta.
  function crCommerceStatsHtml(kpis) {
    const clean = (kpis || []).filter((k) => k.label.trim() || k.value.trim());
    if (!clean.length) return `<p class="cr-print-empty">Sin KPIs cargados.</p>`;
    return `<div class="cr-print-stat-row cr-print-stat-row-commerce">${clean.map((k) => `
      <div class="cr-print-stat cr-print-stat-commerce"><span>${escapeHtml(k.label || '—')}</span><b>${escapeHtml(k.value || '—')}</b></div>`).join('')}</div>`;
  }

  function exportCampaignReportPDF(report) {
    const area = document.getElementById('crPrintArea');
    if (!area) return;

    // Snapshot de la curva de crecimiento como imagen — se arma con la
    // primera métrica numérica disponible, filtrada por el nombre exacto
    // de esta campaña, para que el PDF no dependa de un canvas en pantalla.
    let chartImg = '';
    let chartNote = '';
    // Usa la misma metrica/plataforma que el usuario dejo elegida en el
    // builder (report.chartMetric / report.chartPlatform) -- antes esto se
    // ignoraba y el PDF siempre graficaba la primera columna numerica sin
    // filtro de plataforma, que casi nunca era la curva que se veia en el
    // preview del builder.
    const metricOptions = crMetricOptions();
    const metricCol = (report.chartMetric && metricOptions.find((c) => c.key === report.chartMetric)) || metricOptions[0];
    const chartPlatform = report.chartPlatform || 'All Platforms';
    if (typeof window.Chart === 'undefined') {
      chartNote = 'No se pudo generar la curva — Chart.js no cargó (revisa la conexión a internet) al momento de exportar.';
    } else if (metricCol) {
      const series = buildGrowthSeries(metricCol.key, { platform: chartPlatform, campaign: report.name });
      if (series && series.labels.length) {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 900; offCanvas.height = 320;
        offCanvas.style.position = 'fixed'; offCanvas.style.left = '-9999px';
        document.body.appendChild(offCanvas);
        const offChart = drawLineChart(offCanvas, series, `${series.col.label} — ${chartPlatform}`, null, { animation: false });
        chartImg = offChart.toBase64Image();
        offChart.destroy();
        document.body.removeChild(offCanvas);
        if (series.labels.length === 1) {
          chartNote = 'Un solo corte cargado en General hasta ahora — la curva se arma con más fechas de esta misma campaña.';
        }
      } else {
        chartNote = `Todavía no hay filas en General (tab General) con el nombre de campaña "${report.name}" — cárgalas ahí para que la curva se arme sola.`;
      }
    }

    const paidChannels = (report.channels || []).filter((c) => crChannelKind(c) === 'paid');
    const commerceChannels = (report.channels || []).filter((c) => crChannelKind(c) === 'commerce');

    // Resumen agregado de "Visitas a la página de destino" en Meta — se suma
    // desde los KPIs de canal ya cargados (Facebook + Instagram) en vez de
    // pedir el dato de nuevo, para que nunca quede desincronizado del detalle
    // por canal de más abajo.
    let metaLandingViews = 0;
    paidChannels.forEach((ch) => {
      (ch.kpis || []).forEach((k) => {
        if (/visita.*landing|landing.*visita/i.test(k.label || '')) {
          const n = parseFloat(String(k.value || '').replace(/[^0-9.]/g, ''));
          if (!isNaN(n)) metaLandingViews += n;
        }
      });
    });
    const metaSpend = parseFloat(report.budgetSpent) || 0;
    const metaCostPerVisit = metaLandingViews > 0 ? metaSpend / metaLandingViews : null;
    const metaSummaryHtml = metaLandingViews > 0 ? `
      <div class="cr-print-section-label">Resumen del rendimiento — Meta Ads (Facebook + Instagram)</div>
      <div class="cr-print-stat-row">
        <div class="cr-print-stat"><span>Visitas a la página de destino</span><b>${metaLandingViews.toLocaleString('es-ES')}</b></div>
        <div class="cr-print-stat"><span>Por visita a la página de destino</span><b>${metaCostPerVisit !== null ? '$' + metaCostPerVisit.toFixed(2) : '—'}</b></div>
        <div class="cr-print-stat"><span>Importe gastado</span><b>$${metaSpend.toFixed(2)}</b></div>
      </div>` : '';

    const paidChannelsHtml = paidChannels.length
      ? paidChannels.map((ch) => `
          <div class="cr-print-channel">
            <div class="cr-print-channel-name">${escapeHtml(ch.name)}</div>
            ${crKpiListHtml(ch.kpis)}
          </div>`).join('')
      : `<p class="cr-print-empty">Sin canales de paid media cargados.</p>`;

    const commerceChannelsHtml = commerceChannels.length
      ? commerceChannels.map((ch) => `
          <div class="cr-print-channel cr-print-channel-commerce">
            <div class="cr-print-channel-name">${escapeHtml(ch.name)}</div>
            ${crCommerceStatsHtml(ch.kpis)}
          </div>`).join('')
      : `<p class="cr-print-empty">Sin canales de comercio/atribución cargados.</p>`;

    const contentHtml = (report.content || []).filter((c) => c.image || c.link || c.caption).length
      ? `<div class="cr-print-content-grid">${report.content.map((c) => {
          if (!c.image && !c.link && !c.caption) return '';
          return `
            <div class="cr-print-content-item">
              ${c.image ? `<img src="${c.image}" alt="">` : `<div class="cr-print-content-placeholder">Sin screenshot</div>`}
              ${c.caption ? `<div class="cr-print-content-caption">${escapeHtml(c.caption)}</div>` : ''}
              ${c.link ? `<div class="cr-print-content-link">${escapeHtml(c.link)}</div>` : ''}
            </div>`;
        }).join('')}</div>`
      : `<p class="cr-print-empty">Sin contenido cargado todavía — se pueden agregar screenshots y links desde el botón "Editar" de este reporte.</p>`;

    const demo = report.demographics || { resultsKpis: [], reachKpis: [], notes: '' };
    const hasDemo = (demo.resultsKpis && demo.resultsKpis.length) || (demo.reachKpis && demo.reachKpis.length) || demo.notes;
    const demoHtml = hasDemo
      ? `<div class="cr-print-demo-grid">
          <div class="cr-print-channel">
            <div class="cr-print-channel-name">Por Resultados</div>
            ${crKpiListHtml(demo.resultsKpis)}
          </div>
          <div class="cr-print-channel">
            <div class="cr-print-channel-name">Por Alcance</div>
            ${crKpiListHtml(demo.reachKpis)}
          </div>
        </div>
        ${demo.notes ? `<p class="cr-print-text cr-print-demo-notes">${escapeHtml(demo.notes)}</p>` : ''}`
      : `<p class="cr-print-empty">Sin datos demográficos cargados.</p>`;

    const pct = crBudgetPct(report);

    area.innerHTML = `
      <div class="cr-print-header">
        <div class="cr-print-kicker">REPORTE DE CAMPAÑA · DIGITAL MARKETING</div>
        <div class="cr-print-title">${escapeHtml(report.name)}</div>
        <div class="cr-print-sub">${crPeriodLabel(report)} · ${escapeHtml(report.markets || 'Mercado sin especificar')}${report.focusProducts ? ' · ' + escapeHtml(report.focusProducts) : ''}</div>
      </div>

      ${report.objective ? `
      <div class="cr-print-objective"><b>Objetivo:</b> ${escapeHtml(report.objective)}</div>` : ''}

      <div class="cr-print-stat-row">
        <div class="cr-print-stat"><span>Presupuesto confirmado</span><b>${escapeHtml(report.budgetConfirmed ? '$' + report.budgetConfirmed : '—')}</b></div>
        <div class="cr-print-stat"><span>Presupuesto gastado</span><b>${escapeHtml(report.budgetSpent ? '$' + report.budgetSpent : '—')}</b></div>
        <div class="cr-print-stat"><span>% gastado</span><b>${pct === null ? '—' : pct + '%'}</b></div>
        <div class="cr-print-stat"><span>Canales</span><b>${(report.channels || []).length}</b></div>
      </div>

      ${metaSummaryHtml}

      <div class="cr-print-section-label">Resultados por canal — Paid Media</div>
      <div class="cr-print-channels">${paidChannelsHtml}</div>

      <div class="cr-print-section-label cr-print-section-label-commerce">Resultados de Comercio / Atribución</div>
      <div class="cr-print-channels">${commerceChannelsHtml}</div>

      <div class="cr-print-section-label">Datos demográficos — edad y sexo</div>
      ${demoHtml}

      ${report.methodology ? `
      <div class="cr-print-section-label">Metodología y limitaciones de medición</div>
      <p class="cr-print-text">${escapeHtml(report.methodology)}</p>` : ''}

      <div class="cr-print-section-label">Curva de crecimiento</div>
      <div class="cr-print-chart-wrap">
        ${chartImg ? `<img class="cr-print-chart" src="${chartImg}" alt="Curva de crecimiento">` : ''}
        ${chartNote ? `<p class="cr-print-chart-note">${escapeHtml(chartNote)}</p>` : ''}
      </div>

      <div class="cr-print-section-label">Contenido publicado</div>
      ${contentHtml}

      <div class="cr-print-section-label">Resultados y desempeño</div>
      <p class="cr-print-text">${escapeHtml(report.results || 'Sin registrar.')}</p>

      <div class="cr-print-section-label">Observaciones</div>
      <p class="cr-print-text">${escapeHtml(report.observations || 'Sin registrar.')}</p>

      <div class="cr-print-section-label">Aprendizajes</div>
      <p class="cr-print-text">${escapeHtml(report.learnings || 'Sin registrar.')}</p>

      <div class="cr-print-section-label">Próximos pasos</div>
      <p class="cr-print-text">${escapeHtml(report.nextSteps || 'Sin registrar.')}</p>

      <div class="cr-print-footer">Distrivalto · Digital Marketing · Reporte generado ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
    `;
    printAreaWhenReady(area);
  }

  document.getElementById('newCampaignReportBtn').addEventListener('click', () => openCRBuilder(null));
  document.getElementById('crBuilderCloseBtn').addEventListener('click', closeCRBuilder);
  document.getElementById('crBuilderOverlay').addEventListener('click', (e) => { if (e.target.id === 'crBuilderOverlay') closeCRBuilder(); });
  document.getElementById('campaignReportSearch').addEventListener('input', (e) => { campaignReportSearchState = e.target.value; renderCampaignReportBank(); });

  /* ------------------------------------------------------------------------
     INIT
     ------------------------------------------------------------------------ */

  function renderAll() {
    document.getElementById('topbarDate').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    renderDashboard();
    renderInventoryFilters();
    renderInventoryHead();
    renderInventoryTable();
    renderAccessMatrix();
    renderPlatformAudit('');
    renderKanban();
    renderNotes();
    renderBriefs();
    renderContentInputs();
    renderCalendar();
    renderTimeline();
    renderTeam();
    renderUserChip();
    renderDocs();
    renderProjectGrid();
    renderTasks();
    renderKpis();
    renderObjective();
    renderCampaignMetricsGuide();
    renderCampaignFilters();
    renderCampaignHead();
    renderCampaignTable();
    renderChartControls();
    renderGrowthChart();
    renderActivationFramework();
    renderCampaignReportBank();
  }

  // Vuelve a cargar los 19 tipos de dato desde window.__HUB_REMOTE_DATA
  // (ya refrescado por auth-gate.js) y re-renderiza todo. Esto es lo que
  // hace que un cambio de otra persona del equipo aparezca en pantalla
  // sin que cada quien tenga que recargar la página manualmente.
  function reloadAllFromRemote() {
    platforms = loadStore(STORE_KEYS.platforms, DEFAULT_PLATFORMS);
    accessState = loadStore(STORE_KEYS.access, DEFAULT_ACCESS);
    matrixRoles = loadStore(STORE_KEYS.roles, DEFAULT_ROLES);
    assetColumns = loadStore(STORE_KEYS.assetColumns, DEFAULT_ASSET_COLUMNS);
    assets = loadStore(STORE_KEYS.assets, DEFAULT_ASSETS);
    quickWins = loadStore(STORE_KEYS.quickwins, DEFAULT_QUICK_WINS);
    notes = loadStore(STORE_KEYS.notes, []);
    team = loadStore(STORE_KEYS.team, DEFAULT_TEAM);
    userProfile = loadStore(STORE_KEYS.profile, DEFAULT_USER_PROFILE);
    tasks = loadStore(STORE_KEYS.tasks, DEFAULT_TASKS);
    kpis = loadStore(STORE_KEYS.kpis, DEFAULT_KPIS);
    keyResults = loadStore(STORE_KEYS.keyResults, DEFAULT_KEY_RESULTS);
    campaignPlatforms = loadStore(STORE_KEYS.campaignPlatforms, DEFAULT_CAMPAIGN_PLATFORMS);
    campaignColumns = loadStore(STORE_KEYS.campaignColumns, DEFAULT_CAMPAIGN_COLUMNS);
    campaignRows = loadStore(STORE_KEYS.campaignRows, []);
    campaignReports = loadStore(STORE_KEYS.campaignReports, []);
    projects = loadStore(STORE_KEYS.projects, DEFAULT_PROJECTS);
    briefs = loadStore(STORE_KEYS.briefs, []);
    contentInputs = loadStore(STORE_KEYS.contentInputs, []);
    calendarPosts = loadStore(STORE_KEYS.calendarPosts, DEFAULT_CALENDAR_POSTS);
    afCatalogColumns = loadStore(STORE_KEYS.afCatalogColumns, DEFAULT_AF_CATALOG_COLUMNS);
    afCatalog = loadStore(STORE_KEYS.afCatalog, DEFAULT_AF_CATALOG);
    afMediaKitColumns = loadStore(STORE_KEYS.afMediaKitColumns, DEFAULT_AF_MEDIAKIT_COLUMNS);
    afMediaKit = loadStore(STORE_KEYS.afMediaKit, DEFAULT_AF_MEDIAKIT);
    afTradeColumns = loadStore(STORE_KEYS.afTradeColumns, DEFAULT_AF_TRADE_COLUMNS);
    afTrade = loadStore(STORE_KEYS.afTrade, DEFAULT_AF_TRADE);
    afBrandColumns = loadStore(STORE_KEYS.afBrandColumns, DEFAULT_AF_BRAND_COLUMNS);
    afBrand = loadStore(STORE_KEYS.afBrand, DEFAULT_AF_BRAND);
    afPacks = loadStore(STORE_KEYS.afPacks, DEFAULT_AF_PACKS);
    afCampaigns = loadStore(STORE_KEYS.afCampaigns, DEFAULT_AF_CAMPAIGNS);
    renderAll();
  }
  window.__hubReloadAll = reloadAllFromRemote;

  inventoryBodyDelegation();
  campaignBodyDelegation();
  afCatalogController.bodyDelegation();
  afMediaKitController.bodyDelegation();
  afTradeController.bodyDelegation();
  afBrandController.bodyDelegation();
  renderAll();

  const initialView = (location.hash || '#dashboard').replace('#', '');
  goToView(VIEW_META[initialView] ? initialView : 'dashboard');

})();
