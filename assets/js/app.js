// =======================================================================
// APLICACIÓN PRINCIPAL - INICIALIZACIÓN Y EVENTOS
// =======================================================================

// Variables globales de la aplicación
let isModalOpen = false;
let currentTab = 'products';

// Sistema de notificaciones mejorado
function showNotification(message, type = 'success') {
    // Remover notificaciones existentes
    document.querySelectorAll('.custom-notification').forEach(notification => {
        notification.remove();
    });
    
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `custom-notification ${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    notification.setAttribute('aria-atomic', 'true');
    
    // Agregar icono según el tipo
    let icon = '';
    switch(type) {
        case 'error':
            icon = '❌';
            notification.setAttribute('aria-label', `Error: ${message}`);
            break;
        case 'warning':
            icon = '⚠️';
            notification.setAttribute('aria-label', `Advertencia: ${message}`);
            break;
        default:
            icon = '✅';
            notification.setAttribute('aria-label', `Éxito: ${message}`);
    }
    
    notification.innerHTML = `${icon} ${message}`;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    requestAnimationFrame(() => {
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
    });
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        notification.style.transform = 'translateY(-20px)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 500);
    }, 5000);
}

// Añadir estilos CSS para notificaciones si no existen
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        .custom-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 1001;
            font-weight: 500;
            max-width: 300px;
            transform: translateY(-20px);
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .custom-notification.success {
            background: var(--success-color);
            color: white;
        }
        
        .custom-notification.error {
            background: var(--error-color);
            color: white;
        }
        
        .custom-notification.warning {
            background: var(--warning-color);
            color: white;
        }
        
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-20px); }
        }
        
        /* Animación para notificaciones */
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

// Funciones de navegación del modal
function openCartModal() {
    const modal = document.getElementById('cart-modal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('modal-title').focus();
    isModalOpen = true;
    
    // Forzar actualización de la pestaña actual
    switchTab(currentTab);
    
    // Registrar evento para analytics
    logEvent('modal_opened', { modal: 'cart' });
}

function closeCartModal() {
    const modal = document.getElementById('cart-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    modal.setAttribute('aria-hidden', 'true');
    isModalOpen = false;
    
    // Regresar foco al botón del carrito
    const cartButton = document.getElementById('cart-button');
    if (cartButton) {
        cartButton.focus();
    }
    
    // Resetear selectores de versión
    if (typeof window.resetVersionSelectors === 'function') {
        window.resetVersionSelectors();
    }
}

function switchTab(tabName) {
    currentTab = tabName;
    
    // Obtener referencia a paymentMethod global
    const paymentMethod = window.paymentMethod || 'transferencia';
    
    // Actualizar tabs
    document.querySelectorAll('.cart-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });
    
    document.querySelectorAll('.cart-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`.cart-tab[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-selected', 'true');
        
        // Enfocar el tab activo para accesibilidad
        activeTab.focus();
    }
    
    const activeSection = document.getElementById(`${tabName}-section`);
    if (activeSection) {
        activeSection.classList.add('active');
        
        // Animar la entrada de la sección
        activeSection.style.animation = 'fadeInUp 0.5s ease';
    }
    
    // Acciones específicas por tab
    switch(tabName) {
        case 'cart':
            if (typeof window.updateCartDisplay === 'function') {
                window.updateCartDisplay();
            }
            break;
            
        case 'checkout':
            if (typeof window.updateOrderSummary === 'function') {
                window.updateOrderSummary();
            }
            
            // Actualizar métodos de pago seleccionados
            document.querySelectorAll('.payment-method').forEach(m => {
                m.classList.remove('selected');
                m.setAttribute('aria-checked', 'false');
                
                if (m.getAttribute('data-method') === paymentMethod) {
                    m.classList.add('selected');
                    m.setAttribute('aria-checked', 'true');
                }
            });
            
            // Enfocar el primer campo del formulario
            setTimeout(() => {
                const firstInput = document.getElementById('customer-name');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
            break;
            
        case 'products':
            // Resetear formulario si viene de checkout
            const checkoutForm = document.getElementById('checkout-form');
            if (checkoutForm) {
                checkoutForm.reset();
                
                // Limpiar mensajes de error
                document.querySelectorAll('.validation-message').forEach(el => {
                    el.textContent = '';
                });
                
                document.querySelectorAll('.form-input').forEach(input => {
                    input.removeAttribute('aria-invalid');
                });
            }
            break;
    }
    
    // Registrar cambio de pestaña
    logEvent('tab_changed', { tab: tabName });
}

// Validación de campos en tiempo real
function validateField(field) {
    const value = field.value.trim();
    const errorElement = document.getElementById(`${field.id}-error`);
    
    if (!errorElement) return true;
    
    // Limpiar mensaje anterior
    errorElement.textContent = '';
    field.removeAttribute('aria-invalid');
    
    // Validar campo requerido
    if (field.required && !value) {
        errorElement.textContent = 'Este campo es requerido';
        field.setAttribute('aria-invalid', 'true');
        return false;
    }
    
    // Validaciones específicas por tipo
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            errorElement.textContent = 'Por favor ingresa un email válido';
            field.setAttribute('aria-invalid', 'true');
            return false;
        }
    }
    
    if (field.id === 'customer-phone' && value) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(value)) {
            errorElement.textContent = 'Por favor ingresa un teléfono válido';
            field.setAttribute('aria-invalid', 'true');
            return false;
        }
    }
    
    // Campo válido
    field.setAttribute('aria-invalid', 'false');
    return true;
}

