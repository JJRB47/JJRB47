// =======================================================================
// GENERADOR DE PDF PROFESIONAL - VERSIÓN OPTIMIZADA
// =======================================================================

// Configuración del PDF
const PDF_CONFIG = {
    margin: 15,
    fontSize: 9,
    headerHeight: 50,
    primaryColor: [26, 54, 93],
    accentColor: [212, 175, 55],
    watermark: 'JJRB'
};

// Verificar disponibilidad de jspdf de forma segura
function getJSPDF() {
    if (typeof window !== 'undefined' && window.jspdf) {
        return window.jspdf.jsPDF;
    }
    throw new Error('jspdf no está disponible. Verifica que el script esté cargado correctamente.');
}

// Generar PDF del pedido - VERSIÓN SEGURA
function generateOrderPDF(orderData) {
    return new Promise((resolve, reject) => {
        try {
            const jsPDF = getJSPDF();
            const doc = new jsPDF();
            
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            // Agregar marca de agua
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
            
            resolve(doc);
        } catch (error) {
            reject(error);
        }
    });
}

// Agregar marca de agua
function addWatermark(doc, pageWidth, pageHeight) {
    doc.setFillColor(245, 245, 245);
    doc.setFontSize(40);
    doc.setTextColor(230, 230, 230);
    doc.setFont(undefined, 'bold');
    
    const text = PDF_CONFIG.watermark;
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    const y = pageHeight / 2;
    
    doc.text(text, x, y, { angle: 45 });
    doc.setTextColor(0, 0, 0);
}

// Encabezado del PDF
function addHeader(doc, pageWidth, orderData) {
    // Fondo del encabezado
    doc.setFillColor(...PDF_CONFIG.primaryColor);
    doc.rect(0, 0, pageWidth, PDF_CONFIG.headerHeight - 10, 'F');
    
    // Logo/Texto principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('JONATHAN JOSE RANGEL BETANCOURT', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('Solicitud de Pedido - Servicios de Software', pageWidth / 2, 22, { align: 'center' });
    
    // Línea decorativa
    doc.setDrawColor(...PDF_CONFIG.accentColor);
    doc.setLineWidth(0.8);
    doc.line(30, 28, pageWidth - 30, 28);
    
    doc.setTextColor(0, 0, 0);
}

// Información del pedido
function addOrderInfo(doc, yPosition, orderData) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('INFORMACIÓN DEL PEDIDO', PDF_CONFIG.margin, yPosition);
    
    yPosition += 6;
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`Número: ${orderData.orderNumber}`, PDF_CONFIG.margin, yPosition);
    doc.text(`Fecha: ${orderData.date}`, pageWidth / 2, yPosition);
    yPosition += 4;
    
    doc.text(`Hora: ${orderData.time}`, PDF_CONFIG.margin, yPosition);
    yPosition += 8;
    
    return yPosition;
}

// Información del cliente
function addCustomerInfo(doc, yPosition, orderData) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('DATOS DEL CLIENTE', PDF_CONFIG.margin, yPosition);
    
    yPosition += 6;
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`Nombre: ${orderData.customer.name}`, PDF_CONFIG.margin, yPosition);
    yPosition += 4;
    
    doc.text(`Email: ${orderData.customer.email}`, PDF_CONFIG.margin, yPosition);
    doc.text(`Teléfono: ${orderData.customer.phone}`, pageWidth / 2, yPosition);
    yPosition += 4;
    
    doc.text(`Dirección: ${orderData.customer.address}`, PDF_CONFIG.margin, yPosition);
    yPosition += 8;
    
    return yPosition;
}

// Detalles del pedido
function addOrderDetails(doc, yPosition, orderData) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('DETALLE DEL PEDIDO', PDF_CONFIG.margin, yPosition);
    
    yPosition += 6;
    
    // Encabezados de la tabla
    doc.setFillColor(240, 240, 240);
    doc.rect(PDF_CONFIG.margin, yPosition, 120, 6, 'F');
    doc.rect(PDF_CONFIG.margin + 120, yPosition, 20, 6, 'F');
    doc.rect(PDF_CONFIG.margin + 140, yPosition, 25, 6, 'F');
    
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.text('PRODUCTO', PDF_CONFIG.margin + 2, yPosition + 4);
    doc.text('CANT', PDF_CONFIG.margin + 125, yPosition + 4);
    doc.text('PRECIO', PDF_CONFIG.margin + 150, yPosition + 4);
    
    yPosition += 8;
    
    // Items del pedido
    doc.setFont(undefined, 'normal');
    orderData.items.forEach((item, index) => {
        if (yPosition > 240) {
            doc.addPage();
            yPosition = PDF_CONFIG.margin;
            addWatermark(doc, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight());
        }
        
        doc.text(`${index + 1}. ${item.name}`, PDF_CONFIG.margin + 2, yPosition);
        doc.text(`${item.quantity}`, PDF_CONFIG.margin + 128, yPosition);
        doc.text(`$${item.total.toFixed(2)}`, PDF_CONFIG.margin + 152, yPosition);
        
        yPosition += 3;
        doc.setFontSize(6);
        doc.text(`${item.version}`, PDF_CONFIG.margin + 5, yPosition);
        doc.setFontSize(8);
        
        yPosition += 6;
    });
    
    yPosition += 5;
    return yPosition;
}

// Resumen de pago
function addPaymentSummary(doc, yPosition, orderData) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMEN DE PAGO', PDF_CONFIG.margin, yPosition);
    
    yPosition += 6;
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`Subtotal: $${orderData.totals.subtotal.toFixed(2)}`, PDF_CONFIG.margin, yPosition);
    yPosition += 4;
    
    if (orderData.totals.discount > 0) {
        doc.setTextColor(255, 107, 107);
        doc.text(`Descuento (30%): -$${orderData.totals.discount.toFixed(2)}`, PDF_CONFIG.margin, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 4;
    }
    
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...PDF_CONFIG.accentColor);
    doc.text(`Método: ${orderData.paymentMethod}`, PDF_CONFIG.margin, yPosition);
    yPosition += 4;
    
    doc.setFontSize(10);
    doc.text(`TOTAL: $${orderData.totals.total.toFixed(2)}`, PDF_CONFIG.margin, yPosition);
    doc.setTextColor(0, 0, 0);
    
    yPosition += 8;
    return yPosition;
}

// Mensaje personalizado
function addPersonalMessage(doc, yPosition, orderData) {
    doc.setFontSize(8);
    doc.setFont(undefined, 'italic');
    
    const message = [
        `${orderData.greeting}, estimado cliente.`,
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
        yPosition += 4;
    });
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
        discountPercentage: 0.30,
        greeting: getGreetingByTime()
    };
}
