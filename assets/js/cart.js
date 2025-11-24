// =======================================================================
// VARIABLES GLOBALES DEL CARRITO
// =======================================================================

let cart = JSON.parse(localStorage.getItem('jjrb-cart')) || [];
let paymentMethod = 'transferencia';

// =======================================================================
// FUNCIONES DEL CARRITO
// =======================================================================

// Generar ID único para items del carrito
function getNextCartId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Calcular totales del carrito
function calculateCartTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let discount = 0;
    if (paymentMethod === 'efectivo') {
        discount = subtotal * BUSINESS_INFO.discountPercentage;
    }
    
    return {
        subtotal: subtotal,
        discount: discount,
        total: subtotal - discount
    };
}

// Agregar producto al carrito
function addToCart(productId) {
    const product = getProductById(productId);
    if (!product) {
        showNotification('Error: Producto no encontrado', 'error');
        return;
    }

    const versionSelect = document.getElementById(`version-select-${productId}`);
    if (!versionSelect) {
        showNotification('Error: Selector de versión no encontrado', 'error');
        return;
    }

    const selectedOption = versionSelect.options[versionSelect.selectedIndex];
    const versionId = selectedOption.value;
    const versionName = selectedOption.text.split(' - ')[0];
    const price = parseFloat(selectedOption.getAttribute('data-price'));

    // Verificar si ya existe en el carrito
    const existingItemIndex = cart.findIndex(item => 
        item.productId === productId && item.versionId === versionId
    );

    if (existingItemIndex !== -1) {
        cart[existingItemIndex].quantity += 1;
        showNotification(`${product.name} - ${versionName} (cantidad aumentada)`);
    } else {
        const cartId = getNextCartId();
        cart.push({
            cartId: cartId,
            productId: productId,
            name: product.name,
            versionId: versionId,
            versionName: versionName,
            price: price,
            icon: product.icon,
            quantity: 1
        });
        showNotification(`${product.name} - ${versionName} agregado al carrito`);
    }

    saveCart();
    updateCart();
    updateCartDisplay();
}

// Actualizar cantidad de un producto
function updateQuantity(cartId, change) {
    const item = cart.find(item => item.cartId === cartId);
    
    if (!item) {
        showNotification('Producto no encontrado en el carrito', 'error');
        return;
    }
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(cartId);
    } else {
        saveCart();
        updateCart();
        updateCartDisplay();
        if (document.getElementById('checkout-section').classList.contains('active')) {
            updateOrderSummary();
        }
    }
}

// Eliminar producto del carrito
function removeFromCart(cartId) {
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
    
    if (document.getElementById('checkout-section').classList.contains('active')) {
        updateOrderSummary();
    }
    
    showNotification(`${removedProduct.name} - ${removedProduct.versionName} eliminado del carrito`);
}

// Actualizar contador del carrito
function updateCart() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    const tabCartCountElement = document.getElementById('tab-cart-count');
    const proceedCheckoutBtn = document.getElementById('proceed-checkout');
    
    if (cartCount > 0) {
        cartCountElement.textContent = `(${cartCount})`;
        cartCountElement.style.display = 'inline';
        if (tabCartCountElement) tabCartCountElement.textContent = `(${cartCount})`;
        if (proceedCheckoutBtn) proceedCheckoutBtn.disabled = false;
    } else {
        cartCountElement.style.display = 'none';
        if (tabCartCountElement) tabCartCountElement.textContent = '(0)';
        if (proceedCheckoutBtn) proceedCheckoutBtn.disabled = true;
    }
}

