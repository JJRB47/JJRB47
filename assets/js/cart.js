[file name]: cart.js
[file content begin]
// =======================================================================
// VARIABLES GLOBALES DEL CARRITO
// =======================================================================

let cart = JSON.parse(localStorage.getItem('jjrb-cart')) || [];
let paymentMethod = 'transferencia';
let orderNumber = parseInt(localStorage.getItem('jjrb-order-number')) || 1;

// =======================================================================
// FUNCIONES DE UTILIDAD
// =======================================================================

// Generar ID único para items del carrito
function getNextCartId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Calcular totales del carrito
function calculateCartTotals() {
    let subtotal = 0;
    
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
    });
    
    let discount = 0;
    let total = subtotal;
    
    if (paymentMethod === 'efectivo') {
        discount = subtotal * BUSINESS_INFO.discountPercentage;
        total = subtotal - discount;
    }
    
    return {
        subtotal: subtotal,
        discount: discount,
        total: total
    };
}

// Obtener saludo según la hora del día
function getGreetingByTime() {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
        return "Buenos días";
    } else if (hour >= 12 && hour < 18) {
        return "Buenas tardes";
    } else {
        return "Buenas noches";
    }
}

// Obtener el nombre del método de pago
function getPaymentMethodName(method) {
    switch(method) {
        case 'transferencia': return 'Transferencia Bancaria';
        case 'paypal': return 'PayPal';
        case 'efectivo': return `Efectivo (${(BUSINESS_INFO.discountPercentage * 100)}% descuento)`;
        default: return 'Transferencia Bancaria';
    }
}

// Preparar datos para el PDF
function preparePDFData(cart, customerInfo, orderNumber, paymentMethod, totals) {
    const now = new Date();
    
    return {
        orderNumber: orderNumber,
        date: now.toLocaleDateString('es-VE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }),
        time: now.toLocaleTimeString('es-VE', {
            hour: '2-digit',
            minute: '2-digit'
        }),
        customer: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: customerInfo.address
        },
        items: cart.map(item => ({
            name: item.name,
            version: item.versionName,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
        })),
        totals: totals,
        paymentMethod: getPaymentMethodName(paymentMethod),
        discountPercentage: BUSINESS_INFO.discountPercentage,
        greeting: getGreetingByTime()
    };
}

