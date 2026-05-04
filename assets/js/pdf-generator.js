// pdf-generator.js — JJRB Tienda v2.2 (Una sola página + marca de agua grande)
// =======================================================================

const PDF_CONFIG = Object.freeze({
    margin:       10,               // reducido para más espacio
    fontSize:     8,                // más pequeño pero legible
    headerHeight: 32,               // más compacto
    primaryColor: [26, 54, 93],
    accentColor:  [212, 175, 55],
    watermark:    'JJRB',
    logoUrl:      'assets/logo-jrb.png',
    watermarkUrl: 'assets/logo-jrb.png'
});

const pdfLogger = {
    info:  (msg)      => console.info (`[PDF] ${new Date().toLocaleString('es-VE')}: ${msg}`),
    warn:  (msg, err) => console.warn (`[PDF] ${msg}`, err ?? ''),
    error: (msg, err) => console.error(`[PDF] ${msg}`, err ?? '')
};

function toTitleCase(str) {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function showPDFNotification(message, type = 'success') {
    if (typeof window !== 'undefined' && typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    }
}

function getJSPDF() {
    const JPDF = window?.jspdf?.jsPDF ?? window?.jsPDF ?? (typeof jsPDF !== 'undefined' ? jsPDF : null);
    if (!JPDF) throw new Error('jsPDF no disponible');
    return JPDF;
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

async function addLogo(doc) {
    try {
        const img = await loadImage(PDF_CONFIG.logoUrl);
        const maxW = 25;
        const logoW = maxW;
        const logoH = img.height * (maxW / img.width);
        doc.addImage(img, 'PNG', PDF_CONFIG.margin, PDF_CONFIG.margin + 2, logoW, logoH);
        return logoW + PDF_CONFIG.margin + 8;
    } catch { return 0; }
}

// MARCA DE AGUA GRANDE Y VISIBLE
async function addImageWatermark(doc, pageWidth, pageHeight) {
    try {
        const img = await loadImage(PDF_CONFIG.watermarkUrl);
        // Grande: 45% del ancho de la página (antes 25%)
        const ww = pageWidth * 0.45;
        const wh = img.height * (ww / img.width);
        const x = (pageWidth - ww) / 2;
        const y = (pageHeight - wh) / 2;
        if (doc.GState) doc.setGState(new doc.GState({ opacity: 0.15 })); // más visible
        doc.addImage(img, 'PNG', x, y, ww, wh);
        if (doc.GState) doc.setGState(new doc.GState({ opacity: 1 }));
    } catch (err) {
        pdfLogger.warn('Marca de agua imagen fallida, usando texto grande', err);
        doc.setFontSize(72);
        doc.setTextColor(200, 200, 200);
        doc.setFont('helvetica', 'bold');
        if (doc.GState) doc.setGState(new doc.GState({ opacity: 0.2 }));
        const text = PDF_CONFIG.watermark;
        const tW = doc.getTextWidth(text);
        doc.text(text, (pageWidth - tW) / 2, pageHeight / 2, { angle: 35 });
        if (doc.GState) doc.setGState(new doc.GState({ opacity: 1 }));
        doc.setTextColor(0, 0, 0);
    }
}

async function addHeader(doc, pageWidth) {
    doc.setFillColor(...PDF_CONFIG.primaryColor);
    doc.rect(0, 0, pageWidth, PDF_CONFIG.headerHeight - 5, 'F');
    doc.setDrawColor(...PDF_CONFIG.accentColor);
    doc.setLineWidth(1.5);
    doc.line(0, 0, pageWidth, 0);

    const logoOffset = await addLogo(doc);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const nameX = logoOffset || pageWidth / 2;
    const align = logoOffset ? 'left' : 'center';
    doc.text('JONATHAN JOSÉ RANGEL BETANCOURT', nameX, 14, { align });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Desarrollo de Software & Soluciones Tecnológicas', nameX, 21, { align });
    doc.setDrawColor(...PDF_CONFIG.accentColor);
    doc.setLineWidth(0.5);
    doc.line(40, 26, pageWidth - 40, 26);
    doc.setTextColor(0, 0, 0);
}

// SECCIONES COMPACTAS (todo en una página)
function addOrderInfo(doc, y, orderData, pageWidth) {
    const m = PDF_CONFIG.margin;
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text('INFORMACIÓN DEL PEDIDO', m, y);
    y += 5;
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(m, y-2, pageWidth - m*2, 18, 2, 2, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(0,0,0);
    doc.text(`Nº Pedido: ${orderData.orderNumber}`, m+5, y+4);
    doc.text(`Fecha: ${orderData.date}`, pageWidth/2, y+4);
    doc.text(`Hora: ${orderData.time}`, m+5, y+11);
    doc.text('Estado: Pendiente', pageWidth/2, y+11);
    return y + 20;
}

function addCustomerInfo(doc, y, orderData, pageWidth) {
    const m = PDF_CONFIG.margin;
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text('DATOS DEL CLIENTE', m, y);
    y += 5;
    doc.setFillColor(253, 253, 253);
    doc.roundedRect(m, y-2, pageWidth - m*2, 34, 2, 2, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(0,0,0);
    const c = orderData.customer || {};
    doc.text(`Nombre: ${toTitleCase(c.name)}`, m+5, y+4);
    doc.text(`Email: ${c.email || '—'}`, m+5, y+11);
    doc.text(`Teléfono: ${c.phone || '—'}`, pageWidth/2, y+11);
    doc.text(`Dirección: ${c.address || '—'}`, m+5, y+18);
    return y + 30;
}

function addOrderDetails(doc, y, orderData, pageWidth, pageHeight) {
    const m = PDF_CONFIG.margin;
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text('DETALLE DEL PEDIDO', m, y);
    y += 5;

    // Cabecera de tabla
    doc.setFillColor(240, 242, 245);
    doc.roundedRect(m, y, pageWidth - m*2, 7, 1,1,'F');
    doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text('PRODUCTO', m+5, y+4.5);
    doc.text('CANT.', m+120, y+4.5);
    doc.text('PRECIO', m+160, y+4.5);
    y += 8;

    doc.setFont('helvetica', 'normal'); doc.setTextColor(0,0,0);
    for (let i = 0; i < orderData.items.length; i++) {
        const item = orderData.items[i];
        // Nunca crear nueva página (forzar compactación)
        if (y > pageHeight - 45) {
            // reducción extrema de fuentes si está muy apretado
            doc.setFontSize(6);
        }
        doc.setFillColor(i % 2 === 0 ? 252 : 248, i % 2 === 0 ? 252 : 249, i % 2 === 0 ? 252 : 250);
        doc.rect(m, y, pageWidth - m*2, 11, 'F');
        doc.setFontSize(7);
        doc.text(`${i+1}. ${item.name}`, m+5, y+4);
        doc.setFont('helvetica', 'bold');
        doc.text(String(item.quantity), m+122, y+4);
        doc.text(`$${Number(item.total).toFixed(2)}`, m+162, y+4);
        doc.setFontSize(6); doc.setFont('helvetica', 'italic');
        doc.setTextColor(80,80,80);
        doc.text(`Versión: ${item.version}`, m+5, y+8);
        const lowerName = String(item.name).toLowerCase();
        if (lowerName.includes('windows 7') || lowerName.includes('windows 8')) {
            doc.setFontSize(5); doc.setFont('helvetica', 'bold');
            doc.setTextColor(200, 60, 60);
            doc.text('⚠ Sin soporte oficial', m+45, y+8);
        }
        doc.setTextColor(0,0,0);
        y += 12;
    }
    doc.setDrawColor(200,200,200);
    doc.line(m, y, pageWidth - m, y);
    return y + 5;
}

function addPaymentSummary(doc, y, orderData, pageWidth) {
    const m = PDF_CONFIG.margin;
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text('RESUMEN DE PAGO', m, y);
    y += 5;
    doc.setFillColor(250,250,250);
    doc.roundedRect(m, y, pageWidth - m*2, 40, 2,2,'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(0,0,0);
    doc.text('Subtotal:', m+10, y+7);
    doc.text(`$${Number(orderData.totals.subtotal).toFixed(2)}`, pageWidth - m - 25, y+7);
    if (orderData.totals.discount > 0) {
        doc.setTextColor(40,167,69);
        doc.text('Descuento (30%):', m+10, y+15);
        doc.text(`-$${Number(orderData.totals.discount).toFixed(2)}`, pageWidth - m - 25, y+15);
        doc.setTextColor(0,0,0);
    }
    doc.setDrawColor(180,180,180);
    doc.line(m+10, y+22, pageWidth - m - 10, y+22);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...PDF_CONFIG.accentColor);
    doc.text(`Método: ${orderData.paymentMethod}`, m+10, y+30);
    doc.setFontSize(10); doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text('TOTAL A PAGAR:', m+10, y+37);
    doc.setFontSize(12); doc.setTextColor(220,53,69);
    doc.text(`$${Number(orderData.totals.total).toFixed(2)}`, pageWidth - m - 28, y+37);
    return y + 50;
}

function addBankDetailsAndNotes(doc, y, orderData, pageWidth, pageHeight) {
    const m = PDF_CONFIG.margin;
    // Si no queda espacio, forzar reducción de fuentes en lugar de nueva página
    if (y > pageHeight - 70) {
        doc.setFontSize(7);
    }
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text('DATOS PARA TRANSFERENCIA', m, y);
    y += 5;
    doc.setFillColor(240,248,255);
    doc.roundedRect(m, y, pageWidth - m*2, 38, 2,2,'F');
    const bankRows = [['Banco:', 'Banco de Venezuela'], ['Titular:', 'Jonathan José Rangel Betancourt'], ['Cédula:', '25.175.926'], ['Teléfono:', '0412-289-1366'], ['Tipo Cuenta:', 'Corriente']];
    doc.setFontSize(8); doc.setTextColor(0,0,0);
    bankRows.forEach(([label, val], i) => {
        doc.setFont('helvetica', 'bold'); doc.text(label, m+8, y+6 + i*6);
        doc.setFont('helvetica', 'normal'); doc.text(val, m+38, y+6 + i*6);
    });
    y += 46;

    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.setTextColor(33,37,41);
    doc.text('NOTAS IMPORTANTES', m, y);
    y += 5;
    const notes = ['✓ Envíe comprobante por WhatsApp', '✓ Respuesta 15–30 min tras pago', '✓ Garantía 15 días desde instalación', '✓ Soporte técnico incluido', '✓ Windows 7/8: riesgo del cliente'];
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.setTextColor(73,80,87);
    notes.forEach((note, i) => { doc.text(note, m+5, y + i*5); });
    y += notes.length * 5 + 10;

    doc.setFontSize(8); doc.setFont('helvetica', 'italic');
    doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text(`¡${orderData.greeting}, ${toTitleCase(orderData.customer.name)}!`, pageWidth/2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(7); doc.setTextColor(108,117,125);
    doc.text('Agradecemos su confianza', pageWidth/2, y, { align: 'center' });
    y += 4;
    doc.text('Desarrollo de Software & Soluciones Tecnológicas', pageWidth/2, y, { align: 'center' });

    doc.setFontSize(6); doc.setTextColor(150,150,150);
    doc.text(`Generado: ${new Date().toLocaleString('es-VE')}`, pageWidth/2, pageHeight - 8, { align: 'center' });
}

async function generateOrderPDF(orderData) {
    const jsPDF = getJSPDF();
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();

    await addImageWatermark(doc, pw, ph); // marca de agua grande y visible
    await addHeader(doc, pw);

    let y = PDF_CONFIG.headerHeight + 5;
    y = addOrderInfo(doc, y, orderData, pw);
    y = addCustomerInfo(doc, y, orderData, pw);
    y = addOrderDetails(doc, y, orderData, pw, ph);
    y = addPaymentSummary(doc, y, orderData, pw);
    addBankDetailsAndNotes(doc, y, orderData, pw, ph);

    return doc;
}

async function downloadOrderPDF(orderData) {
    try {
        showPDFNotification('Generando PDF profesional (1 hoja)...', 'success');
        const doc = await generateOrderPDF(orderData);
        const fileName = `Pedido-${orderData.orderNumber}_${new Date().toISOString().slice(0,10)}.pdf`;
        doc.save(fileName);
        showPDFNotification(`✅ PDF generado en una sola hoja: ${fileName}`);
        return { success: true, fileName };
    } catch (err) {
        pdfLogger.error('Error en downloadOrderPDF:', err);
        showPDFNotification('Error al generar el PDF', 'error');
        return { success: false, error: err.message };
    }
}

function preparePDFData(cart, customerInfo, orderNumber, paymentMethod, totals) {
    const now = new Date();
    const getPayment  = window?.getPaymentMethodName ?? (m => m);
    const getGreeting = window?.getGreetingByTime ?? (() => 'Hola');
    return {
        orderNumber: orderNumber || `ORD-${Date.now().toString().slice(-6)}`,
        date: now.toLocaleDateString('es-VE', { weekday:'long', year:'numeric', month:'long', day:'numeric' }),
        time: now.toLocaleTimeString('es-VE', { hour:'2-digit', minute:'2-digit', second:'2-digit' }),
        customer: {
            name: (customerInfo?.name ?? '').trim() || 'Cliente',
            email: (customerInfo?.email ?? '').trim() || '',
            phone: (customerInfo?.phone ?? '').trim() || '',
            address: (customerInfo?.address ?? '').trim() || 'No especificada'
        },
        items: (cart || []).map((item, i) => ({
            id: item.id || i+1,
            name: item.name || `Producto ${i+1}`,
            version: item.versionName || 'Estándar',
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || 0,
            total: (Number(item.price)||0) * (Number(item.quantity)||1)
        })),
        totals: totals || { subtotal:0, discount:0, total:0 },
        paymentMethod: getPayment(paymentMethod),
        greeting: getGreeting()
    };
}

// Inyectar estilos (solo una vez)
if (typeof document !== 'undefined' && !document.getElementById('pdf-anim-styles')) {
    const style = document.createElement('style');
    style.id = 'pdf-anim-styles';
    style.textContent = `@keyframes pdfFadeIn{from{opacity:0}to{opacity:1}}`;
    document.head.appendChild(style);
}

if (typeof window !== 'undefined') {
    Object.assign(window, { generateOrderPDF, downloadOrderPDF, preparePDFData, toTitleCase });
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateOrderPDF, downloadOrderPDF, preparePDFData, toTitleCase, PDF_CONFIG };
}
