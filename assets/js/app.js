// =======================================================================
// app.js — JJRB Tienda v2.1  |  Entorno: Navegador (GitHub Pages)
// Estado: ✅ Corregido — Arquitecto de Software Pass
// Cambios: confirm() bloqueante eliminado, sendBeacon a /api/log-error
//          eliminado (ruta inexistente en GitHub Pages), sincronización
//          de window.cart robustecida, logEvent simplificado,
//          safeReload sin confirm(), delegación de eventos consolidada.
// =======================================================================

// ─── Estado de la app ────────────────────────────────────────────────────
let isModalOpen = false;
let currentTab  = 'products';

// ─── Sistema de notificaciones ────────────────────────────────────────────
// Inyectar estilos una sola vez
(function injectNotificationStyles() {
    if (document.getElementById('jjrb-notification-styles')) return;
    const style = document.createElement('style');
    style.id = 'jjrb-notification-styles';
    style.textContent = `
        .custom-notification {
            position: fixed; top: 20px; right: 20px;
            padding: 13px 18px; border-radius: 10px;
            box-shadow: 0 8px 24px rgba(0,0,0,.45);
            z-index: 9999; font-size: .88rem; font-weight: 500;
            max-width: 320px; transform: translateY(-10px); opacity: 0;
            transition: transform .3s ease, opacity .3s ease;
            border: 1px solid rgba(255,255,255,.1);
            backdrop-filter: blur(10px); pointer-events: none;
            font-family: 'Space Grotesk', sans-serif;
        }
        .custom-notification.success { background: rgba(34,197,94,.92);  color: #fff; }
        .custom-notification.error   { background: rgba(239,68,68,.92);  color: #fff; }
        .custom-notification.warning { background: rgba(245,158,11,.92); color: #fff; }
    `;
    document.head.appendChild(style);
})();

function showNotification(message, type = 'success') {
    // Eliminar notificaciones activas
    document.querySelectorAll('.custom-notification').forEach(n => n.remove());

    const icons = { success: '✅', error: '❌', warning: '⚠️' };
    const n = document.createElement('div');
    n.className = `custom-notification ${type}`;
    n.setAttribute('role', 'alert');
    n.setAttribute('aria-live', 'assertive');
    n.setAttribute('aria-atomic', 'true');
    // textContent seguro, luego componer con icono
    n.textContent = `${icons[type] ?? '•'} ${message}`;

    document.body.appendChild(n);
    requestAnimationFrame(() => {
        n.style.transform = 'translateY(0)';
        n.style.opacity   = '1';
    });

    setTimeout(() => {
        n.style.transform = 'translateY(-10px)';
        n.style.opacity   = '0';
        setTimeout(() => n.remove(), 400);
    }, 5000);
}

// ─── Modal ────────────────────────────────────────────────────────────────
function openCartModal() {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    isModalOpen = true;
    document.getElementById('modal-title')?.focus();
    switchTab(currentTab);
}

function closeCartModal() {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    isModalOpen = false;
    document.getElementById('cart-button')?.focus();
    window.resetVersionSelectors?.();
}

// ─── Navegación entre pestañas ────────────────────────────────────────────
function switchTab(tabName) {
    currentTab = tabName;
    const pm   = window.paymentMethod || 'transferencia';

    document.querySelectorAll('.cart-tab').forEach(t => {
        const active = t.getAttribute('data-tab') === tabName;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
    });

    document.querySelectorAll('.cart-section').forEach(s => {
        s.classList.remove('active');
    });

    const section = document.getElementById(`${tabName}-section`);
    if (section) {
        section.classList.add('active');
    }

    // Acciones específicas por tab
    switch (tabName) {
        case 'cart':
            window.updateCartDisplay?.();
            break;

        case 'checkout':
            window.updateOrderSummary?.();
            document.querySelectorAll('.payment-method').forEach(m => {
                const sel = m.getAttribute('data-method') === pm;
                m.classList.toggle('selected', sel);
                m.setAttribute('aria-checked', String(sel));
            });
            setTimeout(() => document.getElementById('customer-name')?.focus(), 80);
            break;

        case 'products': {
            const form = document.getElementById('checkout-form');
            if (form) {
                form.reset();
                form.querySelectorAll('.validation-message').forEach(el => { el.textContent = ''; });
                form.querySelectorAll('.form-input').forEach(el => { el.removeAttribute('aria-invalid'); });
            }
            break;
        }

        case 'confirmation':
            // nada extra
            break;
    }
}

// ─── Validación de campos ─────────────────────────────────────────────────
function validateField(field) {
    const value    = field.value.trim();
    const errorEl  = document.getElementById(`${field.id}-error`);
    if (!errorEl) return true;

    errorEl.textContent = '';
    field.removeAttribute('aria-invalid');

    if (field.required && !value) {
        errorEl.textContent = 'Este campo es requerido';
        field.setAttribute('aria-invalid', 'true');
        return false;
    }

    if (field.type === 'email' && value) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errorEl.textContent = 'Ingresa un email válido';
            field.setAttribute('aria-invalid', 'true');
            return false;
        }
    }

    if (field.id === 'customer-phone' && value) {
        if (!/^[+]?[\d\s\-()]{10,}$/.test(value)) {
            errorEl.textContent = 'Ingresa un teléfono válido';
            field.setAttribute('aria-invalid', 'true');
            return false;
        }
    }

    field.setAttribute('aria-invalid', 'false');
    return true;
}

