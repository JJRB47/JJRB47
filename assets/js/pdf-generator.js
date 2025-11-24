
// =======================================================================
// GENERADOR DE PDF PROFESIONAL
// =======================================================================

// Configuración del PDF
const PDF_CONFIG = {
    margin: 20,
    fontSize: 10,
    headerHeight: 80,
    footerHeight: 50,
    primaryColor: [26, 54, 93],
    accentColor: [212, 175, 55],
    watermark: 'JJRB'
};

// Generar PDF del pedido
function generateOrderPDF(orderData) {
    return new Promise((resolve) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuración inicial
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Agregar marca de agua de fondo
        addWatermark(doc, pageWidth, pageHeight);
        
        // Encabezado
        addHeader(doc, pageWidth, orderData);
        
        let yPosition = PDF_CONFIG.headerHeight;
        
        // Información del pedido
        yPosition = addOrderInfo(doc, yPosition, orderData);
        
        // Datos del cliente
        yPosition = addCustomerInfo(doc, yPosition, orderData);
        
        // Detalle del pedido
        yPosition = addOrderDetails(doc, yPosition, orderData);
        
        // Resumen de pago
        yPosition = addPaymentSummary(doc, yPosition, orderData);
        
        // Mensaje personalizado
        addPersonalMessage(doc, yPosition, orderData);
        
        // Pie de página
        addFooter(doc, pageWidth, pageHeight, orderData);
        
        resolve(doc);
    });
}

// Agregar marca de agua
function addWatermark(doc, pageWidth, pageHeight) {
    doc.setFillColor(240, 240, 240);
    doc.setFontSize(60);
    doc.setTextColor(220, 220, 220);
    doc.setFont(undefined, 'bold');
    
    // Marca de agua en el centro
    const text = PDF_CONFIG.watermark;
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    const y = pageHeight / 2;
    
    doc.text(text, x, y, { angle: 45 });
    
    // Restaurar color
    doc.setTextColor(0, 0, 0);
}

// Encabezado del PDF
function addHeader(doc, pageWidth, orderData) {
    // Fondo del encabezado
    doc.setFillColor(...PDF_CONFIG.primaryColor);
    doc.rect(0, 0, pageWidth, PDF_CONFIG.headerHeight - 20, 'F');
    
    // Logo/Texto principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('JONATHAN JOSE RANGEL BETANCOURT', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Solicitud de Pedido - Servicios de Software', pageWidth / 2, 35, { align: 'center' });
    
    // Línea decorativa
    doc.setDrawColor(...PDF_CONFIG.accentColor);
    doc.setLineWidth(1);
    doc.line(50, 45, pageWidth - 50, 45);
    
    // Restaurar color de texto
    doc.setTextColor(0, 0, 0);
}

// Información del pedido
function addOrderInfo(doc, yPosition, orderData) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('INFORMACIÓN DEL PEDIDO', PDF_CONFIG.margin, yPosition);
    
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Número de Pedido: ${orderData.orderNumber}`, PDF_CONFIG.margin, yPosition);
    yPosition += 6;
    
    doc.text(`Fecha: ${orderData.date}`, PDF_CONFIG.margin, yPosition);
    yPosition += 6;
    
    doc.text(`Hora: ${orderData.time}`, PDF_CONFIG.margin, yPosition);
    yPosition += 15;
    
    return yPosition;
}

// Información del cliente
function addCustomerInfo(doc, yPosition, orderData) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('DATOS DEL CLIENTE', PDF_CONFIG.margin, yPosition);
    
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Nombre: ${orderData.customer.name}`, PDF_CONFIG.margin, yPosition);
    yPosition += 6;
    
    doc.text(`Email: ${orderData.customer.email}`, PDF_CONFIG.margin, yPosition);
    yPosition += 6;
    
    doc.text(`Teléfono: ${orderData.customer.phone}`, PDF_CONFIG.margin, yPosition);
    yPosition += 6;
    
    doc.text(`Dirección: ${orderData.customer.address}`, PDF_CONFIG.margin, yPosition);
    yPosition += 15;
    
    return yPosition;
}

