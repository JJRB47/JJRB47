// =======================================================================
// pdf-generator.js — JJRB Tienda v2.1  |  Entorno: Navegador (GitHub Pages)
// Estado: ✅ Corregido — Arquitecto de Software Pass
// Cambios: getPaymentMethodName y getGreetingByTime eliminadas del módulo
//          (se consumen desde window.* definidas en products.js, evitando
//          duplicación y conflictos de redefinición), showPDFNotification
//          delega siempre a window.showNotification, GState verificado
//          antes de usar, animaciones CSS inyectadas una sola vez.
// =======================================================================

const PDF_CONFIG = Object.freeze({
    margin:       15,
    fontSize:     9,
    headerHeight: 50,
    primaryColor: [26, 54, 93],
    accentColor:  [212, 175, 55],
    watermark:    'JJRB',
    logoUrl:      'assets/logo-jrb.png',
    watermarkUrl: 'assets/logo-jrb.png'
});

// ─── Logger ──────────────────────────────────────────────────────────────
const pdfLogger = {
    info:  (msg)        => console.info (`[PDF] ${new Date().toLocaleString('es-VE')}: ${msg}`),
    warn:  (msg, err)   => console.warn (`[PDF] ${new Date().toLocaleString('es-VE')}: ${msg}`, err ?? ''),
    error: (msg, err)   => console.error(`[PDF] ${new Date().toLocaleString('es-VE')}: ${msg}`, err ?? '')
};

// ─── Helper ───────────────────────────────────────────────────────────────
function toTitleCase(str) {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Notificación — delega siempre a window.showNotification ─────────────
function showPDFNotification(message, type = 'success') {
    pdfLogger.info(`${type.toUpperCase()}: ${message}`);
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    }
}

// ─── Obtener jsPDF ────────────────────────────────────────────────────────
function getJSPDF() {
    const JPDF = window.jspdf?.jsPDF ?? window.jsPDF ?? (typeof jsPDF !== 'undefined' ? jsPDF : null);
    if (!JPDF) {
        const msg = 'Biblioteca jsPDF no disponible.';
        showPDFNotification(msg, 'error');
        throw new Error(msg);
    }
    return JPDF;
}

// ─── Cargar imagen ────────────────────────────────────────────────────────
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload  = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = url;
    });
}

// ─── Logo en encabezado ───────────────────────────────────────────────────
async function addLogo(doc) {
    try {
        const img       = await loadImage(PDF_CONFIG.logoUrl);
        const maxW      = 30;
        const logoW     = maxW;
        const logoH     = img.height * (maxW / img.width);
        doc.addImage(img, 'PNG', PDF_CONFIG.margin, PDF_CONFIG.margin + 5, logoW, logoH);
        return logoW + PDF_CONFIG.margin + 10;
    } catch {
        pdfLogger.warn('Logo no cargado, se omite.');
        return 0;
    }
}

// ─── Marca de agua ────────────────────────────────────────────────────────
async function addImageWatermark(doc, pageWidth, pageHeight) {
    try {
        const img = await loadImage(PDF_CONFIG.watermarkUrl);
        const ww  = img.width  * 0.25;
        const wh  = img.height * 0.25;
        const x   = (pageWidth  - ww) / 2;
        const y   = (pageHeight - wh) / 2;

        // GState solo si está disponible en esta versión de jsPDF
        if (doc.GState) {
            doc.setGState(new doc.GState({ opacity: 0.07 }));
        }
        doc.addImage(img, 'PNG', x, y, ww, wh);
        if (doc.GState) {
            doc.setGState(new doc.GState({ opacity: 1.0 }));
        }
    } catch {
        // Fallback: marca de agua de texto
        doc.setFontSize(42);
        doc.setTextColor(235, 236, 240);
        doc.setFont('helvetica', 'bold');
        const text  = PDF_CONFIG.watermark;
        const tW    = doc.getTextWidth(text);
        doc.text(text, (pageWidth - tW) / 2, pageHeight / 2, { angle: 45 });
        doc.setTextColor(0, 0, 0);
    }
}

