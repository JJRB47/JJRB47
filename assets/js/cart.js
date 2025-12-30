// =======================================================================
// VARIABLES GLOBALES DEL CARRITO
// =======================================================================

let cart = [];
let paymentMethod = 'transferencia';

// Inicializar carrito desde localStorage
try {
    const savedCart = localStorage.getItem('jjrb-cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        console.log(`✅ Carrito cargado: ${cart.length} productos`);
    }
} catch (error) {
    console.error('❌ Error al cargar carrito desde localStorage:', error);
    cart = [];
}

// =======================================================================
// FUNCIONES DEL CARRITO
// =======================================================================

// Sistema de logging para el carrito
const cartLogger = {
    info: (msg) => console.info(`[CART] ${new Date().toISOString()}: ${msg}`),
    error: (msg, error) => console.error(`[CART] ${new Date().toISOString()}: ${msg}`, error),
    warn: (msg) => console.warn(`[CART] ${new Date().toISOString()}: ${msg}`)
};

// Generar ID único para items del carrito
function getNextCartId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Calcular totales del carrito
function calculateCartTotals() {
    try {
        const subtotal = cart.reduce((sum, item) => {
            const itemPrice = item.price || 0;
            const itemQuantity = item.quantity || 1;
            return sum + (itemPrice * itemQuantity);
        }, 0);
        
        let discount = 0;
        if (paymentMethod === 'efectivo') {
            // Usar descuento de BUSINESS_INFO si está disponible
            const discountPercentage = window.BUSINESS_INFO ? 
                (window.BUSINESS_INFO.discountPercentage || 0.30) : 0.30;
            discount = subtotal * discountPercentage;
        }
        
        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            discount: parseFloat(discount.toFixed(2)),
            total: parseFloat((subtotal - discount).toFixed(2))
        };
    } catch (error) {
        cartLogger.error('Error calculando totales:', error);
        return { subtotal: 0, discount: 0, total: 0 };
    }
}

// Obtener producto del carrito por ID
function getCartItem(cartId) {
    return cart.find(item => item.cartId === cartId);
}

// Agregar producto al carrito
function addToCart(productId) {
    try {
        // Validar que el producto existe
        if (typeof window.getProductById !== 'function') {
            showNotification('Error: Sistema de productos no disponible', 'error');
            return;
        }
        
        const product = window.getProductById(productId);
        if (!product) {
            showNotification('Error: Producto no encontrado', 'error');
            return;
        }

        // Obtener versión seleccionada
        const versionSelect = document.getElementById(`version-select-${productId}`);
        if (!versionSelect) {
            showNotification('Error: Selector de versión no encontrado', 'error');
            return;
        }

        const selectedOption = versionSelect.options[versionSelect.selectedIndex];
        const versionId = selectedOption.value;
        const versionName = selectedOption.text.split(' - ')[0] || 'Versión no especificada';
        const price = parseFloat(selectedOption.getAttribute('data-price')) || 0;

        // Validar datos
        if (!versionId || isNaN(price)) {
            showNotification('Error: Datos de producto inválidos', 'error');
            return;
        }

        // Verificar si ya existe en el carrito
        const existingItemIndex = cart.findIndex(item => 
            item.productId === productId && item.versionId === versionId
        );

        if (existingItemIndex !== -1) {
            // Incrementar cantidad
            cart[existingItemIndex].quantity += 1;
            showNotification(`${product.name} - ${versionName} (cantidad aumentada)`);
            cartLogger.info(`Producto existente actualizado: ${product.name} - ${versionName}`);
        } else {
            // Agregar nuevo item
            const cartId = getNextCartId();
            cart.push({
                cartId: cartId,
                productId: productId,
                name: product.name || 'Producto sin nombre',
                versionId: versionId,
                versionName: versionName,
                price: price,
                icon: product.icon || 'fas fa-box',
                quantity: 1,
                addedAt: new Date().toISOString()
            });
            showNotification(`${product.name} - ${versionName} agregado al carrito`);
            cartLogger.info(`Nuevo producto agregado: ${product.name} - ${versionName}`);
        }

        // Guardar y actualizar
        saveCart();
        updateCart();
        updateCartDisplay();
        
        // Animación de confirmación
        animateCartButton();
        
    } catch (error) {
        cartLogger.error('Error en addToCart:', error);
        showNotification('Error al agregar producto al carrito', 'error');
    }
}