// Validar todo el formulario
function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required]');
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
            
            // Enfocar el primer campo inválido
            if (isValid === false) {
                input.focus();
                // Cambiar isValid para que no se siga ejecutando
                isValid = null;
            }
        }
    });
    
    return isValid === true;
}

// Sistema de logging para debugging
function logEvent(eventName, data = {}) {
    if (console && console.log) {
        console.log(`[APP-EVENT] ${eventName}:`, data);
    }
    
    // Aquí podrías integrar Google Analytics o similar
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, data);
    }
}

// Inicializar aplicación
function initApp() {
    logEvent('app_initialized');
    
    // Renderizar productos
    if (typeof window.renderProducts === 'function') {
        window.renderProducts();
    }
    
    // Actualizar carrito
    if (typeof window.updateCart === 'function') {
        window.updateCart();
    }
    
    // Configurar event listeners
    setupEventListeners();
    
    // Animación de entrada escalonada
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach(element => {
        element.style.opacity = '1';
    });
    
    // Verificar si hay elementos en el carrito al cargar
    if (typeof window.cart !== 'undefined' && window.cart.length > 0) {
        showNotification(`${window.cart.length} producto(s) en el carrito`, 'success');
    }
    
    // Añadir clase de cargado al body
    document.body.classList.add('app-loaded');
    
    logEvent('app_ready');
}

