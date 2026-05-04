// pdf-generator.js — JJRB Tienda v3.1
// Compactación dinámica, una sola hoja garantizada, marca de agua grande y visible
// =======================================================================

const PDF_CONFIG = Object.freeze({
    margin:       10,
    fontSize:     8,
    headerHeight: 32,
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

async function addLogo(doc, pageWidth) {
    try {
        const img = await loadImage(PDF_CONFIG.logoUrl);
        const maxW = 22;
        const logoW = maxW;
        const logoH = img.height * (maxW / img.width);
        doc.addImage(img, 'PNG', PDF_CONFIG.margin, PDF_CONFIG.margin + 2, logoW, logoH);
        return logoW + PDF_CONFIG.margin + 5;
    } catch { return 0; }
}

// MARCA DE AGUA GRANDE Y VISIBLE (sin ángulo problemático)
async function addImageWatermark(doc, pageWidth, pageHeight) {
    try {
        const img = await loadImage(PDF_CONFIG.watermarkUrl);
        const ww = pageWidth * 0.55; // 55% del ancho, muy visible
        const wh = img.height * (ww / img.width);
        const x = (pageWidth - ww) / 2;
        const y = (pageHeight - wh) / 2;
        // Uso seguro de opacidad
        if (doc.setGState) doc.setGState({ opacity: 0.12 });
        doc.addImage(img, 'PNG', x, y, ww, wh);
        if (doc.setGState) doc.setGState({ opacity: 1 });
    } catch (err) {
        pdfLogger.warn('Marca de agua imagen fallida, usando texto grande', err);
        doc.setFontSize(72);
        doc.setTextColor(200, 200, 200);
        doc.setFont('helvetica', 'bold');
        if (doc.setGState) doc.setGState({ opacity: 0.2 });
        const text = PDF_CONFIG.watermark;
        const tW = doc.getTextWidth(text);
        doc.text(text, (pageWidth - tW) / 2, pageHeight / 2, { align: 'center' });
        if (doc.setGState) doc.setGState({ opacity: 1 });
        doc.setTextColor(0, 0, 0);
    }
}

async function addHeader(doc, pageWidth) {
    doc.setFillColor(...PDF_CONFIG.primaryColor);
    doc.rect(0, 0, pageWidth, PDF_CONFIG.headerHeight - 5, 'F');
    doc.setDrawColor(...PDF_CONFIG.accentColor);
    doc.setLineWidth(1.2);
    doc.line(0, 0, pageWidth, 0);

    const logoOffset = await addLogo(doc, pageWidth);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const nameX = logoOffset || PDF_CONFIG.margin;
    doc.text('JONATHAN JOSÉ RANGEL BETANCOURT', nameX, 14);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Desarrollo de Software & Soluciones Tecnológicas', nameX, 20);
    doc.setDrawColor(...PDF_CONFIG.accentColor);
    doc.setLineWidth(0.5);
    doc.line(PDF_CONFIG.margin, 24, pageWidth - PDF_CONFIG.margin, 24);
    doc.setTextColor(0, 0, 0);
}

// Información del pedido dentro del encabezado (ahorra espacio)
function addOrderInfoInHeader(doc, orderData, pageWidth) {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const rightX = pageWidth - PDF_CONFIG.margin;
    doc.text(`Nº Pedido: ${orderData.orderNumber}`, rightX, 11, { align: 'right' });
    doc.text(`Fecha: ${orderData.date}`, rightX, 16, { align: 'right' });
    doc.text(`Hora: ${orderData.time}`, rightX, 21, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text('Estado: Pendiente', rightX, 26, { align: 'right' });
    doc.setTextColor(0, 0, 0);
}

function addCustomerInfo(doc, y, orderData, pageWidth) {
    const m = PDF_CONFIG.margin;
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text('DATOS DEL CLIENTE', m, y);
    y += 4;
    doc.setFillColor(253, 253, 253);
    doc.roundedRect(m, y-2, pageWidth - m*2, 28, 2, 2, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(0,0,0);
    const c = orderData.customer || {};
    doc.text(`Nombre: ${toTitleCase(c.name)}`, m+5, y+3);
    doc.text(`Email: ${c.email || '—'}`, m+5, y+10);
    doc.text(`Teléfono: ${c.phone || '—'}`, pageWidth/2 + 5, y+10);
    doc.text(`Dirección: ${c.address || '—'}`, m+5, y+17);
    return y + 28;
}

// Tabla de productos con wrap automático
function addOrderDetailsCompact(doc, y, orderData, pageWidth, pageHeight) {
    const m = PDF_CONFIG.margin;
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text('DETALLE DEL PEDIDO', m, y);
    y += 4;

    // Cabecera
    doc.setFillColor(...PDF_CONFIG.primaryColor);
    doc.roundedRect(m, y, pageWidth - m*2, 7, 1, 1, 'F');
    doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('PRODUCTO / SERVICIO', m+4, y+4.5);
    doc.text('CANT.', m+130, y+4.5);
    doc.text('PRECIO', m+165, y+4.5);
    y += 7;

    doc.setFont('helvetica', 'normal'); doc.setTextColor(0,0,0);
    let currentY = y;
    const maxWidthName = 110; // Espacio para nombre y versión

    for (let i = 0; i < orderData.items.length; i++) {
        const item = orderData.items[i];
        const nameWithNumber = `${i+1}. ${item.name}`;
        // Dividir nombre si es muy largo
        const lines = doc.splitTextToSize(nameWithNumber, maxWidthName);
        const lineHeight = 4.5;
        const rowHeight = Math.max(8, lines.length * lineHeight + 6);

        // Comprobar espacio restante
        if (currentY + rowHeight + 40 > pageHeight) {
            // Reducción de emergencia
            doc.setFontSize(6);
        }

        doc.setFillColor(i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 251, i % 2 === 0 ? 255 : 252);
        doc.rect(m, currentY, pageWidth - m*2, rowHeight, 'F');

        doc.setFontSize(7);
        doc.text(lines, m+4, currentY + 4);
        doc.setFont('helvetica', 'bold');
        doc.text(String(item.quantity), m+132, currentY + (rowHeight/2), { align: 'center' });
        doc.text(`$${Number(item.total).toFixed(2)}`, m+168, currentY + (rowHeight/2), { align: 'right' });

        // Versión y advertencia
        doc.setFontSize(6); doc.setFont('helvetica', 'italic');
        doc.setTextColor(100,100,100);
        doc.text(`Versión: ${item.version}`, m+8, currentY + rowHeight - 2);
        const lowerName = String(item.name).toLowerCase();
        if (lowerName.includes('windows 7') || lowerName.includes('windows 8')) {
            doc.setFontSize(5.5); doc.setFont('helvetica', 'bold');
            doc.setTextColor(200, 60, 60);
            doc.text('⚠ Sin soporte oficial', m+70, currentY + rowHeight - 2);
        }
        doc.setTextColor(0,0,0);
        currentY += rowHeight;
    }
    doc.setDrawColor(200,200,200);
    doc.line(m, currentY, pageWidth - m, currentY);
    return currentY + 5;
}

// Resumen de pago integrado justo después de la tabla (ahorra espacio vertical)
function addPaymentSummaryCompact(doc, y, orderData, pageWidth) {
    const m = PDF_CONFIG.margin;
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text('RESUMEN DE PAGO', m, y);
    y += 4;
    doc.setFillColor(250,250,250);
    doc.roundedRect(m, y, pageWidth - m*2, 38, 2, 2, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(0,0,0);
    doc.text('Subtotal:', m+10, y+8);
    doc.text(`$${Number(orderData.totals.subtotal).toFixed(2)}`, pageWidth - m - 15, y+8, { align: 'right' });
    let lineY = y+15;
    if (orderData.totals.discount > 0) {
        doc.setTextColor(40,167,69);
        doc.text('Descuento (30%):', m+10, y+15);
        doc.text(`-$${Number(orderData.totals.discount).toFixed(2)}`, pageWidth - m - 15, y+15, { align: 'right' });
        doc.setTextColor(0,0,0);
        lineY = y+22;
    }
    doc.setDrawColor(180,180,180);
    doc.line(m+10, lineY, pageWidth - m - 10, lineY);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...PDF_CONFIG.accentColor);
    doc.text(`Método: ${orderData.paymentMethod}`, m+10, lineY+7);
    doc.setFontSize(9); doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text('TOTAL A PAGAR:', m+10, lineY+14);
    doc.setFontSize(11); doc.setTextColor(220,53,69);
    doc.text(`$${Number(orderData.totals.total).toFixed(2)}`, pageWidth - m - 15, lineY+14, { align: 'right' });
    return lineY + 22;
}

// Datos bancarios y notas en dos columnas para optimizar espacio
function addBankAndNotesTwoColumns(doc, y, orderData, pageWidth, pageHeight) {
    const m = PDF_CONFIG.margin;
    const colWidth = (pageWidth - m*2 - 6) / 2;
    const midX = m + colWidth + 6;

    // Si y está muy abajo, comprimir más
    let fontSize = 7.5;
    let lineHeight = 5.5;
    if (y > pageHeight - 80) {
        fontSize = 6.5;
        lineHeight = 5;
    }

    // Columna izquierda: Datos bancarios
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text('DATOS PARA TRANSFERENCIA', m, y);
    let colY = y + 4;
    doc.setFillColor(240,248,255);
    doc.roundedRect(m, colY-2, colWidth, 36, 2, 2, 'F');
    const bankRows = [
        'Banco: Banco de Venezuela',
        'Titular: Jonathan José Rangel Betancourt',
        'Cédula: 25.175.926',
        'Teléfono: 0412-289-1366',
        'Tipo Cuenta: Corriente'
    ];
    doc.setFontSize(fontSize); doc.setFont('helvetica', 'normal'); doc.setTextColor(0,0,0);
    bankRows.forEach((row, i) => {
        doc.text(row, m+5, colY + 3 + i*lineHeight);
    });

    // Columna derecha: Notas importantes
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.setTextColor(33,37,41);
    doc.text('NOTAS IMPORTANTES', midX, y);
    let notesY = y + 4;
    doc.setFillColor(255,255,255);
    doc.roundedRect(midX, notesY-2, colWidth, 36, 2, 2, 'FD');
    const notes = [
        '✓ Envíe comprobante por WhatsApp',
        '✓ Respuesta 15-30 min tras pago',
        '✓ Garantía 15 días desde instalación',
        '✓ Soporte técnico incluido',
        '✓ Windows 7/8: riesgo del cliente'
    ];
    doc.setFontSize(fontSize); doc.setFont('helvetica', 'normal'); doc.setTextColor(73,80,87);
    notes.forEach((note, i) => {
        doc.text(note, midX+5, notesY + 3 + i*lineHeight);
    });

    let bottomY = Math.max(colY + 38, notesY + 38);

    // Pie de página
    doc.setFontSize(7.5); doc.setFont('helvetica', 'italic');
    doc.setTextColor(...PDF_CONFIG.primaryColor);
    doc.text(`¡${orderData.greeting}, ${toTitleCase(orderData.customer.name)}!`, pageWidth/2, bottomY + 2, { align: 'center' });
    bottomY += 5;
    doc.setFontSize(6.5); doc.setTextColor(108,117,125);
    doc.text('Agradecemos su confianza', pageWidth/2, bottomY, { align: 'center' });
    bottomY += 4;
    doc.text('Desarrollo de Software & Soluciones Tecnológicas', pageWidth/2, bottomY, { align: 'center' });

    doc.setFontSize(5.5); doc.setTextColor(150,150,150);
    doc.text(`Generado: ${new Date().toLocaleString('es-VE')}`, pageWidth/2, pageHeight - 6, { align: 'center' });
}

// Función principal de generación con ajuste dinámico de altura
async function generateOrderPDF(orderData) {
    const jsPDF = getJSPDF();
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();

    await addImageWatermark(doc, pw, ph);
    await addHeader(doc, pw);
    addOrderInfoInHeader(doc, orderData, pw);

    let y = PDF_CONFIG.headerHeight + 2;
    y = addCustomerInfo(doc, y, orderData, pw);
    y = addOrderDetailsCompact(doc, y, orderData, pw, ph);
    y = addPaymentSummaryCompact(doc, y, orderData, pw);
    addBankAndNotesTwoColumns(doc, y, orderData, pw, ph);

    return doc;
}

async function downloadOrderPDF(orderData) {
    try {
        showPDFNotification('Generando PDF profesional (una sola hoja)...', 'info');
        const doc = await generateOrderPDF(orderData);
        const fileName = `JRB-Pedido-${orderData.orderNumber}_${new Date().toISOString().slice(0,10)}.pdf`;
        doc.save(fileName);
        showPDFNotification(`✅ PDF generado correctamente: ${fileName}`);
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

// Inyectar estilos CSS (solo para márgenes visuales, no afecta al PDF)
if (typeof document !== 'undefined' && !document.getElementById('pdf-anim-styles')) {
    const style = document.createElement('style');
    style.id = 'pdf-anim-styles';
    style.textContent = `@keyframes pdfFadeIn{from{opacity:0}to{opacity:1}}`;
    document.head.appendChild(style);
}

// Exportación para navegador y módulos
if (typeof window !== 'undefined') {
    Object.assign(window, { generateOrderPDF, downloadOrderPDF, preparePDFData, toTitleCase });
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateOrderPDF, downloadOrderPDF, preparePDFData, toTitleCase, PDF_CONFIG };
}
