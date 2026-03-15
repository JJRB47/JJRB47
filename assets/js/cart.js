// =======================================================================
// cart.js — JJRB Tienda v3.0
// Items del carrito con logo SVG real de Windows/Office
// =======================================================================

let cart          = [];
let paymentMethod = 'transferencia';

// Cargar localStorage
(function loadCart() {
    try {
        const raw = localStorage.getItem('jjrb-cart');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) cart = parsed;
        }
    } catch (err) {
        console.warn('[CART] Error cargando carrito:', err);
        cart = [];
    }
})();

const cartLogger = {
    info:  (msg)        => console.info (`[CART] ${new Date().toISOString()}: ${msg}`),
    warn:  (msg)        => console.warn (`[CART] ${new Date().toISOString()}: ${msg}`),
    error: (msg, error) => console.error(`[CART] ${new Date().toISOString()}: ${msg}`, error)
};

function getNextCartId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
}

function calculateCartTotals() {
    try {
        const subtotal    = cart.reduce((s, i) => s + (i.price||0) * (i.quantity||1), 0);
        const discPct     = window.BUSINESS_INFO?.discountPercentage ?? 0.30;
        const discount    = paymentMethod === 'efectivo' ? subtotal * discPct : 0;
        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            discount: parseFloat(discount.toFixed(2)),
            total:    parseFloat((subtotal - discount).toFixed(2))
        };
    } catch (err) {
        cartLogger.error('calculateCartTotals:', err);
        return { subtotal: 0, discount: 0, total: 0 };
    }
}

function getCartItem(cartId) {
    return cart.find(i => i.cartId === cartId) || null;
}

// ─── Agregar ───────────────────────────────────────────────────────────
function addToCart(productId) {
    try {
        const product = window.getProductById?.(productId);
        if (!product) { showNotification('Producto no encontrado', 'error'); return; }

        const select = document.getElementById(`version-select-${productId}`);
        if (!select) { showNotification('Selector de versión no encontrado', 'error'); return; }

        const opt         = select.options[select.selectedIndex];
        const versionId   = opt.value;
        const price       = parseFloat(opt.getAttribute('data-price'));
        const versionName = opt.text.split(' — ')[0].trim() || 'Versión no especificada';

        if (!versionId || isNaN(price)) { showNotification('Datos de producto inválidos', 'error'); return; }

        const idx = cart.findIndex(i => i.productId === productId && i.versionId === versionId);
        if (idx !== -1) {
            if (cart[idx].quantity >= 99) { showNotification('Cantidad máxima: 99', 'warning'); return; }
            cart[idx].quantity += 1;
            showNotification(`${product.name} — ${versionName} (cantidad aumentada)`);
        } else {
            cart.push({
                cartId:       getNextCartId(),
                productId,
                name:         product.name,
                versionId,
                versionName,
                price,
                // guardamos el SVG para mostrarlo en el carrito
                svgLogo:      product.svgLogo || '',
                logoBgClass:  product.logoBgClass || '',
                icon:         product.icon,
                iconClass:    product.iconClass,
                quantity:     1,
                addedAt:      new Date().toISOString()
            });
            showNotification(`${product.name} — ${versionName} agregado`);
        }

        saveCart(); updateCart(); updateCartDisplay(); animateCartButton();

    } catch (err) {
        cartLogger.error('addToCart:', err);
        showNotification('Error al agregar al carrito', 'error');
    }
}

function animateCartButton() {
    const btn = document.getElementById('cart-button');
    if (!btn) return;
    btn.classList.add('pulse');
    setTimeout(() => btn.classList.remove('pulse'), 400);
}

// ─── Cantidad ──────────────────────────────────────────────────────────
function updateQuantity(cartId, change) {
    try {
        const item = getCartItem(cartId);
        if (!item) { showNotification('Ítem no encontrado', 'error'); return; }
        const nq = item.quantity + change;
        if (nq <= 0)   { removeFromCart(cartId); return; }
        if (nq > 99)   { showNotification('Máximo 99 por producto', 'warning'); return; }
        item.quantity = nq;
        saveCart(); updateCart(); updateCartDisplay();
        if (document.getElementById('checkout-section')?.classList.contains('active'))
            updateOrderSummary();
    } catch (err) {
        cartLogger.error('updateQuantity:', err);
        showNotification('Error al actualizar cantidad', 'error');
    }
}

