[file name]: app.js
[file content begin]
// =======================================================================
// APLICACIÓN PRINCIPAL - INICIALIZACIÓN Y EVENTOS
// =======================================================================

// Sistema de notificaciones
function showNotification(message, type = 'success') {
    // Remover notificaciones existentes
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

// Añadir animación de fadeOut si no existe
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-20px); }
        }
    `;
    document.head.appendChild(style);
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

// Inicializar aplicación
function initApp() {
    // Inicializar EmailJS (reemplaza con tu Public Key)
    emailjs.init("tu_public_key_de_emailjs");
    
    renderProducts();
    updateCart();
    setupEventListeners();
    
    // Animación de entrada escalonada
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach(element => {
        element.style.opacity = '1';
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Botón del carrito
    const cartButton = document.getElementById('cart-button');
    if (cartButton) {
        cartButton.addEventListener('click', openCartModal);
    }
    
    // Cerrar modal
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', closeCartModal);
    }
    
    // Cerrar modal al hacer clic fuera
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeCartModal();
            }
        });
    }
    
    // Tabs del carrito
    document.querySelectorAll('.cart-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // Agregar productos al carrito (delegación de eventos)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart-btn') || 
            e.target.closest('.add-to-cart-btn')) {
            const btn = e.target.classList.contains('add-to-cart-btn') ? 
                       e.target : e.target.closest('.add-to-cart-btn');
            const productId = parseInt(btn.getAttribute('data-product-id'));
            addToCart(productId);
            e.preventDefault();
        }
    });
    
    // Control de cantidad en el carrito (delegación de eventos)
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
    const proceedCheckout = document.getElementById('proceed-checkout');
    if (proceedCheckout) {
        proceedCheckout.addEventListener('click', function(e) {
            if (cart.length > 0) {
                switchTab('checkout');
                updateOrderSummary();
            } else {
                showNotification('Tu carrito está vacío. Agrega productos antes de proceder al pago.', 'error');
            }
            e.preventDefault();
        });
    }
    
    // Métodos de pago
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', function() {
            const methodId = this.getAttribute('data-method');
            selectPaymentMethod(methodId);
        });
    });
    
    // Formulario de checkout
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processOrder();
        });
    }
    
    // Continuar comprando
    const continueShopping = document.getElementById('continue-shopping');
    if (continueShopping) {
        continueShopping.addEventListener('click', function(e) {
            switchTab('products');
            closeCartModal();
            e.preventDefault();
        });
    }
}

// Inicializar aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
[file content end]