// ─── Encabezado ───────────────────────────────────────────────────────────
async function addHeader(doc, pageWidth) {
    doc.setFillColor(...PDF_CONFIG.primaryColor);
    doc.rect(0, 0, pageWidth, PDF_CONFIG.headerHeight - 10, 'F');

    doc.setDrawColor(...PDF_CONFIG.accentColor);
    doc.setLineWidth(2);
    doc.line(0, 0, pageWidth, 0);

    const logoOffset = await addLogo(doc);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);

    const nameX = logoOffset || pageWidth / 2;
    const align = logoOffset ? 'left' : 'center';
    doc.text('JONATHAN JOSÉ RANGEL BETANCOURT', nameX, 16, { align });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Desarrollo de Software & Soluciones Tecnológicas', nameX, 24, { align });

    doc.setDrawColor(...PDF_CONFIG.accentColor);
    doc.setLineWidth(0.8);
    doc.line(40, 32, pageWidth - 40, 32);

    doc.setTextColor(0, 0, 0);
}

// ─── Sección: info del pedido ─────────────────────────────────────────────
function addOrderInfo(doc, y, orderData, pageWidth) {
    const m = PDF_CONFIG.margin;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text('INFORMACIÓN DEL PEDIDO', m, y);
    y += 7;

    doc.setFillColor(250, 250, 250);
    doc.roundedRect(m, y - 2, pageWidth - m * 2, 22, 2, 2, 'F');
    doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.2);
    doc.roundedRect(m, y - 2, pageWidth - m * 2, 22, 2, 2, 'S');

    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0);
    doc.text(`Nº Pedido: ${orderData.orderNumber}`, m + 5, y + 4);
    doc.text(`Fecha: ${orderData.date}`, pageWidth / 2, y + 4);
    y += 8;
    doc.text(`Hora: ${orderData.time}`, m + 5, y + 4);
    doc.text('Estado: Pendiente', pageWidth / 2, y + 4);
    return y + 15;
}

// ─── Sección: datos del cliente ───────────────────────────────────────────
function addCustomerInfo(doc, y, orderData, pageWidth) {
    const m = PDF_CONFIG.margin;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text('DATOS DEL CLIENTE', m, y);
    y += 7;

    doc.setFillColor(253, 253, 253);
    doc.roundedRect(m, y - 2, pageWidth - m * 2, 40, 2, 2, 'F');
    doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.2);
    doc.roundedRect(m, y - 2, pageWidth - m * 2, 40, 2, 2, 'S');

    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0);
    const c = orderData.customer;
    doc.text(`Nombre: ${toTitleCase(c.name || 'Cliente')}`, m + 5, y + 4);
    y += 8;
    doc.text(`Email: ${c.email || '—'}`,   m + 5,          y + 4);
    doc.text(`Teléfono: ${c.phone || '—'}`, pageWidth / 2, y + 4);
    y += 8;
    doc.text(`Dirección: ${c.address || '—'}`, m + 5, y + 4);
    return y + 15;
}

// ─── Sección: detalle del pedido ──────────────────────────────────────────
function addOrderDetails(doc, y, orderData, pageWidth, pageHeight) {
    const m = PDF_CONFIG.margin;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text('DETALLE DEL PEDIDO', m, y);
    y += 8;

    doc.setFillColor(240, 242, 245);
    doc.roundedRect(m, y, pageWidth - m * 2, 8, 1, 1, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text('PRODUCTO / SERVICIO', m + 5, y + 5);
    doc.text('CANT.',   m + 120, y + 5);
    doc.text('PRECIO',  m + 160, y + 5);
    y += 10;

    doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0);

    for (let i = 0; i < orderData.items.length; i++) {
        const item = orderData.items[i];
        if (y > pageHeight - 40) {
            doc.addPage();
            addImageWatermark(doc, pageWidth, pageHeight);
            y = PDF_CONFIG.margin + 10;
        }
        doc.setFillColor(i % 2 === 0 ? 252 : 248, i % 2 === 0 ? 252 : 249, i % 2 === 0 ? 252 : 250);
        doc.rect(m, y, pageWidth - m * 2, 10, 'F');

        doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        doc.text(`${i + 1}. ${item.name}`, m + 5, y + 6);
        doc.setFont('helvetica', 'bold');
        doc.text(String(item.quantity), m + 122, y + 6);
        doc.text(`$${item.total.toFixed(2)}`, m + 162, y + 6);

        doc.setFontSize(7); doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text(`Versión: ${item.version}`, m + 5, y + 9.5);

        const lowerName = item.name.toLowerCase();
        if (lowerName.includes('windows 7') || lowerName.includes('windows 8') || lowerName.includes('vista')) {
            doc.setFontSize(6); doc.setFont('helvetica', 'bold');
            doc.setTextColor(220, 53, 69);
            doc.text('⚠ SISTEMA SIN SOPORTE OFICIAL', m + 40, y + 9.5);
        }
        doc.setTextColor(0, 0, 0);
        y += 12;
    }

    doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
    doc.line(m, y, pageWidth - m, y);
    return y + 8;
}