// ─── Eliminar ──────────────────────────────────────────────────────────
function removeFromCart(cartId) {
    try {
        const idx = cart.findIndex(i => i.cartId === cartId);
        if (idx === -1) { showNotification('Ítem no encontrado', 'error'); return; }
        const removed = cart.splice(idx, 1)[0];
        saveCart(); updateCart(); updateCartDisplay();
        if (document.getElementById('checkout-section')?.classList.contains('active'))
            updateOrderSummary();
        showNotification(`${removed.name} — ${removed.versionName} eliminado`);
    } catch (err) {
        cartLogger.error('removeFromCart:', err);
        showNotification('Error al eliminar producto', 'error');
    }
}

function clearCart() {
    if (!cart.length) return;
    cart = [];
    saveCart(); updateCart(); updateCartDisplay(); updateOrderSummary();
    showNotification('Carrito vaciado', 'success');
}

// ─── Actualizar contador ────────────────────────────────────────────────
function updateCart() {
    try {
        const count      = cart.reduce((t, i) => t + (i.quantity||1), 0);
        const countEl    = document.getElementById('cart-count');
        const tabCountEl = document.getElementById('tab-cart-count');
        const proceedBtn = document.getElementById('proceed-checkout');

        if (countEl) { countEl.textContent = count; countEl.style.display = count > 0 ? 'inline' : 'none'; }
        if (tabCountEl) tabCountEl.textContent = `(${count})`;
        if (proceedBtn) {
            proceedBtn.disabled = count === 0;
            proceedBtn.setAttribute('aria-disabled', String(count === 0));
        }
        document.title = count > 0
            ? `(${count}) JJRB | Windows & Office`
            : 'JJRB | Windows & Office — Jonathan Rangel Betancourt';

        window.cart          = cart;
        window.paymentMethod = paymentMethod;
    } catch (err) {
        cartLogger.error('updateCart:', err);
    }
}

// ─── Display del carrito con logos SVG ─────────────────────────────────
function updateCartDisplay() {
    try {
        const container  = document.getElementById('cart-items');
        const proceedBtn = document.getElementById('proceed-checkout');
        if (!container) return;

        if (!cart.length) {
            container.innerHTML = `
                <div class="empty-cart-message" role="status" aria-live="polite">
                    <div class="empty-cart-icon"><i class="fas fa-shopping-cart" aria-hidden="true"></i></div>
                    <h3>Tu carrito está vacío</h3>
                    <p>Agrega productos para continuar.</p>
                </div>`;
            _setTotals('subtotal','total','discount-row','discount-amount', 0, 0);
            if (proceedBtn) { proceedBtn.disabled = true; proceedBtn.setAttribute('aria-disabled','true'); }
            return;
        }

        const totals   = calculateCartTotals();
        const fragment = document.createDocumentFragment();

        cart.forEach(item => {
            const itemTotal = (item.price||0) * (item.quantity||1);
            const isMin     = item.quantity <= 1;

            const el = document.createElement('div');
            el.className = 'cart-item';
            el.setAttribute('role', 'listitem');

            // Logo SVG o icono FontAwesome como fallback
            const logoHTML = item.svgLogo
                ? `<div class="cart-item-logo ${_esc(item.logoBgClass||'')}">
                     <img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(item.svgLogo)}"
                          alt="" aria-hidden="true" width="28" height="28">
                   </div>`
                : `<div class="cart-item-logo" style="background:rgba(212,175,55,0.1)">
                     <i class="${_esc(item.icon||'fas fa-box')} ${_esc(item.iconClass||'')}"
                        aria-hidden="true" style="font-size:1.4rem;"></i>
                   </div>`;

            el.innerHTML = `
                <div class="cart-item-info">
                    ${logoHTML}
                    <div class="cart-item-details">
                        <div class="cart-item-name"></div>
                        <div class="cart-item-version"></div>
                    </div>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-control" aria-label="Cantidad">
                        <button class="quantity-decrease" data-cart-id="${_esc(item.cartId)}"
                                aria-label="Disminuir" ${isMin ? 'disabled' : ''}>
                            <i class="fas fa-minus" aria-hidden="true"></i>
                        </button>
                        <span aria-live="polite">${item.quantity}</span>
                        <button class="quantity-increase" data-cart-id="${_esc(item.cartId)}"
                                aria-label="Aumentar">
                            <i class="fas fa-plus" aria-hidden="true"></i>
                        </button>
                    </div>
                    <div class="cart-item-price">$${itemTotal.toFixed(2)}</div>
                    <button class="remove-btn" data-cart-id="${_esc(item.cartId)}" aria-label="Eliminar">
                        <i class="fas fa-trash" aria-hidden="true"></i>
                    </button>
                </div>`;

            // textContent seguro para nombre y versión
            el.querySelector('.cart-item-name').textContent    = item.name || '';
            el.querySelector('.cart-item-version').textContent = item.versionName || '';
            fragment.appendChild(el);
        });

        container.innerHTML = '';
        container.appendChild(fragment);
        _setTotals('subtotal','total','discount-row','discount-amount', totals.subtotal, totals.discount);
        if (proceedBtn) { proceedBtn.disabled = false; proceedBtn.setAttribute('aria-disabled','false'); }

    } catch (err) {
        cartLogger.error('updateCartDisplay:', err);
    }
}