// Animación del botón del carrito
function animateCartButton() {
    const cartButton = document.getElementById('cart-button');
    if (cartButton) {
        cartButton.classList.add('pulse');
        setTimeout(() => {
            cartButton.classList.remove('pulse');
        }, 300);
    }
}

// Actualizar cantidad de un producto
function updateQuantity(cartId, change) {
    try {
        const item = getCartItem(cartId);
        
        if (!item) {
            showNotification('Producto no encontrado en el carrito', 'error');
            return;
        }
        
        const newQuantity = item.quantity + change;
        
        // Validar cantidad mínima
        if (newQuantity <= 0) {
            // Confirmar eliminación
            if (confirm('¿Eliminar producto del carrito?')) {
                removeFromCart(cartId);
            }
            return;
        }
        
        // Validar cantidad máxima (opcional)
        if (newQuantity > 99) {
            showNotification('La cantidad máxima por producto es 99', 'warning');
            return;
        }
        
        item.quantity = newQuantity;
        saveCart();
        updateCart();
        updateCartDisplay();
        
        // Actualizar resumen si estamos en checkout
        if (document.getElementById('checkout-section').classList.contains('active')) {
            updateOrderSummary();
        }
        
        cartLogger.info(`Cantidad actualizada: ${item.name} x${item.quantity}`);
        
    } catch (error) {
        cartLogger.error('Error en updateQuantity:', error);
        showNotification('Error al actualizar cantidad', 'error');
    }
}

// Eliminar producto del carrito
function removeFromCart(cartId) {
    try {
        const itemIndex = cart.findIndex(item => item.cartId === cartId);
        
        if (itemIndex === -1) {
            showNotification('Producto no encontrado en el carrito', 'error');
            return;
        }
        
        const removedProduct = cart[itemIndex];
        cart.splice(itemIndex, 1);
        saveCart();
        updateCart();
        updateCartDisplay();
        
        // Actualizar resumen si estamos en checkout
        if (document.getElementById('checkout-section').classList.contains('active')) {
            updateOrderSummary();
        }
        
        showNotification(`${removedProduct.name} - ${removedProduct.versionName} eliminado del carrito`);
        cartLogger.info(`Producto eliminado: ${removedProduct.name} - ${removedProduct.versionName}`);
        
    } catch (error) {
        cartLogger.error('Error en removeFromCart:', error);
        showNotification('Error al eliminar producto del carrito', 'error');
    }
}

// Vaciar carrito completamente
function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm('¿Estás seguro de vaciar todo el carrito?')) {
        cart = [];
        saveCart();
        updateCart();
        updateCartDisplay();
        updateOrderSummary();
        showNotification('Carrito vaciado', 'success');
        cartLogger.info('Carrito vaciado completamente');
    }
}

// Actualizar contador del carrito
function updateCart() {
    try {
        const cartCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);
        const cartCountElement = document.getElementById('cart-count');
        const tabCartCountElement = document.getElementById('tab-cart-count');
        const proceedCheckoutBtn = document.getElementById('proceed-checkout');
        
        if (cartCount > 0) {
            if (cartCountElement) {
                cartCountElement.textContent = `(${cartCount})`;
                cartCountElement.style.display = 'inline';
            }
            if (tabCartCountElement) {
                tabCartCountElement.textContent = `(${cartCount})`;
            }
            if (proceedCheckoutBtn) {
                proceedCheckoutBtn.disabled = false;
                proceedCheckoutBtn.setAttribute('aria-disabled', 'false');
            }
        } else {
            if (cartCountElement) {
                cartCountElement.style.display = 'none';
            }
            if (tabCartCountElement) {
                tabCartCountElement.textContent = '(0)';
            }
            if (proceedCheckoutBtn) {
                proceedCheckoutBtn.disabled = true;
                proceedCheckoutBtn.setAttribute('aria-disabled', 'true');
            }
        }
        
        // Actualizar título de la pestaña
        if (cartCount > 0) {
            document.title = `(${cartCount}) Jonathan Jose Rangel Betancourt`;
        } else {
            document.title = 'Jonathan Jose Rangel Betancourt';
        }
        
    } catch (error) {
        cartLogger.error('Error en updateCart:', error);
    }
}

