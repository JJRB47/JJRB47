// =======================================================================
// CONFIGURACIÓN DE PRODUCTOS - SOLO WINDOWS Y OFFICE
// =======================================================================

const BUSINESS_INFO = {
    whatsappNumber: '584122891366',
    paypalLink: 'https://www.paypal.me/rangeljo',
    businessName: 'Jonathan Jose Rangel Betancourt (JJRB)',
    discountPercentage: 0.30,
    email: 'rangeljose4747@gmail.com',
    currency: 'USD'
};

// Sistema de logging para productos
const productLogger = {
    info: (msg) => console.info(`[PRODUCTS] ${new Date().toISOString()}: ${msg}`),
    error: (msg, error) => console.error(`[PRODUCTS] ${new Date().toISOString()}: ${msg}`, error)
};

// Productos - Solo Windows y Office
const products = [
    {
        id: 1,
        name: "Instalación de Windows",
        icon: "fab fa-windows",
        logoClass: "windows-card",
        category: "sistema-operativo",
        description: "Instalación profesional del sistema operativo Windows con licencia digital. Incluye activación permanente y soporte técnico.",
        features: ["Activación permanente", "Soporte técnico", "Actualizaciones", "Instalación remota"],
        versions: [
            {id: "win7", name: "Windows 7 Professional", price: 10.00, requirements: "2GB RAM, 20GB HD"},
            {id: "win8", name: "Windows 8/8.1 Pro", price: 10.00, requirements: "2GB RAM, 20GB HD"},
            {id: "win10", name: "Windows 10 Pro", price: 15.00, requirements: "4GB RAM, 32GB HD"},
            {id: "win11", name: "Windows 11 Pro", price: 15.00, requirements: "4GB RAM, 64GB HD, TPM 2.0"}
        ]
    },
    {
        id: 2,
        name: "Instalación de Microsoft Office", 
        icon: "fas fa-file-excel",
        logoClass: "office-card",
        category: "ofimatica",
        description: "Instalación completa de Microsoft Office con licencia digital. Todas las aplicaciones incluidas.",
        features: ["Word, Excel, PowerPoint", "Outlook incluido", "Activación permanente", "Soporte técnico"],
        versions: [
            {id: "office2010", name: "Office 2010", price: 10.00, requirements: "1GB RAM, 3GB HD"},
            {id: "office2013", name: "Office 2013", price: 10.00, requirements: "1GB RAM, 3GB HD"},
            {id: "office2016", name: "Office 2016", price: 10.00, requirements: "2GB RAM, 3GB HD"},
            {id: "office2019", name: "Office 2019", price: 15.00, requirements: "2GB RAM, 4GB HD"},
            {id: "office2021", name: "Office 2021", price: 15.00, requirements: "4GB RAM, 4GB HD"}
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

// Sanitizar inputs - Versión segura mejorada
function sanitizeInput(input) {
    if (input === null || input === undefined) return '';
    
    // Convertir a string
    const str = String(input);
    
    // Eliminar tags HTML y scripts
    const div = document.createElement('div');
    div.textContent = str;
    let sanitized = div.innerHTML;
    
    // Eliminar caracteres peligrosos
    sanitized = sanitized
        .replace(/[<>]/g, '') // Eliminar tags HTML
        .replace(/javascript:/gi, 'javascript-disabled:') // Neutralizar javascript:
        .replace(/on\w+=/gi, 'data-on=') // Neutralizar event handlers
        .replace(/data:/gi, 'data-disabled:') // Neutralizar data URIs
        .trim();
    
    // Limitar longitud
    return sanitized.substring(0, 500);
}

// Función de sanitización específica para nombres
function sanitizeName(name) {
    const sanitized = sanitizeInput(name);
    return sanitized
        .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.]/g, '') // Solo letras, espacios, guiones y puntos
        .replace(/\s+/g, ' ') // Eliminar múltiples espacios
        .trim();
}

// Función de sanitización específica para emails
function sanitizeEmail(email) {
    const sanitized = sanitizeInput(email).toLowerCase();
    return sanitized
        .replace(/[^a-zA-Z0-9@\.\-_]/g, '') // Solo caracteres válidos para email
        .trim();
}

// Función de sanitización específica para teléfonos
function sanitizePhone(phone) {
    const sanitized = sanitizeInput(phone);
    return sanitized
        .replace(/[^\d\s\-\+\(\)]/g, '') // Solo números y caracteres de teléfono
        .replace(/\s+/g, ' ') // Eliminar múltiples espacios
        .trim();
}

// Validar email
function validateEmail(email) {
    if (!email) return false;
    
    const emailStr = String(email).toLowerCase();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Validación básica de formato
    if (!re.test(emailStr)) return false;
    
    // Validar longitud
    if (emailStr.length > 254) return false;
    
    // Validar partes del email
    const parts = emailStr.split('@');
    if (parts[0].length > 64) return false;
    
    const domainParts = parts[1].split('.');
    if (domainParts.some(part => part.length > 63)) return false;
    
    return true;
}

// Validar teléfono
function validatePhone(phone) {
    if (!phone) return false;
    
    const phoneStr = String(phone);
    
    // Eliminar caracteres no numéricos para validación
    const numericOnly = phoneStr.replace(/[^\d]/g, '');
    
    // Validar longitud mínima (generalmente 10 dígitos para números internacionales)
    if (numericOnly.length < 10) return false;
    
    // Validar longitud máxima
    if (numericOnly.length > 15) return false;
    
    // Validar formato básico (contiene solo números y caracteres de teléfono válidos)
    const re = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return re.test(phoneStr);
}

// Generar número de pedido único
function generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    const date = new Date();
    
    // Formato: JJRB-YYYYMMDD-HHMMSS-RANDOM
    const dateStr = date.getFullYear().toString() +
                   (date.getMonth() + 1).toString().padStart(2, '0') +
                   date.getDate().toString().padStart(2, '0');
    
    const timeStr = date.getHours().toString().padStart(2, '0') +
                   date.getMinutes().toString().padStart(2, '0') +
                   date.getSeconds().toString().padStart(2, '0');
    
    return `JJRB-${dateStr}-${timeStr}-${random.toUpperCase()}`;
}