// =======================================================================
// FUNCIONES DEL CARRITO
// =======================================================================

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
        // Si ya existe, incrementar cantidad
        cart[existingItemIndex].quantity += 1;
        showNotification(`${product.name} - ${versionName} (cantidad aumentada)`);
    } else {
        // Si no existe, agregar nuevo item
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
    
    if (cartCount > 0) {
        cartCountElement.textContent = `(${cartCount})`;
        cartCountElement.style.display = 'inline';
        if (tabCartCountElement) {
            tabCartCountElement.textContent = `(${cartCount})`;
        }
    } else {
        cartCountElement.style.display = 'none';
        if (tabCartCountElement) {
            tabCartCountElement.textContent = '(0)';
        }
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
        if (proceedCheckoutBtn) {
            proceedCheckoutBtn.disabled = true;
        }
        return;
    }
    
    let cartHTML = '';
    const totals = calculateCartTotals();
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        
        cartHTML += `
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
                        <button class="quantity-decrease" data-cart-id="${item.cartId}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-increase" data-cart-id="${item.cartId}">+</button>
                    </div>
                    <div class="cart-item-price">$${itemTotal.toFixed(2)}</div>
                    <button class="remove-btn" data-cart-id="${item.cartId}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    cartItemsContainer.innerHTML = cartHTML;
    
    // Calcular descuento si es pago en efectivo
    if (paymentMethod === 'efectivo') {
        document.getElementById('discount-row').classList.remove('hidden');
        document.getElementById('discount-amount').textContent = `-$${totals.discount.toFixed(2)}`;
    } else {
        document.getElementById('discount-row').classList.add('hidden');
    }
    
    document.getElementById('subtotal').textContent = `$${totals.subtotal.toFixed(2)}`;
    document.getElementById('total').textContent = `$${totals.total.toFixed(2)}`;
    if (proceedCheckoutBtn) {
        proceedCheckoutBtn.disabled = false;
    }
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
        
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
        }
        return;
    }
    
    let orderHTML = '';
    const totals = calculateCartTotals();
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        
        orderHTML += `
            <div class="order-item">
                <span>${item.name} - ${item.versionName} x${item.quantity}</span>
                <span>$${itemTotal.toFixed(2)}</span>
            </div>
        `;
    });
    
    // Calcular descuento si es pago en efectivo
    if (paymentMethod === 'efectivo') {
        document.getElementById('order-discount-row').classList.remove('hidden');
        document.getElementById('order-discount').textContent = `-$${totals.discount.toFixed(2)}`;
    } else {
        document.getElementById('order-discount-row').classList.add('hidden');
    }
    
    orderItemsContainer.innerHTML = orderHTML;
    document.getElementById('order-subtotal').textContent = `$${totals.subtotal.toFixed(2)}`;
    document.getElementById('order-total').textContent = `$${totals.total.toFixed(2)}`;
    
    if (checkoutBtn) {
        checkoutBtn.disabled = false;
    }
}

// Seleccionar método de pago
function selectPaymentMethod(method) {
    paymentMethod = method;
    
    document.querySelectorAll('.payment-method').forEach(pm => {
        pm.classList.remove('selected');
    });
    
    const selectedMethod = document.querySelector(`.payment-method[data-method="${method}"]`);
    if (selectedMethod) {
        selectedMethod.classList.add('selected');
    }
    
    updateCartDisplay();
    updateOrderSummary();
}

// Procesar pedido - VERSIÓN ACTUALIZADA CON PDF Y CORREO
async function processOrder() {
    const name = document.getElementById('customer-name').value;
    const email = document.getElementById('customer-email').value;
    const phone = document.getElementById('customer-phone').value;
    const address = document.getElementById('customer-address').value;
    
    if (!name || !email || !phone || !address) {
        showNotification('Por favor completa todos los campos requeridos', 'error');
        return;
    }

    const orderNum = `JJRB-${String(orderNumber).padStart(4, '0')}`;
    document.getElementById('order-number').textContent = orderNum;
    
    orderNumber++;
    localStorage.setItem('jjrb-order-number', orderNumber);
    
    const totals = calculateCartTotals();
    const greeting = getGreetingByTime();
    
    // Preparar datos para PDF y WhatsApp
    const customerInfo = { name, email, phone, address };
    const pdfData = preparePDFData(cart, customerInfo, orderNum, paymentMethod, totals);
    
    // Generar PDF y enviar por correo
    const emailSent = await handlePDFAndEmail(pdfData);
    
    if (!emailSent) {
        showNotification('PDF generado pero error enviando correo', 'error');
    }
    
    // Mensaje de WhatsApp (más corto ya que el PDF contiene los detalles)
    let message = `📋 *SOLICITUD DE PEDIDO - ${BUSINESS_INFO.businessName}*`;
    message += `\n────────────────────────────────────`;
    message += `\n${greeting}, estimado cliente.`;
    message += `\n\n*📦 Se ha generado su pedido N° ${orderNum}*`;
    message += `\n\n*👤 Datos de Contacto:*`;
    message += `\n• Nombre: ${name}`;
    message += `\n• Teléfono: ${phone}`;
    message += `\n\n*💰 Resumen del Pago:*`;
    message += `\n• Total: $${totals.total.toFixed(2)}`;
    message += `\n• Método: ${getPaymentMethodName(paymentMethod)}`;
    message += `\n\n📎 *Se ha generado un PDF con el recibo completo*`;
    message += `\n\nMe comunicaré con usted en los próximos minutos para coordinar el agendamiento de la instalación.`;
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
        window.open(`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${message}`, '_blank');
    }, 2000);
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
[file content end]