// Actualizar display del carrito
function updateCartDisplay() {
    try {
        const cartItemsContainer = document.getElementById('cart-items');
        const proceedCheckoutBtn = document.getElementById('proceed-checkout');
        
        if (!cartItemsContainer) return;
        
        // Si el carrito está vacío
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-message" role="status" aria-live="polite">
                    <div class="empty-cart-icon">
                        <i class="fas fa-shopping-cart" aria-hidden="true"></i>
                    </div>
                    <h3>Tu carrito está vacío</h3>
                    <p>Agrega algunos productos para continuar.</p>
                </div>
            `;
            
            document.getElementById('subtotal').textContent = '$0.00';
            document.getElementById('total').textContent = '$0.00';
            document.getElementById('discount-row').classList.add('hidden');
            
            if (proceedCheckoutBtn) {
                proceedCheckoutBtn.disabled = true;
                proceedCheckoutBtn.setAttribute('aria-disabled', 'true');
            }
            return;
        }
        
        const totals = calculateCartTotals();
        
        // Generar HTML para los items del carrito
        cartItemsContainer.innerHTML = cart.map(item => {
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            const iconClass = item.productId === 1 ? 'windows-icon' : 'office-icon';
            
            return `
                <div class="cart-item" role="listitem" aria-label="${item.name} - ${item.versionName}">
                    <div class="cart-item-info">
                        <i class="${item.icon || 'fas fa-box'} cart-item-icon ${iconClass}" aria-hidden="true"></i>
                        <div class="cart-item-details">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-version">${item.versionName}</div>
                        </div>
                    </div>
                    <div class="cart-item-actions">
                        <div class="quantity-control" aria-label="Cantidad de ${item.name}">
                            <button class="quantity-decrease" data-cart-id="${item.cartId}" 
                                    aria-label="Disminuir cantidad de ${item.name}" 
                                    ${item.quantity <= 1 ? 'disabled' : ''}>
                                <i class="fas fa-minus" aria-hidden="true"></i>
                            </button>
                            <span aria-live="polite">${item.quantity}</span>
                            <button class="quantity-increase" data-cart-id="${item.cartId}" 
                                    aria-label="Aumentar cantidad de ${item.name}">
                                <i class="fas fa-plus" aria-hidden="true"></i>
                            </button>
                        </div>
                        <div class="cart-item-price" aria-label="Precio total: $${itemTotal.toFixed(2)}">
                            $${itemTotal.toFixed(2)}
                        </div>
                        <button class="remove-btn" data-cart-id="${item.cartId}" 
                                aria-label="Eliminar ${item.name} del carrito">
                            <i class="fas fa-trash" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Actualizar descuentos y totales
        const discountRow = document.getElementById('discount-row');
        const discountAmount = document.getElementById('discount-amount');
        const subtotalElement = document.getElementById('subtotal');
        const totalElement = document.getElementById('total');
        
        if (paymentMethod === 'efectivo') {
            discountRow.classList.remove('hidden');
            discountAmount.textContent = `-$${totals.discount.toFixed(2)}`;
            discountAmount.setAttribute('aria-label', `Descuento: $${totals.discount.toFixed(2)}`);
        } else {
            discountRow.classList.add('hidden');
        }
        
        subtotalElement.textContent = `$${totals.subtotal.toFixed(2)}`;
        subtotalElement.setAttribute('aria-label', `Subtotal: $${totals.subtotal.toFixed(2)}`);
        
        totalElement.textContent = `$${totals.total.toFixed(2)}`;
        totalElement.setAttribute('aria-label', `Total a pagar: $${totals.total.toFixed(2)}`);
        
        if (proceedCheckoutBtn) {
            proceedCheckoutBtn.disabled = false;
            proceedCheckoutBtn.setAttribute('aria-disabled', 'false');
        }
        
    } catch (error) {
        cartLogger.error('Error en updateCartDisplay:', error);
        showNotification('Error al actualizar el carrito', 'error');
    }
}

