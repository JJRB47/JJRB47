// =======================================================================
// CONFIGURACIÓN DE PRODUCTOS - SOLO WINDOWS Y OFFICE
// =======================================================================

const BUSINESS_INFO = {
    whatsappNumber: '584122891366',
    paypalLink: 'https://www.paypal.me/rangeljo',
    businessName: 'Jonathan Jose Rangel Betancourt (JJRB)',
    discountPercentage: 0.30,
    email: 'rangeljose4747@gmail.com'
};

// Productos - Solo Windows y Office
const products = [
    {
        id: 1,
        name: "Instalación de Windows",
        icon: "fab fa-windows",
        logoClass: "windows-card",
        description: "Instalación profesional del sistema operativo Windows con licencia digital.",
        versions: [
            {id: "win7", name: "Windows 7 Professional", price: 10.00},
            {id: "win8", name: "Windows 8/8.1 Pro", price: 10.00},
            {id: "win10", name: "Windows 10 Pro", price: 15.00},
            {id: "win11", name: "Windows 11 Pro", price: 15.00}
        ]
    },
    {
        id: 2,
        name: "Instalación de Microsoft Office", 
        icon: "fas fa-file-excel",
        logoClass: "office-card",
        description: "Instalación completa de Microsoft Office con licencia digital.",
        versions: [
            {id: "office2010", name: "Office 2010", price: 10.00},
            {id: "office2013", name: "Office 2013", price: 10.00},
            {id: "office2016", name: "Office 2016", price: 10.00},
            {id: "office2019", name: "Office 2019", price: 15.00},
            {id: "office2021", name: "Office 2021", price: 15.00}
        ]
    }
];

// =======================================================================
// FUNCIONES UTILITARIAS CENTRALIZADAS
// =======================================================================

// Obtener saludo según la hora del día
function getGreetingByTime() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Buenos días";
    if (hour >= 12 && hour < 18) return "Buenas tardes";
    return "Buenas noches";
}

// Obtener el nombre del método de pago
function getPaymentMethodName(method) {
    const methods = {
        'transferencia': 'Transferencia Bancaria',
        'paypal': 'PayPal',
        'efectivo': `Efectivo (${(BUSINESS_INFO.discountPercentage * 100)}% descuento)`
    };
    return methods[method] || 'Transferencia Bancaria';
}

// Sanitizar inputs
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input
        .replace(/[<>]/g, '')
        .trim()
        .substring(0, 100);
}

// Validar email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Validar teléfono
function validatePhone(phone) {
    const re = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return re.test(phone);
}

// Generar número de pedido único
function generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    return `JJRB-${timestamp}-${random}`.toUpperCase();
}

// =======================================================================
// FUNCIONES DE PRODUCTOS
// =======================================================================

// Renderizar productos en el grid
function renderProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) {
        console.error('Elemento con id "products-grid" no encontrado.');
        return;
    }
    
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card ${product.logoClass}">
            <i class="${product.icon} product-icon ${product.id === 1 ? 'windows-icon' : 'office-icon'}"></i>
            <h3 class="product-title">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <select id="version-select-${product.id}" class="version-select">
                ${product.versions.map(version => 
                    `<option value="${version.id}" data-price="${version.price}">
                        ${version.name} - $${version.price.toFixed(2)}
                    </option>`
                ).join('')}
            </select>
            <button class="add-to-cart-btn" data-product-id="${product.id}">
                <i class="fas fa-cart-plus"></i> Agregar al Carrito
            </button>
        </div>
    `).join('');
}

// Obtener producto por ID
function getProductById(productId) {
    return products.find(p => p.id === productId);
}

// Obtener versión de producto
function getProductVersion(productId, versionId) {
    const product = getProductById(productId);
    return product?.versions?.find(v => v.id === versionId) || null;
}