// ─── Sección: resumen de pago ─────────────────────────────────────────────
function addPaymentSummary(doc, y, orderData, pageWidth) {
    const m = PDF_CONFIG.margin;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text('RESUMEN DE PAGO', m, y);
    y += 8;

    doc.setFillColor(250, 250, 250);
    doc.roundedRect(m, y, pageWidth - m * 2, 45, 2, 2, 'F');
    doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
    doc.roundedRect(m, y, pageWidth - m * 2, 45, 2, 2, 'S');

    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0);
    doc.text('Subtotal:', m + 10, y + 8);
    doc.text(`$${orderData.totals.subtotal.toFixed(2)}`, pageWidth - m - 30, y + 8);
    y += 8;

    if (orderData.totals.discount > 0) {
        doc.setTextColor(40, 167, 69);
        doc.text('Descuento (30%):', m + 10, y + 8);
        doc.text(`-$${orderData.totals.discount.toFixed(2)}`, pageWidth - m - 30, y + 8);
        doc.setTextColor(0, 0, 0);
        y += 8;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(m + 10, y + 4, pageWidth - m - 10, y + 4);
    y += 8;

    doc.setFont('helvetica', 'bold'); doc.setTextColor(...PDF_CONFIG.accentColor);
    doc.text(`Método: ${orderData.paymentMethod}`, m + 10, y + 8);
    y += 10;

    doc.setFontSize(12); doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text('TOTAL A PAGAR:', m + 10, y + 8);
    doc.setFontSize(14); doc.setTextColor(220, 53, 69);
    doc.text(`$${orderData.totals.total.toFixed(2)}`, pageWidth - m - 35, y + 8);
    doc.setTextColor(0, 0, 0);
    return y + 20;
}

