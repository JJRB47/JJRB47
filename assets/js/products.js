// =======================================================================
// products.js — JJRB Tienda v3.0
// Logos SVG reales: Windows flag + Office icon en tarjetas y carrito
// =======================================================================

const BUSINESS_INFO = Object.freeze({
    whatsappNumber:     '584122891366',
    paypalLink:         'https://www.paypal.me/rangeljo',
    businessName:       'Jonathan Jose Rangel Betancourt (JJRB)',
    discountPercentage: 0.30,
    email:              'rangeljose4747@gmail.com',
    currency:           'USD'
});

const productLogger = {
    info:  (msg)        => console.info (`[PRODUCTS] ${new Date().toISOString()}: ${msg}`),
    warn:  (msg)        => console.warn (`[PRODUCTS] ${new Date().toISOString()}: ${msg}`),
    error: (msg, error) => console.error(`[PRODUCTS] ${new Date().toISOString()}: ${msg}`, error)
};

// ─── SVG logos inline ────────────────────────────────────────────────────

// Logo Windows 11 (cuatro cuadros de colores)
const SVG_WINDOWS = `
<svg viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="4"  y="4"  width="38" height="38" rx="4" fill="#F25022"/>
  <rect x="46" y="4"  width="38" height="38" rx="4" fill="#7FBA00"/>
  <rect x="4"  y="46" width="38" height="38" rx="4" fill="#00A4EF"/>
  <rect x="46" y="46" width="38" height="38" rx="4" fill="#FFB900"/>
</svg>`;

// Logo Microsoft Office (letra W estilizada sobre fondo naranja)
const SVG_OFFICE = `
<svg viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect width="88" height="88" rx="10" fill="#D83B01"/>
  <text x="50%" y="58%" 
        dominant-baseline="middle" 
        text-anchor="middle"
        font-family="'Segoe UI', Arial, sans-serif"
        font-weight="700"
        font-size="52"
        fill="white">O</text>
  <circle cx="68" cy="24" r="10" fill="#FF8C00"/>
</svg>`;

// ─── Catálogo ────────────────────────────────────────────────────────────
const products = [
    {
        id: 1,
        name: 'Instalación de Windows',
        svgLogo: SVG_WINDOWS,
        logoClass: 'windows-logo-svg',
        logoBgClass: 'win-bg',
        cardClass: 'windows-card',
        // Icono FontAwesome para el carrito (uso interno)
        icon: 'fab fa-windows',
        iconClass: 'windows-icon',
        category: 'sistema-operativo',
        description: 'Instalación profesional con licencia digital. Activación permanente y soporte técnico incluido.',
        features: ['Activación permanente', 'Soporte técnico', 'Actualizaciones', 'Instalación remota'],
        versions: [
            { id: 'win7',  name: 'Windows 7 Professional', price: 10.00, requirements: '2GB RAM, 20GB HD' },
            { id: 'win8',  name: 'Windows 8/8.1 Pro',      price: 10.00, requirements: '2GB RAM, 20GB HD' },
            { id: 'win10', name: 'Windows 10 Pro',          price: 15.00, requirements: '4GB RAM, 32GB HD' },
            { id: 'win11', name: 'Windows 11 Pro',          price: 15.00, requirements: '4GB RAM, 64GB HD, TPM 2.0' }
        ]
    },
    {
        id: 2,
        name: 'Instalación de Microsoft Office',
        svgLogo: SVG_OFFICE,
        logoClass: 'office-logo-svg',
        logoBgClass: 'off-bg',
        cardClass: 'office-card',
        icon: 'fas fa-file-excel',
        iconClass: 'office-icon',
        category: 'ofimatica',
        description: 'Suite Office completa con licencia digital. Word, Excel, PowerPoint, Outlook y más.',
        features: ['Word, Excel, PowerPoint', 'Outlook incluido', 'Activación permanente', 'Soporte técnico'],
        versions: [
            { id: 'office2010', name: 'Office 2010', price: 10.00, requirements: '1GB RAM, 3GB HD' },
            { id: 'office2013', name: 'Office 2013', price: 10.00, requirements: '1GB RAM, 3GB HD' },
            { id: 'office2016', name: 'Office 2016', price: 10.00, requirements: '2GB RAM, 3GB HD' },
            { id: 'office2019', name: 'Office 2019', price: 15.00, requirements: '2GB RAM, 4GB HD' },
            { id: 'office2021', name: 'Office 2021', price: 15.00, requirements: '4GB RAM, 4GB HD' }
        ]
    }
];

// =======================================================================
// UTILIDADES
// =======================================================================

function getGreetingByTime() {
    const h = new Date().getHours();
    if (h >= 5  && h < 12) return 'Buenos días';
    if (h >= 12 && h < 18) return 'Buenas tardes';
    return 'Buenas noches';
}

function getPaymentMethodName(method) {
    const map = {
        transferencia: 'Transferencia Bancaria',
        paypal:        'PayPal',
        efectivo:      `Efectivo (${BUSINESS_INFO.discountPercentage * 100}% descuento)`
    };
    return map[method] || 'Transferencia Bancaria';
}