// Actualizar display del carrito
function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cart-items');
    const proceedCheckoutBtn = document.getElementById('proceed-checkout');
    
    if (!cartItemsContainer) return;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-message">
                <div class="empty-cart-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <h3>Tu carrito está vacío</h3>
                <p>Agrega algunos productos para continuar.</p>
            </div>
        `;
        
        document.getElementById('subtotal').textContent = '$0.00';
        document.getElementById('total').textContent = '$0.00';
        document.getElementById('discount-row').classList.add('hidden');
        if (proceedCheckoutBtn) proceedCheckoutBtn.disabled = true;
        return;
    }
    
    const totals = calculateCartTotals();
    
    cartItemsContainer.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <i class="${item.icon} cart-item-icon ${item.productId === 1 ? 'windows-icon' : 'office-icon'}"></i>
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-version">${item.versionName}</div>
                    </div>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-control">
                        <button class="quantity-decrease" data-cart-id="${item.cartId}" aria-label="Disminuir cantidad">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-increase" data-cart-id="${item.cartId}" aria-label="Aumentar cantidad">+</button>
                    </div>
                    <div class="cart-item-price">$${itemTotal.toFixed(2)}</div>
                    <button class="remove-btn" data-cart-id="${item.cartId}" aria-label="Eliminar producto">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Actualizar descuentos y totales
    if (paymentMethod === 'efectivo') {
        document.getElementById('discount-row').classList.remove('hidden');
        document.getElementById('discount-amount').textContent = `-$${totals.discount.toFixed(2)}`;
    } else {
        document.getElementById('discount-row').classList.add('hidden');
    }
    
    document.getElementById('subtotal').textContent = `$${totals.subtotal.toFixed(2)}`;
    document.getElementById('total').textContent = `$${totals.total.toFixed(2)}`;
    if (proceedCheckoutBtn) proceedCheckoutBtn.disabled = false;
}

// Actualizar resumen del pedido
function updateOrderSummary() {
    const orderItemsContainer = document.getElementById('order-items');
    const checkoutBtn = document.querySelector('#checkout-form button[type="submit"]');
    
    if (!orderItemsContainer) return;
    
    if (cart.length === 0) {
        orderItemsContainer.innerHTML = `
            <div class="empty-cart-checkout">
                <div class="empty-cart-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <h3>No hay productos en el carrito</h3>
                <p>Agrega algunos productos para continuar.</p>
            </div>
        `;
        document.getElementById('order-subtotal').textContent = '$0.00';
        document.getElementById('order-total').textContent = '$0.00';
        document.getElementById('order-discount-row').classList.add('hidden');
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }
    
    const totals = calculateCartTotals();
    
    orderItemsContainer.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        return `
            <div class="order-item">
                <span>${item.name} - ${item.versionName} x${item.quantity}</span>
                <span>$${itemTotal.toFixed(2)}</span>
            </div>
        `;
    }).join('');
    
    if (paymentMethod === 'efectivo') {
        document.getElementById('order-discount-row').classList.remove('hidden');
        document.getElementById('order-discount').textContent = `-$${totals.discount.toFixed(2)}`;
    } else {
        document.getElementById('order-discount-row').classList.add('hidden');
    }
    
    document.getElementById('order-subtotal').textContent = `$${totals.subtotal.toFixed(2)}`;
    document.getElementById('order-total').textContent = `$${totals.total.toFixed(2)}`;
    if (checkoutBtn) checkoutBtn.disabled = false;
}

// Seleccionar método de pago
function selectPaymentMethod(method) {
    paymentMethod = method;
    
    document.querySelectorAll('.payment-method').forEach(pm => {
        pm.classList.remove('selected');
        pm.setAttribute('aria-checked', 'false');
    });
    
    const selectedMethod = document.querySelector(`.payment-method[data-method="${method}"]`);
    if (selectedMethod) {
        selectedMethod.classList.add('selected');
        selectedMethod.setAttribute('aria-checked', 'true');
    }
    
    updateCartDisplay();
    updateOrderSummary();
}

// =======================================================================
// FUNCIÓN PRINCIPAL PROCESAR PEDIDO - OPTIMIZADA
// =======================================================================

// Procesar pedido - VERSIÓN OPTIMIZADA SOLO CON PDF
async function processOrder() {
    // Obtener y sanitizar datos
    let name = sanitizeInput(document.getElementById('customer-name').value);
    let email = sanitizeInput(document.getElementById('customer-email').value);
    let phone = sanitizeInput(document.getElementById('customer-phone').value);
    let address = sanitizeInput(document.getElementById('customer-address').value);
    
    // Validaciones
    if (!name || !email || !phone || !address) {
        showNotification('Por favor completa todos los campos requeridos', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showNotification('Por favor ingresa un email válido', 'error');
        document.getElementById('customer-email').focus();
        return;
    }

    if (!validatePhone(phone)) {
        showNotification('Por favor ingresa un número de teléfono válido', 'error');
        document.getElementById('customer-phone').focus();
        return;
    }

    const orderNum = generateOrderNumber();
    document.getElementById('order-number').textContent = orderNum;
    
    const totals = calculateCartTotals();
    const greeting = getGreetingByTime();
    
    // Preparar datos para PDF y WhatsApp
    const customerInfo = { name, email, phone, address };
    const pdfData = preparePDFData(cart, customerInfo, orderNum, paymentMethod, totals);
    
    // Generar PDF
    const pdfGenerated = await downloadOrderPDF(pdfData);
    
    if (!pdfGenerated) {
        showNotification('El pedido se procesó pero hubo un error con el PDF', 'error');
    }
    
    // Mensaje de WhatsApp optimizado
    let message = `📋 *SOLICITUD DE PEDIDO - ${BUSINESS_INFO.businessName}*`;
    message += `\n────────────────────────────────────`;
    message += `\n${greeting}, estimado cliente.`;
    message += `\n\n*📦 Pedido N° ${orderNum}*`;
    message += `\n\n*👤 Datos de Contacto:*`;
    message += `\n• Nombre: ${name}`;
    message += `\n• Teléfono: ${phone}`;
    message += `\n• Email: ${email}`;
    message += `\n• Dirección: ${address}`;
    message += `\n\n*💰 Resumen del Pago:*`;
    message += `\n• Total: $${totals.total.toFixed(2)}`;
    message += `\n• Método: ${getPaymentMethodName(paymentMethod)}`;
    message += `\n\n📎 *Se ha generado un PDF con el recibo completo*`;
    message += `\n\nMe comunicaré con usted en los próximos minutos para coordinar el agendamiento.`;
    message += `\n\n⌛ *Tiempo estimado de respuesta: 15-30 minutos*`;
    message += `\n\n¡Agradecemos su preferencia! 🙏`;

    message = encodeURIComponent(message);
    
    // Limpiar carrito y resetear formulario
    cart = [];
    saveCart();
    updateCart();
    document.getElementById('checkout-form').reset();
    
    switchTab('confirmation');
    
    // Abrir WhatsApp después de un breve delay
    setTimeout(() => {
        window.open(`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${message}`, '_blank', 'noopener,noreferrer');
    }, 1500);
}

// Guardar carrito en localStorage
function saveCart() {
    localStorage.setItem('jjrb-cart', JSON.stringify(cart));
}

// Restablecer selectores de versión
function resetVersionSelectors() {
    document.querySelectorAll('.version-select').forEach(select => {
        select.selectedIndex = 0;
    });
}