// ─── Sección: datos bancarios y notas ────────────────────────────────────
function addBankDetailsAndNotes(doc, y, orderData, pageWidth, pageHeight) {
    const m = PDF_CONFIG.margin;
    if (y > pageHeight - 100) {
        doc.addPage();
        addImageWatermark(doc, pageWidth, pageHeight);
        y = m + 10;
    }

    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text('DATOS PARA TRANSFERENCIA / PAGO MÓVIL', m, y);
    y += 8;

    doc.setFillColor(240, 248, 255);
    doc.roundedRect(m, y, pageWidth - m * 2, 40, 3, 3, 'F');
    doc.setDrawColor(26, 54, 93); doc.setLineWidth(0.5);
    doc.roundedRect(m, y, pageWidth - m * 2, 40, 3, 3, 'S');

    const bankRows = [
        ['Banco:',        'Banco de Venezuela'],
        ['Titular:',      'Jonathan José Rangel Betancourt'],
        ['Cédula:',       '25.175.926'],
        ['Teléfono:',     '0412-289-1366'],
        ['Tipo Cuenta:',  'Corriente']
    ];
    doc.setFontSize(9); doc.setTextColor(0, 0, 0);
    bankRows.forEach(([label, val], i) => {
        const ry = y + 8 + i * 7;
        doc.setFont('helvetica', 'bold');  doc.text(label, m + 8, ry);
        doc.setFont('helvetica', 'normal'); doc.text(val, m + 38, ry);
    });
    y += 50;

    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 37, 41);
    doc.text('NOTAS IMPORTANTES', m, y);
    y += 8;

    const notes = [
        '✓ Envíe el comprobante de pago por WhatsApp.',
        '✓ Respuesta en 15–30 minutos tras confirmar el pago.',
        '✓ Garantía: 15 días continuos desde la instalación.',
        '✓ Soporte técnico incluido durante la garantía.',
        '✓ Para Windows 7/8 el cliente asume los riesgos de seguridad.'
    ];
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.setTextColor(73, 80, 87);
    notes.forEach((note, i) => {
        const ny = y + i * 5;
        if (ny > pageHeight - 20) {
            doc.addPage();
            addImageWatermark(doc, pageWidth, pageHeight);
            y = m + 10;
        }
        doc.text(note, m + 5, ny);
    });
    y += 30;

    // Mensaje de cierre
    doc.setFontSize(9); doc.setFont('helvetica', 'italic');
    doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text(`¡${orderData.greeting}, ${toTitleCase(orderData.customer.name || 'cliente')}!`,
        pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(8); doc.setTextColor(108, 117, 125);
    doc.text('Agradecemos su confianza y preferencia.',
        pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.text('Desarrollo de Software & Soluciones Tecnológicas',
        pageWidth / 2, y, { align: 'center' });

    // Pie de página
    doc.setFontSize(7); doc.setTextColor(150, 150, 150);
    doc.text(
        `Documento generado el ${new Date().toLocaleDateString('es-VE')} a las ${new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`,
        pageWidth / 2, pageHeight - 10, { align: 'center' }
    );
}

// ─── Generador principal ──────────────────────────────────────────────────
async function generateOrderPDF(orderData) {
    pdfLogger.info(`Generando PDF: ${orderData.orderNumber}`);
    const jsPDF = getJSPDF();
    const doc   = new jsPDF();

    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();

    await addImageWatermark(doc, pw, ph);
    await addHeader(doc, pw);

    let y = PDF_CONFIG.headerHeight + 5;
    y = addOrderInfo(doc, y, orderData, pw);
    y = addCustomerInfo(doc, y, orderData, pw);
    y = addOrderDetails(doc, y, orderData, pw, ph);
    y = addPaymentSummary(doc, y, orderData, pw);
    addBankDetailsAndNotes(doc, y, orderData, pw, ph);

    pdfLogger.info('PDF generado OK');
    return doc;
}

// ─── Descargar PDF ────────────────────────────────────────────────────────
async function downloadOrderPDF(orderData) {
    try {
        showPDFNotification('Generando PDF…', 'success');
        const doc      = await generateOrderPDF(orderData);
        const fileName = `Pedido-${orderData.orderNumber}_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
        showPDFNotification(`PDF "${fileName}" generado correctamente`);
        return { success: true, fileName };
    } catch (err) {
        pdfLogger.error('Error en downloadOrderPDF:', err);
        showPDFNotification('Error al generar el PDF. Intente nuevamente.', 'error');
        return { success: false, error: err.message };
    }
}

// ─── Preparar datos del PDF ───────────────────────────────────────────────
// NOTA: getPaymentMethodName y getGreetingByTime se consumen desde
//       window.* (definidas en products.js), eliminando la duplicación.
function preparePDFData(cart, customerInfo, orderNumber, paymentMethod, totals) {
    try {
        const now         = new Date();
        const getPayment  = window.getPaymentMethodName ?? (m => m);
        const getGreeting = window.getGreetingByTime    ?? (() => 'Hola');

        return {
            orderNumber: orderNumber || `ORD-${Date.now().toString().slice(-6)}`,
            date: now.toLocaleDateString('es-VE', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            }),
            time: now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            customer: {
                name:    customerInfo?.name?.trim()    || 'Cliente',
                email:   customerInfo?.email?.trim()   || '',
                phone:   customerInfo?.phone?.trim()   || '',
                address: customerInfo?.address?.trim() || 'No especificada'
            },
            items: (cart || []).map((item, i) => ({
                id:       item.id || i + 1,
                name:     item.name         || `Producto ${i + 1}`,
                version:  item.versionName  || 'Estándar',
                quantity: parseInt(item.quantity, 10) || 1,
                price:    parseFloat(item.price)      || 0,
                total:    (parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 1)
            })),
            totals: totals || { subtotal: 0, discount: 0, total: 0 },
            paymentMethod:      getPayment(paymentMethod),
            discountPercentage: paymentMethod === 'efectivo' ? 0.30 : 0,
            greeting:           getGreeting()
        };
    } catch (err) {
        pdfLogger.error('Error en preparePDFData:', err);
        return {
            orderNumber: `ERROR-${Date.now().toString().slice(-6)}`,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            customer: { name: 'Cliente', email: '', phone: '', address: '' },
            items: [], totals: { subtotal: 0, discount: 0, total: 0 },
            paymentMethod: 'No especificado', discountPercentage: 0, greeting: 'Hola'
        };
    }
}

// ─── Inyectar estilos de animación una sola vez ───────────────────────────
(function injectPDFStyles() {
    if (document.getElementById('pdf-anim-styles')) return;
    const s = document.createElement('style');
    s.id = 'pdf-anim-styles';
    s.textContent = `
        @keyframes pdfFadeIn  { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pdfFadeOut { from { opacity:1; transform:translateY(0); }     to { opacity:0; transform:translateY(-10px); } }
    `;
    document.head.appendChild(s);
})();

// ─── Exports globales ─────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
    Object.assign(window, {
        generateOrderPDF, downloadOrderPDF, preparePDFData, toTitleCase
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateOrderPDF, downloadOrderPDF, preparePDFData, toTitleCase, PDF_CONFIG };
}
