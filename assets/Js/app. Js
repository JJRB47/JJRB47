// =======================================================================
// APLICACIÓN PRINCIPAL - INICIALIZACIÓN Y EVENTOS
// =======================================================================

// Inicializar aplicación
function initApp() {
    renderProducts();
    updateCart();
    setupEventListeners();
    handleImageErrors();
    handleCriticalErrors();
    setupOfflineDetection();
    improveAccessibility();
    
    // Animación de entrada escalonada
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach(element => {
        element.style.opacity = '1';
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Botón del carrito
    document.getElementById('cart-button').addEventListener('click', openCartModal);
    
    // Cerrar modal
    document.querySelector('.close-modal').addEventListener('click', closeCartModal);
    
    // Cerrar modal al hacer clic fuera
    document.getElementById('cart-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeCartModal();
        }
    });
    
    // Tabs del carrito
    document.querySelectorAll('.cart-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // Agregar productos al carrito
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const productId = parseInt(e.target.getAttribute('data-product-id'));
            addToCart(productId);
            e.preventDefault();
        }
    });
    
    // Control de cantidad en el carrito
    document.addEventListener('click', function(e) {
        // Botones de aumentar cantidad
        if (e.target.classList.contains('quantity-increase') || 
            e.target.closest('.quantity-increase')) {
            const btn = e.target.classList.contains('quantity-increase') ? 
                       e.target : e.target.closest('.quantity-increase');
            const cartId = btn.getAttribute('data-cart-id');
            updateQuantity(cartId, 1);
            e.preventDefault();
        }
        
        // Botones de disminuir cantidad
        if (e.target.classList.contains('quantity-decrease') || 
            e.target.closest('.quantity-decrease')) {
            const btn = e.target.classList.contains('quantity-decrease') ? 
                       e.target : e.target.closest('.quantity-decrease');
            const cartId = btn.getAttribute('data-cart-id');
            updateQuantity(cartId, -1);
            e.preventDefault();
        }
        
        // Botones de eliminar producto
        if (e.target.classList.contains('remove-btn') || 
            e.target.closest('.remove-btn')) {
            const element = e.target.classList.contains('remove-btn') ? 
                           e.target : e.target.closest('.remove-btn');
            const cartId = element.getAttribute('data-cart-id');
            removeFromCart(cartId);
            e.preventDefault();
        }
    });
    
    // Proceder al checkout
    document.getElementById('proceed-checkout').addEventListener('click', function(e) {
        if (cart.length > 0) {
            switchTab('checkout');
            updateOrderSummary();
        } else {
            showNotification('Tu carrito está vacío. Agrega productos antes de proceder al pago.', 'error');
        }
        e.preventDefault();
    });
    
    // Métodos de pago
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', function() {
            const methodId = this.getAttribute('data-method');
            selectPaymentMethod(methodId);
        });
    });
    
    // Formulario de checkout
    document.getElementById('checkout-form').addEventListener('submit', function(e) {
        e.preventDefault();
        processOrder();
    });
    
    // Continuar comprando
    document.getElementById('continue-shopping').addEventListener('click', function(e) {
        switchTab('products');
        closeCartModal();
        e.preventDefault();
    });
}

// Funciones de navegación del modal
function openCartModal() {
    document.getElementById('cart-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    switchTab('products');
}

function closeCartModal() {
    document.getElementById('cart-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
    resetVersionSelectors();
}

function switchTab(tabName) {
    document.querySelectorAll('.cart-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.cart-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`.cart-tab[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    const activeSection = document.getElementById(`${tabName}-section`);
    if (activeSection) {
        activeSection.classList.add('active');
    }
    
    if (tabName === 'cart') {
        updateCartDisplay();
    } else if (tabName === 'checkout') {
        updateOrderSummary();
        document.querySelectorAll('.payment-method').forEach(m => {
            m.classList.remove('selected');
            if (m.getAttribute('data-method') === paymentMethod) {
                m.classList.add('selected');
            }
        });
    }
}

// Funciones de utilidad
function handleImageErrors() {
    document.querySelectorAll('img').forEach(img => {
        img.onerror = function() {
            this.src = 'https://via.placeholder.com/300x300/1a365d/d4af37?text=Imagen+No+Disponible';
            this.alt = 'Imagen no disponible';
        };
    });
}

function handleCriticalErrors() {
    window.addEventListener('error', function(e) {
        console.error('Error crítico:', e.error);
        showNotification('Ha ocurrido un error inesperado. Por favor, recarga la página.', 'error');
    });

    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
    } catch (e) {
        console.error('localStorage no disponible:', e);
        showNotification('El almacenamiento local no está disponible. Algunas funciones pueden no trabajar correctamente.', 'error');
    }
}

function setupOfflineDetection() {
    window.addEventListener('online', function() {
        showNotification('Conexión restaurada', 'success');
    });

    window.addEventListener('offline', function() {
        showNotification('Estás sin conexión. Algunas funciones pueden no estar disponibles.', 'error');
    });
}

function improveAccessibility() {
    const modal = document.getElementById('cart-modal');
    const closeBtn = document.querySelector('.close-modal');
    
    modal.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCartModal();
        }
    });
    
    document.querySelectorAll('.link-button').forEach(button => {
        button.setAttribute('aria-label', button.querySelector('span').textContent);
    });
}

// Sistema de notificaciones
function showNotification(message, type = 'success') {
    document.querySelectorAll('.custom-notification').forEach(notification => {
        notification.remove();
    });
    
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = 'custom-notification';
    
    const backgroundColor = type === 'error' ? 'var(--error-color)' : 'var(--success-color)';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 1001;
        font-weight: 500;
        animation: fadeInUp 0.5s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.5s ease forwards';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 500);
    }, 3000);
}

// Añadir animación de fadeOut
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
    }
`;
document.head.appendChild(style);

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});
