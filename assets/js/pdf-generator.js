[file name]: pdf-generator.js
[file content begin]

// =======================================================================
// GENERADOR DE PDF PROFESIONAL - VERSIÓN MEJORADA
// =======================================================================

// Configuración del PDF mejorada
const PDF_CONFIG = {
    margin: 15,
    fontSize: 9,
    headerHeight: 50,
    primaryColor: [26, 54, 93],
    accentColor: [212, 175, 55],
    watermark: 'JJRB'
};

// Generar PDF del pedido - VERSIÓN COMPACTA
function generateOrderPDF(orderData) {
    return new Promise((resolve) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuración inicial
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Agregar marca de agua de fondo sutil
        addWatermark(doc, pageWidth, pageHeight);
        
        // Encabezado compacto
        addHeader(doc, pageWidth, orderData);
        
        let yPosition = PDF_CONFIG.headerHeight;
        
        // Información del pedido compacta
        yPosition = addOrderInfo(doc, yPosition, orderData);
        
        // Datos del cliente compactos
        yPosition = addCustomerInfo(doc, yPosition, orderData);
        
        // Detalle del pedido optimizado
        yPosition = addOrderDetails(doc, yPosition, orderData);
        
        // Resumen de pago compacto
        yPosition = addPaymentSummary(doc, yPosition, orderData);
        
        // Mensaje personalizado compacto
        addPersonalMessage(doc, yPosition, orderData);
        
        resolve(doc);
    });
}

// Agregar marca de agua sutil
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

// Encabezado del PDF compacto
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
    
    // Restaurar color de texto
    doc.setTextColor(0, 0, 0);
}

// Información del pedido compacta
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

// Información del cliente compacta
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

// Detalles del pedido optimizados
function addOrderDetails(doc, yPosition, orderData) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('DETALLE DEL PEDIDO', PDF_CONFIG.margin, yPosition);
    
    yPosition += 6;
    
    // Encabezados de la tabla compactos
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
    
    // Items del pedido compactos
    doc.setFont(undefined, 'normal');
    orderData.items.forEach((item, index) => {
        if (yPosition > 240) { // Nueva página si es necesario
            doc.addPage();
            yPosition = PDF_CONFIG.margin;
            addWatermark(doc, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight());
        }
        
        // Producto principal
        doc.text(`${index + 1}. ${item.name}`, PDF_CONFIG.margin + 2, yPosition);
        doc.text(`${item.quantity}`, PDF_CONFIG.margin + 128, yPosition);
        doc.text(`$${item.total.toFixed(2)}`, PDF_CONFIG.margin + 152, yPosition);
        
        // Versión en línea siguiente más pequeña
        yPosition += 3;
        doc.setFontSize(6);
        doc.text(`${item.version}`, PDF_CONFIG.margin + 5, yPosition);
        doc.setFontSize(8);
        
        yPosition += 6;
    });
    
    yPosition += 5;
    return yPosition;
}

// Resumen de pago compacto
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
        doc.text(`Descuento (${orderData.discountPercentage * 100}%): -$${orderData.totals.discount.toFixed(2)}`, PDF_CONFIG.margin, yPosition);
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

// Mensaje personalizado compacto
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

// Función principal para generar y descargar PDF - MODIFICADA
async function downloadOrderPDF(orderData) {
    try {
        showNotification('Generando PDF profesional...', 'success');
        
        const doc = await generateOrderPDF(orderData);
        const fileName = `Pedido-${orderData.orderNumber}.pdf`;
        
        // Descargar PDF
        doc.save(fileName);
        
        // Obtener el PDF en base64 para enviar por correo
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        
        showNotification('PDF generado exitosamente', 'success');
        return pdfBase64;
        
    } catch (error) {
        console.error('Error generando PDF:', error);
        showNotification('Error al generar el PDF', 'error');
        return null;
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
// FUNCIÓN PARA ENVIAR CORREO ELECTRÓNICO CON EL PDF
// =======================================================================

async function sendEmailWithPDF(orderData, pdfBase64) {
    try {
        showNotification('Enviando PDF a tu correo...', 'success');
        
        // Usar EmailJS para enviar el correo
        const templateParams = {
            order_number: orderData.orderNumber,
            customer_name: orderData.customer.name,
            customer_email: orderData.customer.email,
            customer_phone: orderData.customer.phone,
            total_amount: orderData.totals.total.toFixed(2),
            payment_method: orderData.paymentMethod,
            business_email: 'rangeljose4747@gmail.com',
            to_email: 'rangeljose4747@gmail.com',
            pdf_file: pdfBase64,
            pdf_filename: `Pedido-${orderData.orderNumber}.pdf`
        };

        // Enviar correo usando EmailJS
        const response = await emailjs.send(
            'service_your_service_id', // Reemplaza con tu Service ID de EmailJS
            'template_your_template_id', // Reemplaza con tu Template ID de EmailJS
            templateParams,
            'your_public_key' // Reemplaza con tu Public Key de EmailJS
        );

        showNotification('PDF enviado a tu correo exitosamente', 'success');
        return true;
        
    } catch (error) {
        console.error('Error enviando correo:', error);
        showNotification('Error al enviar el PDF por correo', 'error');
        return false;
    }
}

// Función alternativa usando FormSubmit (más simple)
async function sendEmailAlternative(orderData, pdfBase64) {
    try {
        // Crear un formulario temporal para enviar por FormSubmit
        const formData = new FormData();
        
        // Convertir base64 a blob
        const byteCharacters = atob(pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
        
        formData.append('_subject', `Nuevo Pedido - ${orderData.orderNumber}`);
        formData.append('_replyto', orderData.customer.email);
        formData.append('order_number', orderData.orderNumber);
        formData.append('customer_name', orderData.customer.name);
        formData.append('customer_email', orderData.customer.email);
        formData.append('customer_phone', orderData.customer.phone);
        formData.append('total_amount', `$${orderData.totals.total.toFixed(2)}`);
        formData.append('payment_method', orderData.paymentMethod);
        formData.append('pdf_file', pdfBlob, `Pedido-${orderData.orderNumber}.pdf`);
        
        // Enviar usando FormSubmit (requiere configurar formsubmit.co)
        const response = await fetch('https://formsubmit.co/ajax/rangeljose4747@gmail.com', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Pedido enviado a tu correo exitosamente', 'success');
            return true;
        } else {
            throw new Error('Error en el envío');
        }
        
    } catch (error) {
        console.error('Error enviando correo alternativo:', error);
        showNotification('Error al enviar el pedido por correo', 'error');
        return false;
    }
}

// Función unificada para manejar el envío del PDF
async function handlePDFAndEmail(orderData) {
    try {
        // Generar y descargar PDF
        const pdfBase64 = await downloadOrderPDF(orderData);
        
        if (pdfBase64) {
            // Intentar enviar por correo (usar la que prefieras)
            await sendEmailWithPDF(orderData, pdfBase64);
            // O usar: await sendEmailAlternative(orderData, pdfBase64);
        }
        
        return true;
    } catch (error) {
        console.error('Error en el proceso completo:', error);
        return false;
    }
}

[file content end]