// ─── Resumen del pedido ─────────────────────────────────────────────────
function updateOrderSummary() {
    try {
        const container = document.getElementById('order-items');
        const submitBtn = document.querySelector('#checkout-form button[type="submit"]');
        if (!container) return;

        if (!cart.length) {
            container.innerHTML = `
                <div class="empty-cart-checkout" role="status">
                    <div class="empty-cart-icon"><i class="fas fa-shopping-cart" aria-hidden="true"></i></div>
                    <h3>No hay productos en el carrito</h3>
                </div>`;
            _setTotals('order-subtotal','order-total','order-discount-row','order-discount', 0, 0);
            if (submitBtn) { submitBtn.disabled = true; submitBtn.setAttribute('aria-disabled','true'); }
            return;
        }

        const totals   = calculateCartTotals();
        const fragment = document.createDocumentFragment();

        cart.forEach(item => {
            const total = (item.price||0) * (item.quantity||1);
            const row   = document.createElement('div');
            row.className = 'order-item';
            row.setAttribute('role', 'listitem');
            const label = document.createElement('span');
            label.textContent = `${item.name} — ${item.versionName} x${item.quantity}`;
            const price = document.createElement('span');
            price.textContent = `$${total.toFixed(2)}`;
            price.style.fontWeight = '700';
            price.style.color = 'var(--accent-color)';
            row.append(label, price);
            fragment.appendChild(row);
        });

        container.innerHTML = '';
        container.appendChild(fragment);
        _setTotals('order-subtotal','order-total','order-discount-row','order-discount', totals.subtotal, totals.discount);
        if (submitBtn) { submitBtn.disabled = false; submitBtn.setAttribute('aria-disabled','false'); }

    } catch (err) {
        cartLogger.error('updateOrderSummary:', err);
    }
}

// ─── Método de pago ─────────────────────────────────────────────────────
function selectPaymentMethod(method) {
    try {
        const valid   = ['transferencia', 'paypal', 'efectivo'];
        paymentMethod = valid.includes(method) ? method : 'transferencia';
        window.paymentMethod = paymentMethod;

        document.querySelectorAll('.payment-method').forEach(el => {
            const sel = el.getAttribute('data-method') === paymentMethod;
            el.classList.toggle('selected', sel);
            el.setAttribute('aria-checked', String(sel));
        });
        updateCartDisplay();
        updateOrderSummary();
    } catch (err) {
        cartLogger.error('selectPaymentMethod:', err);
    }
}

