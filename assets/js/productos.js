// =======================================================================
// CONFIGURACIÓN DE PRODUCTOS - SOLO WINDOWS Y OFFICE
// =======================================================================

const BUSINESS_INFO = {
    whatsappNumber: '584122891366',
    paypalLink: 'https://www.paypal.me/rangeljo',
    businessName: 'Jonathan Jose Rangel Betancourt (JJRB)',
    discountPercentage: 0.30, // 30% de descuento para efectivo
    email: 'j.rangelb.1993@gmail.com'
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
// FUNCIONES DE PRODUCTOS
// =======================================================================

// Renderizar productos en el grid
function renderProducts() {
    const productsGrid = document.getElementById('products-grid');
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = `product-card ${product.logoClass}`;
        
        productCard.innerHTML = `
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
        `;
        productsGrid.appendChild(productCard);
    });
}

// Obtener producto por ID
function getProductById(productId) {
    return products.find(p => p.id === productId);
}

// Obtener versión de producto
function getProductVersion(productId, versionId) {
    const product = getProductById(productId);
    if (!product || !product.versions) return null;
    
    return product.versions.find(v => v.id === versionId);
}