// Detalles del pedido
function addOrderDetails(doc, yPosition, orderData) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('DETALLE DEL PEDIDO', PDF_CONFIG.margin, yPosition);
    
    yPosition += 10;
    
    // Encabezados de la tabla
    doc.setFillColor(240, 240, 240);
    doc.rect(PDF_CONFIG.margin, yPosition, 150, 8, 'F');
    doc.rect(PDF_CONFIG.margin + 150, yPosition, 20, 8, 'F');
    doc.rect(PDF_CONFIG.margin + 170, yPosition, 25, 8, 'F');
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('PRODUCTO', PDF_CONFIG.margin + 2, yPosition + 5);
    doc.text('CANT', PDF_CONFIG.margin + 155, yPosition + 5);
    doc.text('PRECIO', PDF_CONFIG.margin + 180, yPosition + 5);
    
    yPosition += 10;
    
    // Items del pedido
    doc.setFont(undefined, 'normal');
    orderData.items.forEach((item, index) => {
        if (yPosition > 250) { // Nueva página si es necesario
            doc.addPage();
            yPosition = PDF_CONFIG.margin;
            addWatermark(doc, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight());
        }
        
        doc.text(`${index + 1}. ${item.name}`, PDF_CONFIG.margin + 2, yPosition);
        doc.text(`${item.version}`, PDF_CONFIG.margin + 2, yPosition + 4);
        doc.text(`${item.quantity}`, PDF_CONFIG.margin + 160, yPosition + 2);
        doc.text(`$${item.total.toFixed(2)}`, PDF_CONFIG.margin + 182, yPosition + 2);
        
        yPosition += 12;
    });
    
    yPosition += 10;
    return yPosition;
}

// Resumen de pago
function addPaymentSummary(doc, yPosition, orderData) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMEN DE PAGO', PDF_CONFIG.margin, yPosition);
    
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Subtotal: $${orderData.totals.subtotal.toFixed(2)}`, PDF_CONFIG.margin, yPosition);
    yPosition += 6;
    
    if (orderData.totals.discount > 0) {
        doc.setTextColor(255, 107, 107);
        doc.text(`Descuento (${orderData.discountPercentage * 100}%): -$${orderData.totals.discount.toFixed(2)}`, PDF_CONFIG.margin, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 6;
    }
    
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...PDF_CONFIG.accentColor);
    doc.text(`Método de Pago: ${orderData.paymentMethod}`, PDF_CONFIG.margin, yPosition);
    yPosition += 6;
    
    doc.setFontSize(12);
    doc.text(`TOTAL FINAL: $${orderData.totals.total.toFixed(2)}`, PDF_CONFIG.margin, yPosition);
    doc.setTextColor(0, 0, 0);
    
    yPosition += 15;
    return yPosition;
}

// Mensaje personalizado
function addPersonalMessage(doc, yPosition, orderData) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    
    const message = [
        `${orderData.greeting}, estimado cliente.`,
        '',
        'Me comunicaré con usted en los próximos minutos para coordinar',
        'el agendamiento de la instalación y los detalles del pago.',
        '',
        'Tiempo estimado de respuesta: 15-30 minutos',
        '',
        '¡Agradecemos su preferencia!'
    ];
    
    message.forEach(line => {
        if (yPosition > 270) {
            doc.addPage();
            yPosition = PDF_CONFIG.margin;
            addWatermark(doc, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight());
        }
        doc.text(line, PDF_CONFIG.margin, yPosition);
        yPosition += 5;
    });
}

// Pie de página
function addFooter(doc, pageWidth, pageHeight, orderData) {
    const footerY = pageHeight - PDF_CONFIG.footerHeight;
    
    // Línea separadora
    doc.setDrawColor(...PDF_CONFIG.accentColor);
    doc.setLineWidth(0.5);
    doc.line(PDF_CONFIG.margin, footerY, pageWidth - PDF_CONFIG.margin, footerY);
    
    // Información de contacto
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    
    doc.text('Jonathan Jose Rangel Betancourt (JJRB)', pageWidth / 2, footerY + 10, { align: 'center' });
    doc.text(`Teléfono: ${orderData.businessInfo.whatsappNumber} | Email: ${orderData.businessInfo.email}`, pageWidth / 2, footerY + 16, { align: 'center' });
    doc.text('Servicios Profesionales de Software - Todos los derechos reservados', pageWidth / 2, footerY + 22, { align: 'center' });
}

// Función principal para generar y descargar PDF
async function downloadOrderPDF(orderData) {
    try {
        showNotification('Generando PDF profesional...', 'success');
        
        const doc = await generateOrderPDF(orderData);
        const fileName = `Pedido-${orderData.orderNumber}.pdf`;
        
        // Descargar PDF
        doc.save(fileName);
        
        showNotification('PDF generado exitosamente', 'success');
        return true;
        
    } catch (error) {
        console.error('Error generando PDF:', error);
        showNotification('Error al generar el PDF', 'error');
        return false;
    }
}

// Preparar datos para el PDF
function preparePDFData(cart, customerInfo, orderNumber, paymentMethod, totals) {
    const now = new Date();
    
    return {
        orderNumber: orderNumber,
        date: now.toLocaleDateString('es-VE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
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
        greeting: getGreetingByTime(),
        businessInfo: BUSINESS_INFO
    };
}