// Actualizar resumen del pedido
function updateOrderSummary() {
    try {
        const orderItemsContainer = document.getElementById('order-items');
        const checkoutBtn = document.querySelector('#checkout-form button[type="submit"]');
        
        if (!orderItemsContainer) return;
        
        // Si el carrito está vacío
        if (cart.length === 0) {
            orderItemsContainer.innerHTML = `
                <div class="empty-cart-checkout" role="status" aria-live="polite">
                    <div class="empty-cart-icon">
                        <i class="fas fa-shopping-cart" aria-hidden="true"></i>
                    </div>
                    <h3>No hay productos en el carrito</h3>
                    <p>Agrega algunos productos para continuar.</p>
                </div>
            `;
            
            document.getElementById('order-subtotal').textContent = '$0.00';
            document.getElementById('order-total').textContent = '$0.00';
            document.getElementById('order-discount-row').classList.add('hidden');
            
            if (checkoutBtn) {
                checkoutBtn.disabled = true;
                checkoutBtn.setAttribute('aria-disabled', 'true');
            }
            return;
        }
        
        const totals = calculateCartTotals();
        
        // Generar HTML para el resumen del pedido
        orderItemsContainer.innerHTML = cart.map(item => {
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            return `
                <div class="order-item" role="listitem">
                    <span>${item.name} - ${item.versionName} x${item.quantity}</span>
                    <span>$${itemTotal.toFixed(2)}</span>
                </div>
            `;
        }).join('');
        
        // Actualizar totales
        const orderSubtotal = document.getElementById('order-subtotal');
        const orderTotal = document.getElementById('order-total');
        const orderDiscountRow = document.getElementById('order-discount-row');
        const orderDiscount = document.getElementById('order-discount');
        
        orderSubtotal.textContent = `$${totals.subtotal.toFixed(2)}`;
        orderTotal.textContent = `$${totals.total.toFixed(2)}`;
        
        if (paymentMethod === 'efectivo') {
            orderDiscountRow.classList.remove('hidden');
            orderDiscount.textContent = `-$${totals.discount.toFixed(2)}`;
        } else {
            orderDiscountRow.classList.add('hidden');
        }
        
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.setAttribute('aria-disabled', 'false');
        }
        
    } catch (error) {
        cartLogger.error('Error en updateOrderSummary:', error);
        showNotification('Error al actualizar el resumen', 'error');
    }
}

// Seleccionar método de pago
function selectPaymentMethod(method) {
    try {
        // Validar método de pago
        const validMethods = ['transferencia', 'paypal', 'efectivo'];
        if (!validMethods.includes(method)) {
            cartLogger.warn(`Método de pago inválido: ${method}`);
            method = 'transferencia';
        }
        
        paymentMethod = method;
        
        // Actualizar UI
        document.querySelectorAll('.payment-method').forEach(pm => {
            pm.classList.remove('selected');
            pm.setAttribute('aria-checked', 'false');
        });
        
        const selectedMethod = document.querySelector(`.payment-method[data-method="${method}"]`);
        if (selectedMethod) {
            selectedMethod.classList.add('selected');
            selectedMethod.setAttribute('aria-checked', 'true');
            selectedMethod.focus();
        }
        
        // Actualizar totales
        updateCartDisplay();
        updateOrderSummary();
        
        cartLogger.info(`Método de pago seleccionado: ${method}`);
        
    } catch (error) {
        cartLogger.error('Error en selectPaymentMethod:', error);
        showNotification('Error al seleccionar método de pago', 'error');
    }
}