function sanitizeInput(input) {
    if (input === null || input === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(input);
    return div.innerHTML
        .replace(/javascript:/gi, 'javascript-disabled:')
        .replace(/on\w+=/gi, 'data-on=')
        .replace(/data:/gi, 'data-disabled:')
        .trim().substring(0, 500);
}
function sanitizeName(name) {
    return sanitizeInput(name).replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-.]/g, '').replace(/\s+/g, ' ').trim();
}
function sanitizeEmail(email) {
    return sanitizeInput(email).toLowerCase().replace(/[^a-zA-Z0-9@.\-_]/g, '').trim();
}
function sanitizePhone(phone) {
    return sanitizeInput(phone).replace(/[^\d\s\-+()]/g, '').replace(/\s+/g, ' ').trim();
}

function validateEmail(email) {
    if (!email) return false;
    const s = String(email).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) || s.length > 254) return false;
    const [local, domain] = s.split('@');
    return local.length <= 64 && !domain.split('.').some(p => p.length > 63);
}
function validatePhone(phone) {
    if (!phone) return false;
    const d = String(phone).replace(/\D/g, '');
    return d.length >= 10 && d.length <= 15 && /^[+]?[\d\s\-()]{10,}$/.test(String(phone));
}

function generateOrderNumber() {
    const now    = new Date();
    const date   = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    const time   = `${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `JJRB-${date}-${time}-${random}`;
}

function formatPrice(price) {
    return `$${parseFloat(price).toFixed(2)}`;
}

// =======================================================================
// RENDERIZADO DE PRODUCTOS (logo SVG real en las tarjetas)
// =======================================================================

function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) { productLogger.error('"products-grid" no encontrado.'); return; }

    if (!products.length) {
        grid.innerHTML = `
            <div class="empty-products" style="grid-column:1/-1">
                <div class="empty-cart-icon"><i class="fas fa-box-open"></i></div>
                <h3>No hay productos disponibles</h3>
                <p>Contacta al administrador.</p>
            </div>`;
        return;
    }

    try {
        grid.innerHTML = products.map(p => {
            const hasV = Array.isArray(p.versions) && p.versions.length > 0;
            return `
            <div class="product-card ${p.cardClass}" data-product-id="${p.id}" role="article" aria-label="${p.name}">
                <img class="${p.logoClass}"
                     src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(p.svgLogo)}"
                     alt="${p.name} logo"
                     width="56" height="56">
                <h3 class="product-title">${p.name}</h3>
                <p class="product-description">${p.description}</p>
                ${hasV ? `
                    <select id="version-select-${p.id}" class="version-select"
                            aria-label="Seleccionar versión de ${p.name}">
                        ${p.versions.map(v =>
                            `<option value="${v.id}" data-price="${v.price}" title="${v.requirements||''}">${v.name} — ${formatPrice(v.price)}</option>`
                        ).join('')}
                    </select>
                    <button class="add-to-cart-btn" data-product-id="${p.id}"
                            aria-label="Agregar ${p.name} al carrito">
                        <i class="fas fa-cart-plus" aria-hidden="true"></i> Agregar al Carrito
                    </button>
                ` : `
                    <div style="color:var(--error-color);padding:10px;font-size:.85em;">
                        <i class="fas fa-exclamation-circle"></i> No disponible temporalmente
                    </div>
                `}
                ${p.features ? `
                    <div class="product-features">
                        <strong>Incluye:</strong> ${p.features.join(' · ')}
                    </div>
                ` : ''}
            </div>`;
        }).join('');

        productLogger.info(`Productos renderizados: ${products.length}`);
    } catch (err) {
        productLogger.error('Error en renderProducts:', err);
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:40px;">
                <i class="fas fa-exclamation-triangle" style="color:var(--error-color);font-size:3em;"></i>
                <h3 style="margin:12px 0 8px;">Error cargando productos</h3>
                <p>Por favor recarga la página.</p>
                <button onclick="window.safeReload()" style="margin-top:12px;padding:10px 20px;cursor:pointer;">Recargar</button>
            </div>`;
    }
}

// ─── Accesores ────────────────────────────────────────────────────────────
function getProductById(productId) {
    if (!productId) { productLogger.warn('getProductById sin ID'); return null; }
    return products.find(p => p.id === parseInt(productId, 10)) || null;
}
function getProductVersion(productId, versionId) {
    return getProductById(productId)?.versions?.find(v => v.id === versionId) || null;
}
function getAllProducts()            { return [...products]; }
function getProductsByCategory(cat) { return products.filter(p => p.category === cat); }
function checkProductAvailability(pid, vid) { return !!getProductVersion(pid, vid); }

// ─── Exports ──────────────────────────────────────────────────────────────
Object.assign(window, {
    BUSINESS_INFO, SVG_WINDOWS, SVG_OFFICE,
    getGreetingByTime, getPaymentMethodName,
    sanitizeInput, sanitizeName, sanitizeEmail, sanitizePhone,
    validateEmail, validatePhone,
    generateOrderNumber, formatPrice,
    renderProducts, getProductById, getProductVersion,
    getAllProducts, getProductsByCategory, checkProductAvailability
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderProducts);
} else {
    renderProducts();
}