function validateForm(form) {
    let firstInvalid = null;
    const allValid = Array.from(form.querySelectorAll('input[required]')).every(input => {
        const ok = validateField(input);
        if (!ok && !firstInvalid) firstInvalid = input;
        return ok;
    });
    firstInvalid?.focus();
    return allValid;
}

// ─── Logging (solo consola; sendBeacon eliminado por ruta inexistente) ────
function logEvent(name, data = {}) {
    console.log(`[APP] ${name}`, data);
    if (typeof gtag === 'function') gtag('event', name, data);
}

// ─── Inicialización ───────────────────────────────────────────────────────
function initApp() {
    window.renderProducts?.();
    window.updateCart?.();
    setupEventListeners();

    // Revelar animaciones
    document.querySelectorAll('.fade-in').forEach(el => {
        el.style.opacity = '1';
    });

    const count = window.cart?.length ?? 0;
    if (count > 0) showNotification(`${count} producto(s) en el carrito`);

    document.body.classList.add('app-loaded');
    logEvent('app_ready');
}

// ─── Listeners ────────────────────────────────────────────────────────────
function setupEventListeners() {

    // Botón carrito / tienda
    document.getElementById('cart-button')?.addEventListener('click', openCartModal);

    // Cerrar modal con ×
    document.querySelector('.close-modal')?.addEventListener('click', closeCartModal);

    // Cerrar modal al hacer clic fuera del contenido
    document.getElementById('cart-modal')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) closeCartModal();
    });

    // Cerrar con ESC
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && isModalOpen) closeCartModal();
    });

    // Tabs
    document.querySelectorAll('.cart-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.getAttribute('data-tab')));
        tab.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                switchTab(tab.getAttribute('data-tab'));
            }
        });
    });

    // ── Delegación de eventos — todo en un único listener ──────────────
    document.addEventListener('click', e => {

        // Agregar al carrito
        const addBtn = e.target.closest('.add-to-cart-btn');
        if (addBtn) {
            e.preventDefault();
            const pid = parseInt(addBtn.getAttribute('data-product-id'), 10);
            if (!isNaN(pid)) window.addToCart?.(pid);
            return;
        }

        // Aumentar cantidad
        const incBtn = e.target.closest('.quantity-increase');
        if (incBtn) {
            e.preventDefault();
            const cid = incBtn.getAttribute('data-cart-id');
            if (cid) window.updateQuantity?.(cid, 1);
            return;
        }

        // Disminuir cantidad
        const decBtn = e.target.closest('.quantity-decrease');
        if (decBtn) {
            e.preventDefault();
            const cid = decBtn.getAttribute('data-cart-id');
            if (cid) window.updateQuantity?.(cid, -1);
            return;
        }

        // Eliminar producto — sin confirm() bloqueante
        const remBtn = e.target.closest('.remove-btn');
        if (remBtn) {
            e.preventDefault();
            const cid = remBtn.getAttribute('data-cart-id');
            if (cid) window.removeFromCart?.(cid);
            return;
        }
    });

    // Proceder al pago
    document.getElementById('proceed-checkout')?.addEventListener('click', e => {
        e.preventDefault();
        const cartLen = window.cart?.length ?? 0;
        if (cartLen > 0) {
            switchTab('checkout');
        } else {
            showNotification('Tu carrito está vacío. Agrega productos primero.', 'error');
        }
    });

    // Métodos de pago
    document.querySelectorAll('.payment-method').forEach(m => {
        m.addEventListener('click', () => window.selectPaymentMethod?.(m.getAttribute('data-method')));
        m.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.selectPaymentMethod?.(m.getAttribute('data-method'));
            }
        });
    });

    // Formulario de checkout
    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', async e => {
            e.preventDefault();
            if (!validateForm(form)) {
                showNotification('Por favor corrige los errores en el formulario', 'error');
                return;
            }
            await window.processOrder?.();
        });

        // Validación en tiempo real
        form.querySelectorAll('input[required]').forEach(input => {
            input.addEventListener('blur',  () => validateField(input));
            input.addEventListener('input', () => {
                const err = document.getElementById(`${input.id}-error`);
                if (err) err.textContent = '';
                input.removeAttribute('aria-invalid');
            });
        });
    }

    // Continuar comprando
    document.getElementById('continue-shopping')?.addEventListener('click', e => {
        e.preventDefault();
        switchTab('products');
        closeCartModal();
    });

    // Táctil: mínimo 44px en botones
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
        document.querySelectorAll('button, .link-button').forEach(btn => {
            btn.style.minHeight = '44px';
        });
    }

    logEvent('listeners_ready');
}

// ─── Recarga segura — sin confirm() bloqueante ────────────────────────────
function safeReload() {
    window.location.reload();
}

// ─── Manejo de errores globales ───────────────────────────────────────────
window.addEventListener('error', e => {
    console.error('[APP] Error no capturado:', e.error ?? e.message);
    // sendBeacon eliminado: /api/log-error no existe en GitHub Pages
});

window.addEventListener('unhandledrejection', e => {
    console.error('[APP] Promesa rechazada:', e.reason);
    showNotification('Error en una operación. Intenta de nuevo.', 'error');
});

// ─── Arranque ────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ─── Exports globales ────────────────────────────────────────────────────
Object.assign(window, {
    showNotification,
    openCartModal, closeCartModal,
    switchTab, initApp,
    validateField, validateForm,
    logEvent, safeReload
});