// Formatear precio
function formatPrice(price) {
    return `$${parseFloat(price).toFixed(2)}`;
}

// =======================================================================
// FUNCIONES DE PRODUCTOS
// =======================================================================

// Renderizar productos en el grid
function renderProducts() {
    try {
        const productsGrid = document.getElementById('products-grid');
        if (!productsGrid) {
            productLogger.error('Elemento con id "products-grid" no encontrado.');
            return;
        }
        
        // Validar que hay productos
        if (!products || products.length === 0) {
            productsGrid.innerHTML = `
                <div class="empty-products" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-gray);">
                    <i class="fas fa-box-open" style="font-size: 3em; margin-bottom: 15px;"></i>
                    <h3>No hay productos disponibles</h3>
                    <p>Por favor contacta al administrador.</p>
                </div>
            `;
            return;
        }
        
        // Renderizar cada producto
        productsGrid.innerHTML = products.map(product => {
            // Validar que el producto tiene versiones
            const hasVersions = product.versions && product.versions.length > 0;
            
            return `
                <div class="product-card ${product.logoClass}" data-product-id="${product.id}" role="article">
                    <i class="${product.icon} product-icon ${product.id === 1 ? 'windows-icon' : 'office-icon'}" 
                       aria-hidden="true"></i>
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    
                    ${hasVersions ? `
                        <select id="version-select-${product.id}" class="version-select" 
                                aria-label="Seleccionar versión de ${product.name}">
                            ${product.versions.map(version => `
                                <option value="${version.id}" data-price="${version.price}" 
                                        ${version.requirements ? `title="${version.requirements}"` : ''}>
                                    ${version.name} - ${formatPrice(version.price)}
                                </option>
                            `).join('')}
                        </select>
                        
                        <button class="add-to-cart-btn" data-product-id="${product.id}" 
                                aria-label="Agregar ${product.name} al carrito">
                            <i class="fas fa-cart-plus" aria-hidden="true"></i> Agregar al Carrito
                        </button>
                    ` : `
                        <div class="product-unavailable" style="color: var(--error-color); padding: 10px;">
                            <i class="fas fa-exclamation-circle"></i> No disponible temporalmente
                        </div>
                    `}
                    
                    ${product.features ? `
                        <div class="product-features" style="margin-top: 15px; font-size: 0.9em; color: var(--text-gray);">
                            <strong>Incluye:</strong> ${product.features.join(', ')}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        productLogger.info(`Productos renderizados: ${products.length}`);
        
    } catch (error) {
        productLogger.error('Error en renderProducts:', error);
        
        // Mostrar mensaje de error en la UI
        const productsGrid = document.getElementById('products-grid');
        if (productsGrid) {
            productsGrid.innerHTML = `
                <div class="product-error" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="color: var(--error-color); font-size: 3em;"></i>
                    <h3>Error cargando productos</h3>
                    <p>Por favor recarga la página o contacta al administrador.</p>
                    <button onclick="window.safeReload()" style="margin-top: 15px; padding: 10px 20px;">
                        Recargar página
                    </button>
                </div>
            `;
        }
    }
}

// Obtener producto por ID
function getProductById(productId) {
    if (!productId) {
        productLogger.warn('getProductById llamado sin ID');
        return null;
    }
    
    const id = parseInt(productId);
    const product = products.find(p => p.id === id);
    
    if (!product) {
        productLogger.warn(`Producto no encontrado con ID: ${productId}`);
    }
    
    return product || null;
}

// Obtener versión de producto
function getProductVersion(productId, versionId) {
    const product = getProductById(productId);
    if (!product) return null;
    
    const version = product.versions?.find(v => v.id === versionId);
    
    if (!version) {
        productLogger.warn(`Versión ${versionId} no encontrada para producto ${productId}`);
    }
    
    return version || null;
}

// Obtener todos los productos
function getAllProducts() {
    return [...products]; // Devolver copia para evitar mutaciones
}

// Obtener productos por categoría
function getProductsByCategory(category) {
    return products.filter(p => p.category === category);
}

// Actualizar precio de un producto (si fuera necesario)
function updateProductPrice(productId, versionId, newPrice) {
    const product = getProductById(productId);
    if (!product) return false;
    
    const versionIndex = product.versions?.findIndex(v => v.id === versionId);
    if (versionIndex === -1 || versionIndex === undefined) return false;
    
    product.versions[versionIndex].price = newPrice;
    productLogger.info(`Precio actualizado: ${product.name} - ${product.versions[versionIndex].name} = $${newPrice}`);
    
    // Re-renderizar productos si es necesario
    renderProducts();
    
    return true;
}

// Verificar disponibilidad de productos
function checkProductAvailability(productId, versionId) {
    const version = getProductVersion(productId, versionId);
    if (!version) return false;
    
    // Aquí podrías agregar lógica de inventario si fuera necesario
    return true;
}

// Exportar información de negocio
window.BUSINESS_INFO = BUSINESS_INFO;

// Asegurar que las funciones auxiliares estén disponibles globalmente
window.getPaymentMethodName = getPaymentMethodName;
window.getGreetingByTime = getGreetingByTime;
window.sanitizeInput = sanitizeInput;
window.sanitizeName = sanitizeName;
window.sanitizeEmail = sanitizeEmail;
window.sanitizePhone = sanitizePhone;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.generateOrderNumber = generateOrderNumber;
window.formatPrice = formatPrice;

// Exportar funciones para uso en otros archivos
window.renderProducts = renderProducts;
window.getProductById = getProductById;
window.getProductVersion = getProductVersion;
window.getAllProducts = getAllProducts;
window.getProductsByCategory = getProductsByCategory;
window.updateProductPrice = updateProductPrice;
window.checkProductAvailability = checkProductAvailability;

// Inicializar productos cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderProducts);
} else {
    // DOM ya está listo
    setTimeout(renderProducts, 100); // Pequeño delay para asegurar que todo esté listo
}