// Configurar event listeners
function setupEventListeners() {
    logEvent('setting_up_event_listeners');
    
    // Botón del carrito
    const cartButton = document.getElementById('cart-button');
    if (cartButton) {
        cartButton.addEventListener('click', openCartModal);
        cartButton.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openCartModal();
            }
        });
    }
    
    // Cerrar modal
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', closeCartModal);
        closeModal.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                closeCartModal();
            }
        });
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
    
    // Cerrar modal con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isModalOpen) {
            closeCartModal();
        }
    });
    
    // Tabs del carrito
    document.querySelectorAll('.cart-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
        
        tab.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const tabName = this.getAttribute('data-tab');
                switchTab(tabName);
            }
        });
    });
    
    // Agregar productos al carrito (delegación de eventos)
    document.addEventListener('click', function(e) {
        const addToCartBtn = e.target.closest('.add-to-cart-btn');
        if (addToCartBtn) {
            const productId = parseInt(addToCartBtn.getAttribute('data-product-id'));
            
            // Validar que el producto existe
            if (!isNaN(productId)) {
                if (typeof window.addToCart === 'function') {
                    window.addToCart(productId);
                } else {
                    showNotification('Error: Sistema de carrito no disponible', 'error');
                }
            }
            
            e.preventDefault();
        }
    });
    
    // Control de cantidad en el carrito (delegación de eventos)
    document.addEventListener('click', function(e) {
        // Botones de aumentar cantidad
        const increaseBtn = e.target.closest('.quantity-increase');
        if (increaseBtn) {
            const cartId = increaseBtn.getAttribute('data-cart-id');
            if (cartId && typeof window.updateQuantity === 'function') {
                window.updateQuantity(cartId, 1);
            }
            e.preventDefault();
        }
        
        // Botones de disminuir cantidad
        const decreaseBtn = e.target.closest('.quantity-decrease');
        if (decreaseBtn) {
            const cartId = decreaseBtn.getAttribute('data-cart-id');
            if (cartId && typeof window.updateQuantity === 'function') {
                window.updateQuantity(cartId, -1);
            }
            e.preventDefault();
        }
        
        // Botones de eliminar producto
        const removeBtn = e.target.closest('.remove-btn');
        if (removeBtn) {
            const cartId = removeBtn.getAttribute('data-cart-id');
            if (cartId && typeof window.removeFromCart === 'function') {
                // Confirmar eliminación
                if (confirm('¿Estás seguro de eliminar este producto del carrito?')) {
                    window.removeFromCart(cartId);
                }
            }
            e.preventDefault();
        }
    });
    
    // Proceder al checkout
    const proceedCheckout = document.getElementById('proceed-checkout');
    if (proceedCheckout) {
        proceedCheckout.addEventListener('click', function(e) {
            if (typeof window.cart !== 'undefined' && window.cart.length > 0) {
                switchTab('checkout');
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
            if (typeof window.selectPaymentMethod === 'function') {
                window.selectPaymentMethod(methodId);
            }
        });
        
        method.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const methodId = this.getAttribute('data-method');
                if (typeof window.selectPaymentMethod === 'function') {
                    window.selectPaymentMethod(methodId);
                }
            }
        });
    });
    
    // Formulario de checkout
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validar formulario
            if (!validateForm(this)) {
                showNotification('Por favor corrige los errores en el formulario', 'error');
                return;
            }
            
            // Procesar pedido
            if (typeof window.processOrder === 'function') {
                window.processOrder();
            } else {
                showNotification('Error: Sistema de pedidos no disponible', 'error');
            }
        });
        
        // Validación en tiempo real
        const inputs = checkoutForm.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                // Limpiar error mientras se escribe
                const errorElement = document.getElementById(`${this.id}-error`);
                if (errorElement) {
                    errorElement.textContent = '';
                }
                this.removeAttribute('aria-invalid');
            });
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
    
    // Prevenir envío de formularios con Enter accidental
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT' && !e.target.closest('form')) {
            e.preventDefault();
        }
    });
    
    // Mejorar experiencia en móviles
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
        
        // Aumentar área táctil para botones pequeños
        document.querySelectorAll('button, .link-button').forEach(btn => {
            btn.style.minHeight = '44px';
        });
    }
    
    logEvent('event_listeners_setup_complete');
}

// Función para recargar la página de manera segura
function safeReload() {
    if (typeof window.cart !== 'undefined' && window.cart.length > 0) {
        if (confirm('Tienes productos en el carrito. ¿Estás seguro de recargar la página?')) {
            window.location.reload();
        }
    } else {
        window.location.reload();
    }
}

// Manejar errores no capturados
window.addEventListener('error', function(e) {
    console.error('Error no capturado:', e.error);
    showNotification('Ocurrió un error inesperado. Por favor recarga la página.', 'error');
    
    // Enviar error a servidor si es posible
    if (typeof navigator.sendBeacon === 'function') {
        const errorData = {
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
        
        navigator.sendBeacon('/api/log-error', JSON.stringify(errorData));
    }
});

// Manejar promesas rechazadas no capturadas
window.addEventListener('unhandledrejection', function(e) {
    console.error('Promesa rechazada no capturada:', e.reason);
    showNotification('Error en una operación. Por favor intenta de nuevo.', 'error');
});

// Inicializar aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM ya está listo
    initApp();
}

// Exportar funciones para uso global
window.showNotification = showNotification;
window.openCartModal = openCartModal;
window.closeCartModal = closeCartModal;
window.switchTab = switchTab;
window.initApp = initApp;
window.validateField = validateField;
window.validateForm = validateForm;
window.logEvent = logEvent;
window.safeReload = safeReload;