// ─── Procesar pedido ────────────────────────────────────────────────────
async function processOrder() {
    try {
        if (!cart.length) { showNotification('El carrito está vacío', 'error'); return; }

        let name    = document.getElementById('customer-name')?.value.trim()    || '';
        let email   = document.getElementById('customer-email')?.value.trim()   || '';
        let phone   = document.getElementById('customer-phone')?.value.trim()   || '';
        let address = document.getElementById('customer-address')?.value.trim() || '';

        if (!name || !email || !phone || !address) {
            showNotification('Por favor completa todos los campos', 'error'); return;
        }
        if (window.validateEmail && !window.validateEmail(email)) {
            showNotification('Email inválido', 'error');
            document.getElementById('customer-email')?.focus(); return;
        }
        if (window.validatePhone && !window.validatePhone(phone)) {
            showNotification('Teléfono inválido', 'error');
            document.getElementById('customer-phone')?.focus(); return;
        }

        if (window.sanitizeName)  name    = window.sanitizeName(name);
        if (window.sanitizeEmail) email   = window.sanitizeEmail(email);
        if (window.sanitizePhone) phone   = window.sanitizePhone(phone);
        if (window.sanitizeInput) address = window.sanitizeInput(address);

        const orderNum     = window.generateOrderNumber?.() ?? `JJRB-${Date.now()}`;
        const totals       = calculateCartTotals();
        const greeting     = window.getGreetingByTime?.() ?? 'Hola';
        const customerInfo = { name, email, phone, address };
        const orderNumEl   = document.getElementById('order-number');
        if (orderNumEl) orderNumEl.textContent = orderNum;

        // PDF
        let pdfGenerated = false;
        if (typeof window.downloadOrderPDF === 'function') {
            try {
                const pdfData = window.preparePDFData?.(cart, customerInfo, orderNum, paymentMethod, totals);
                if (pdfData) {
                    const r = await window.downloadOrderPDF(pdfData);
                    pdfGenerated = r?.success === true;
                }
            } catch (pdfErr) {
                cartLogger.warn(`PDF error: ${pdfErr.message}`);
                showNotification('Continuando sin PDF...', 'warning');
            }
        }

        // WhatsApp
        const biz     = window.BUSINESS_INFO ?? {};
        const waNum   = biz.whatsappNumber ?? '584122891366';
        const bizName = biz.businessName   ?? 'JJRB';
        const pmName  = window.getPaymentMethodName?.(paymentMethod) ?? paymentMethod;

        let msg = `📋 *PEDIDO — ${bizName}*\n${'─'.repeat(36)}\n${greeting}, aquí mi pedido:\n\n`;
        msg    += `*📦 N° ${orderNum}*\n\n*👤 Datos:*\n`;
        msg    += `• Nombre: ${name}\n• Teléfono: ${phone}\n• Email: ${email}\n• Ciudad: ${address}\n\n`;
        msg    += `*🛒 Productos:*\n`;
        cart.forEach((item, i) => {
            msg += `${i+1}. ${item.name} — ${item.versionName} x${item.quantity} = $${(item.price*item.quantity).toFixed(2)}\n`;
        });
        msg += `\n*💰 Pago:*\n`;
        msg += `• Subtotal: $${totals.subtotal.toFixed(2)}\n`;
        if (paymentMethod === 'efectivo') msg += `• Descuento 30%: -$${totals.discount.toFixed(2)}\n`;
        msg += `• Total: $${totals.total.toFixed(2)}\n• Método: ${pmName}\n`;
        if (pdfGenerated) msg += `\n📎 Se adjunta PDF con el recibo\n`;
        msg += `\n⌛ ¡Gracias por su preferencia!`;

        // Limpiar
        cart = [];
        saveCart(); updateCart();
        const form = document.getElementById('checkout-form');
        if (form) {
            form.reset();
            form.querySelectorAll('.validation-message').forEach(el => { el.textContent = ''; });
            form.querySelectorAll('.form-input').forEach(el => { el.removeAttribute('aria-invalid'); });
        }

        window.switchTab?.('confirmation');
        showNotification('¡Pedido confirmado!', 'success');

        setTimeout(() => {
            window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
        }, 1200);

    } catch (err) {
        cartLogger.error('processOrder:', err);
        showNotification('Error al procesar el pedido. Intenta de nuevo.', 'error');
    }
}

// ─── Guardar ────────────────────────────────────────────────────────────
function saveCart() {
    try {
        localStorage.setItem('jjrb-cart', JSON.stringify(cart));
    } catch (err) {
        cartLogger.warn(`localStorage lleno: ${err.message}`);
        try {
            localStorage.setItem('jjrb-cart-backup', JSON.stringify(
                cart.map(({productId, versionId, quantity}) => ({productId, versionId, quantity}))
            ));
        } catch { /* silent */ }
    }
}

function resetVersionSelectors() {
    document.querySelectorAll('.version-select').forEach(s => { s.selectedIndex = 0; });
}

// ─── Helpers privados ────────────────────────────────────────────────────
function _setTotals(subtotalId, totalId, discRowId, discAmtId, subtotal, discount) {
    const s = document.getElementById(subtotalId);
    const t = document.getElementById(totalId);
    const r = document.getElementById(discRowId);
    const d = document.getElementById(discAmtId);
    if (s) s.textContent = `$${subtotal.toFixed(2)}`;
    if (t) t.textContent = `$${(subtotal - discount).toFixed(2)}`;
    if (r) r.classList.toggle('hidden', discount === 0);
    if (d) d.textContent = `-$${discount.toFixed(2)}`;
}

function _esc(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Exports ──────────────────────────────────────────────────────────────
Object.assign(window, {
    cart, paymentMethod,
    addToCart, updateQuantity, removeFromCart, clearCart,
    updateCart, updateCartDisplay, updateOrderSummary,
    selectPaymentMethod, processOrder, saveCart,
    resetVersionSelectors, calculateCartTotals, getCartItem
});