// =======================================================================
// FUNCIÓN PRINCIPAL PROCESAR PEDIDO
// =======================================================================

// Procesar pedido
async function processOrder() {
    try {
        cartLogger.info('Iniciando procesamiento de pedido...');
        
        // Obtener datos del formulario
        let name = document.getElementById('customer-name').value.trim();
        let email = document.getElementById('customer-email').value.trim();
        let phone = document.getElementById('customer-phone').value.trim();
        let address = document.getElementById('customer-address').value.trim();
        
        // Validar que hay productos en el carrito
        if (cart.length === 0) {
            showNotification('El carrito está vacío', 'error');
            return;
        }
        
        // Validar datos del cliente usando funciones de validación
        if (!name || !email || !phone || !address) {
            showNotification('Por favor completa todos los campos requeridos', 'error');
            return;
        }
        
        // Usar funciones de validación si están disponibles
        if (typeof window.validateEmail === 'function' && !window.validateEmail(email)) {
            showNotification('Por favor ingresa un email válido', 'error');
            document.getElementById('customer-email').focus();
            return;
        }
        
        if (typeof window.validatePhone === 'function' && !window.validatePhone(phone)) {
            showNotification('Por favor ingresa un número de teléfono válido', 'error');
            document.getElementById('customer-phone').focus();
            return;
        }
        
        // Usar funciones de sanitización si están disponibles
        if (typeof window.sanitizeName === 'function') name = window.sanitizeName(name);
        if (typeof window.sanitizeEmail === 'function') email = window.sanitizeEmail(email);
        if (typeof window.sanitizePhone === 'function') phone = window.sanitizePhone(phone);
        if (typeof window.sanitizeInput === 'function') address = window.sanitizeInput(address);
        
        // Generar número de pedido
        const orderNum = typeof window.generateOrderNumber === 'function' 
            ? window.generateOrderNumber() 
            : `JJRB-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        document.getElementById('order-number').textContent = orderNum;
        
        const totals = calculateCartTotals();
        const greeting = typeof window.getGreetingByTime === 'function' 
            ? window.getGreetingByTime() 
            : 'Hola';
        
        // Preparar datos del cliente
        const customerInfo = { 
            name, 
            email, 
            phone, 
            address 
        };
        
        // Verificar si preparePDFData está disponible
        let pdfData;
        if (typeof window.preparePDFData === 'function') {
            pdfData = window.preparePDFData(cart, customerInfo, orderNum, paymentMethod, totals);
        } else {
            // Datos básicos si la función no está disponible
            pdfData = {
                orderNumber: orderNum,
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                customer: customerInfo,
                items: cart.map(item => ({
                    name: item.name,
                    version: item.versionName,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.price * item.quantity
                })),
                totals: totals,
                paymentMethod: paymentMethod === 'efectivo' ? 'Efectivo (30% descuento)' : 
                              paymentMethod === 'paypal' ? 'PayPal' : 'Transferencia Bancaria',
                discountPercentage: 0.30,
                greeting: greeting
            };
        }
        
        // Generar PDF si está disponible
        let pdfGenerated = false;
        if (typeof window.downloadOrderPDF === 'function') {
            try {
                pdfGenerated = await window.downloadOrderPDF(pdfData);
                if (!pdfGenerated) {
                    showNotification('El pedido se procesó pero hubo un error con el PDF', 'warning');
                }
            } catch (pdfError) {
                cartLogger.error('Error generando PDF:', pdfError);
                showNotification('Error generando PDF, continuando con el pedido...', 'warning');
            }
        } else {
            // Si no hay función de PDF, continuar sin PDF
            showNotification('Pedido procesado correctamente (PDF no disponible)', 'success');
        }
        
        // Preparar mensaje de WhatsApp
        const businessName = window.BUSINESS_INFO ? window.BUSINESS_INFO.businessName : 'Jonathan Jose Rangel Betancourt (JJRB)';
        const whatsappNumber = window.BUSINESS_INFO ? window.BUSINESS_INFO.whatsappNumber : '584122891366';
        
        let message = `📋 *SOLICITUD DE PEDIDO - ${businessName}*`;
        message += `\n────────────────────────────────────`;
        message += `\n${greeting}, estimado cliente.`;
        message += `\n\n*📦 Pedido N° ${orderNum}*`;
        message += `\n\n*👤 Datos de Contacto:*`;
        message += `\n• Nombre: ${name}`;
        message += `\n• Teléfono: ${phone}`;
        message += `\n• Email: ${email}`;
        message += `\n• Dirección: ${address}`;
        message += `\n\n*🛒 Productos solicitados:*`;
        
        cart.forEach((item, index) => {
            message += `\n${index + 1}. ${item.name} - ${item.versionName} x${item.quantity} = $${(item.price * item.quantity).toFixed(2)}`;
        });
        
        message += `\n\n*💰 Resumen del Pago:*`;
        message += `\n• Subtotal: $${totals.subtotal.toFixed(2)}`;
        
        if (paymentMethod === 'efectivo') {
            message += `\n• Descuento 30%: -$${totals.discount.toFixed(2)}`;
        }
        
        message += `\n• Total: $${totals.total.toFixed(2)}`;
        message += `\n• Método: ${paymentMethod === 'efectivo' ? 'Efectivo (30% descuento)' : 
                                 paymentMethod === 'paypal' ? 'PayPal' : 'Transferencia Bancaria'}`;
        
        if (pdfGenerated) {
            message += `\n\n📎 *Se ha generado un PDF con el recibo completo*`;
        }
        
        message += `\n\nMe comunicaré con usted en los próximos minutos para coordinar el agendamiento.`;
        message += `\n\n⌛ *Tiempo estimado de respuesta: 15-30 minutos*`;
        message += `\n\n¡Agradecemos su preferencia! 🙏`;

        const encodedMessage = encodeURIComponent(message);
        
        // Limpiar carrito y resetear formulario
        cart = [];
        saveCart();
        updateCart();
        
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
        
        // Cambiar a pestaña de confirmación
        switchTab('confirmation');
        
        // Mostrar mensaje de éxito
        showNotification('¡Pedido confirmado exitosamente!', 'success');
        cartLogger.info(`Pedido ${orderNum} procesado exitosamente`);
        
        // Abrir WhatsApp después de un breve delay
        setTimeout(() => {
            window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank', 'noopener,noreferrer');
        }, 1500);
        
    } catch (error) {
        cartLogger.error('Error crítico en processOrder:', error);
        showNotification('Error al procesar el pedido. Por favor intenta de nuevo.', 'error');
    }
}

// Guardar carrito en localStorage
function saveCart() {
    try {
        localStorage.setItem('jjrb-cart', JSON.stringify(cart));
        cartLogger.info(`Carrito guardado: ${cart.length} productos`);
    } catch (error) {
        cartLogger.error('Error guardando carrito en localStorage:', error);
        
        // Intentar con datos mínimos
        try {
            const minimalCart = cart.map(item => ({
                productId: item.productId,
                versionId: item.versionId,
                quantity: item.quantity
            }));
            localStorage.setItem('jjrb-cart-backup', JSON.stringify(minimalCart));
        } catch (e) {
            cartLogger.error('Error incluso con backup:', e);
        }
    }
}

// Restablecer selectores de versión
function resetVersionSelectors() {
    document.querySelectorAll('.version-select').forEach(select => {
        select.selectedIndex = 0;
    });
}

// Exportar funciones para uso en otros archivos
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.updateCart = updateCart;
window.updateCartDisplay = updateCartDisplay;
window.updateOrderSummary = updateOrderSummary;
window.selectPaymentMethod = selectPaymentMethod;
window.processOrder = processOrder;
window.saveCart = saveCart;
window.resetVersionSelectors = resetVersionSelectors;
window.calculateCartTotals = calculateCartTotals;
window.clearCart = clearCart;
window.getCartItem = getCartItem;
window.showNotification = showNotification;

// Asegurar que las variables globales estén disponibles
window.cart = cart;
window.paymentMethod = paymentMethod;