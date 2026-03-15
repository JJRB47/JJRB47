// =======================================================================
// emailjs-config.js — JJRB Tienda v3.1
// ⚠️  INSTRUCCIONES DE CONFIGURACIÓN:
//
// 1. Ve a https://www.emailjs.com y crea una cuenta gratuita
//
// 2. En "Email Services" → Add New Service → Gmail (o el que uses)
//    Copia el SERVICE_ID que te da (ej: "service_abc123")
//
// 3. En "Email Templates" → Create New Template
//    Configura la plantilla así:
//      - To email:   rangeljose4747@gmail.com   (tu email)
//      - Subject:    🛒 Nuevo Pedido {{order_number}} — JJRB
//      - Body HTML:  (pega el contenido de abajo)
//    Copia el TEMPLATE_ID (ej: "template_xyz789")
//
// 4. En "Account" → API Keys
//    Copia tu PUBLIC_KEY (ej: "user_AbCdEfGhIjKlMnOp")
//
// 5. Reemplaza los tres valores de abajo con los tuyos y guarda.
//
// PLANTILLA HTML PARA EMAILJS (pega esto en el campo Body del template):
// -----------------------------------------------------------------------
// <h2 style="color:#1a365d">🛒 Nuevo Pedido JJRB</h2>
// <p><strong>N° Pedido:</strong> {{order_number}}</p>
// <p><strong>Fecha:</strong> {{order_date}}</p>
// <hr>
// <h3>👤 Datos del Cliente</h3>
// <p><strong>Nombre:</strong> {{customer_name}}</p>
// <p><strong>Email:</strong> {{customer_email}}</p>
// <p><strong>Teléfono:</strong> {{customer_phone}}</p>
// <p><strong>Ciudad:</strong> {{customer_address}}</p>
// <hr>
// <h3>🛍️ Productos</h3>
// <pre style="background:#f5f5f5;padding:12px;border-radius:6px">{{products_list}}</pre>
// <hr>
// <h3>💰 Resumen de Pago</h3>
// <p><strong>Subtotal:</strong> {{subtotal}}</p>
// <p><strong>Descuento:</strong> {{discount}}</p>
// <p><strong>TOTAL:</strong> <span style="color:#d4af37;font-size:1.2em">{{total}}</span></p>
// <p><strong>Método de pago:</strong> {{payment_method}}</p>
// <hr>
// <p style="color:#888;font-size:0.85em">El PDF del recibo se adjunta automáticamente.</p>
// -----------------------------------------------------------------------
// =======================================================================

const EMAILJS_CONFIG = Object.freeze({
    PUBLIC_KEY:  'TU_PUBLIC_KEY_AQUI',    // ← reemplaza esto
    SERVICE_ID:  'TU_SERVICE_ID_AQUI',    // ← reemplaza esto
    TEMPLATE_ID: 'TU_TEMPLATE_ID_AQUI',   // ← reemplaza esto
    TO_EMAIL:    'rangeljose4747@gmail.com' // tu email destino
});

window.EMAILJS_CONFIG = EMAILJS_CONFIG;
