// =======================================================================
// GENERADOR DE PDF PROFESIONAL - VERSIÓN CORREGIDA
// =======================================================================

const PDF_CONFIG = {
    margin: 15,
    fontSize: 9,
    headerHeight: 50,
    primaryColor: [26, 54, 93],
    accentColor: [212, 175, 55],
    watermark: 'JJRB'
};

// Sistema de logging para debugging
const pdfLogger = {
    info: (msg) => console.info(`[PDF-GEN] ${new Date().toISOString()}: ${msg}`),
    error: (msg, error) => console.error(`[PDF-GEN] ${new Date().toISOString()}: ${msg}`, error),
    warn: (msg) => console.warn(`[PDF-GEN] ${new Date().toISOString()}: ${msg}`)
};

// Función de notificación básica para PDF
function showPDFNotification(message, type = 'success') {
    pdfLogger.info(`${type.toUpperCase()}: ${message}`);
    
    // Si existe la función global de notificación, usarla
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        // Crear notificación básica si no existe
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#f44336' : '#4CAF50'};
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.5s ease forwards';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
}

// Verificar disponibilidad de jsPDF de forma segura
function getJSPDF() {
    try {
        if (typeof window.jspdf !== 'undefined') {
            pdfLogger.info('Usando jsPDF desde window.jspdf');
            return window.jspdf.jsPDF;
        } else if (typeof window.jsPDF !== 'undefined') {
            pdfLogger.info('Usando jsPDF desde window.jsPDF');
            return window.jsPDF;
        } else if (typeof jsPDF !== 'undefined') {
            pdfLogger.info('Usando jsPDF global');
            return jsPDF;
        } else {
            throw new Error('jsPDF no está disponible');
        }
    } catch (error) {
        pdfLogger.error('Error al obtener jsPDF:', error);
        showPDFNotification('Error: Biblioteca PDF no disponible', 'error');
        throw error;
    }
}

// Agregar marca de agua
function addWatermark(doc, pageWidth, pageHeight) {
    try {
        doc.setFillColor(245, 245, 245);
        doc.setFontSize(40);
        doc.setTextColor(230, 230, 230);
        doc.setFont('helvetica', 'bold');
        
        const text = PDF_CONFIG.watermark;
        const textWidth = doc.getTextWidth(text);
        const x = (pageWidth - textWidth) / 2;
        const y = pageHeight / 2;
        
        doc.text(text, x, y, { angle: 45 });
        doc.setTextColor(0, 0, 0);
    } catch (error) {
        pdfLogger.warn('Error al agregar marca de agua:', error);
        // Continuar sin marca de agua
    }
}

// Encabezado del PDF
function addHeader(doc, pageWidth, orderData) {
    try {
        // Fondo del encabezado
        doc.setFillColor(...PDF_CONFIG.primaryColor);
        doc.rect(0, 0, pageWidth, PDF_CONFIG.headerHeight - 10, 'F');
        
        // Logo/Texto principal
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('JONATHAN JOSE RANGEL BETANCOURT', pageWidth / 2, 15, { align: 'center' });
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Solicitud de Pedido - Servicios de Software', pageWidth / 2, 22, { align: 'center' });
        
        // Línea decorativa
        doc.setDrawColor(...PDF_CONFIG.accentColor);
        doc.setLineWidth(0.8);
        doc.line(30, 28, pageWidth - 30, 28);
        
        doc.setTextColor(0, 0, 0);
    } catch (error) {
        pdfLogger.error('Error en encabezado PDF:', error);
        throw error;
    }
}

// Información del pedido
function addOrderInfo(doc, yPosition, orderData, pageWidth) {
    try {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMACIÓN DEL PEDIDO', PDF_CONFIG.margin, yPosition);
        
        yPosition += 6;
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Número: ${orderData.orderNumber}`, PDF_CONFIG.margin, yPosition);
        doc.text(`Fecha: ${orderData.date}`, pageWidth / 2, yPosition);
        yPosition += 4;
        
        doc.text(`Hora: ${orderData.time}`, PDF_CONFIG.margin, yPosition);
        yPosition += 8;
        
        return yPosition;
    } catch (error) {
        pdfLogger.error('Error en información del pedido:', error);
        return yPosition;
    }
}

// Información del cliente
function addCustomerInfo(doc, yPosition, orderData, pageWidth) {
    try {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('DATOS DEL CLIENTE', PDF_CONFIG.margin, yPosition);
        
        yPosition += 6;
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nombre: ${orderData.customer.name}`, PDF_CONFIG.margin, yPosition);
        yPosition += 4;
        
        doc.text(`Email: ${orderData.customer.email}`, PDF_CONFIG.margin, yPosition);
        doc.text(`Teléfono: ${orderData.customer.phone}`, pageWidth / 2, yPosition);
        yPosition += 4;
        
        doc.text(`Dirección: ${orderData.customer.address}`, PDF_CONFIG.margin, yPosition);
        yPosition += 8;
        
        return yPosition;
    } catch (error) {
        pdfLogger.error('Error en información del cliente:', error);
        return yPosition;
    }
}

// Detalles del pedido
function addOrderDetails(doc, yPosition, orderData, pageWidth, pageHeight) {
    try {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('DETALLE DEL PEDIDO', PDF_CONFIG.margin, yPosition);
        
        yPosition += 6;
        
        // Encabezados de la tabla
        doc.setFillColor(240, 240, 240);
        doc.rect(PDF_CONFIG.margin, yPosition, 120, 6, 'F');
        doc.rect(PDF_CONFIG.margin + 120, yPosition, 25, 6, 'F');
        doc.rect(PDF_CONFIG.margin + 145, yPosition, 30, 6, 'F');
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('PRODUCTO', PDF_CONFIG.margin + 2, yPosition + 4);
        doc.text('CANT', PDF_CONFIG.margin + 130, yPosition + 4);
        doc.text('PRECIO', PDF_CONFIG.margin + 155, yPosition + 4);
        
        yPosition += 8;
        
        // Items del pedido
        doc.setFont('helvetica', 'normal');
        
        for (let i = 0; i < orderData.items.length; i++) {
            const item = orderData.items[i];
            
            // Verificar si necesitamos nueva página
            if (yPosition > 240) {
                doc.addPage();
                yPosition = PDF_CONFIG.margin;
                addWatermark(doc, pageWidth, pageHeight);
            }
            
            // Producto
            doc.text(`${i + 1}. ${item.name}`, PDF_CONFIG.margin + 2, yPosition);
            // Cantidad
            doc.text(`${item.quantity}`, PDF_CONFIG.margin + 130, yPosition);
            // Precio
            doc.text(`$${item.total.toFixed(2)}`, PDF_CONFIG.margin + 160, yPosition);
            
            yPosition += 3;
            
            // Versión
            doc.setFontSize(6);
            doc.text(`${item.version}`, PDF_CONFIG.margin + 5, yPosition);
            doc.setFontSize(8);
            
            yPosition += 6;
        }
        
        yPosition += 5;
        return yPosition;
    } catch (error) {
        pdfLogger.error('Error en detalles del pedido:', error);
        return yPosition;
    }
}

// Resumen de pago
function addPaymentSummary(doc, yPosition, orderData, pageWidth) {
    try {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('RESUMEN DE PAGO', PDF_CONFIG.margin, yPosition);
        
        yPosition += 6;
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        
        // Subtotal
        doc.text(`Subtotal: $${orderData.totals.subtotal.toFixed(2)}`, PDF_CONFIG.margin, yPosition);
        yPosition += 4;
        
        // Descuento
        if (orderData.totals.discount > 0) {
            doc.setTextColor(255, 107, 107);
            doc.text(`Descuento (30%): -$${orderData.totals.discount.toFixed(2)}`, PDF_CONFIG.margin, yPosition);
            doc.setTextColor(0, 0, 0);
            yPosition += 4;
        }
        
        // Método de pago
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(PDF_CONFIG.accentColor[0], PDF_CONFIG.accentColor[1], PDF_CONFIG.accentColor[2]);
        doc.text(`Método: ${orderData.paymentMethod}`, PDF_CONFIG.margin, yPosition);
        yPosition += 4;
        
        // Total
        doc.setFontSize(10);
        doc.text(`TOTAL: $${orderData.totals.total.toFixed(2)}`, PDF_CONFIG.margin, yPosition);
        doc.setTextColor(0, 0, 0);
        
        yPosition += 8;
        return yPosition;
    } catch (error) {
        pdfLogger.error('Error en resumen de pago:', error);
        return yPosition;
    }
}

// Mensaje personalizado
function addPersonalMessage(doc, yPosition, orderData, pageWidth, pageHeight) {
    try {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        
        const messages = [
            `${orderData.greeting}, estimado cliente.`,
            'Me comunicaré con usted en los próximos minutos para coordinar',
            'el agendamiento de la instalación y los detalles del pago.',
            '',
            'Tiempo estimado de respuesta: 15-30 minutos',
            '',
            '¡Agradecemos su preferencia!'
        ];
        
        for (let i = 0; i < messages.length; i++) {
            // Verificar si necesitamos nueva página
            if (yPosition > 270) {
                doc.addPage();
                yPosition = PDF_CONFIG.margin;
                addWatermark(doc, pageWidth, pageHeight);
            }
            
            doc.text(messages[i], PDF_CONFIG.margin, yPosition);
            yPosition += 4;
        }
    } catch (error) {
        pdfLogger.warn('Error en mensaje personalizado:', error);
        // Continuar sin mensaje personalizado
    }
}

// Generar PDF del pedido
function generateOrderPDF(orderData) {
    return new Promise((resolve, reject) => {
        try {
            pdfLogger.info('Iniciando generación de PDF...');
            
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
            yPosition = addOrderInfo(doc, yPosition, orderData, pageWidth);
            
            // Datos del cliente
            yPosition = addCustomerInfo(doc, yPosition, orderData, pageWidth);
            
            // Detalle del pedido
            yPosition = addOrderDetails(doc, yPosition, orderData, pageWidth, pageHeight);
            
            // Resumen de pago
            yPosition = addPaymentSummary(doc, yPosition, orderData, pageWidth);
            
            // Mensaje personalizado
            addPersonalMessage(doc, yPosition, orderData, pageWidth, pageHeight);
            
            pdfLogger.info('PDF generado exitosamente');
            resolve(doc);
            
        } catch (error) {
            pdfLogger.error('Error crítico generando PDF:', error);
            reject(error);
        }
    });
}

// Función principal para generar y descargar PDF
async function downloadOrderPDF(orderData) {
    try {
        showPDFNotification('Generando PDF profesional...', 'success');
        
        const doc = await generateOrderPDF(orderData);
        const fileName = `Pedido-${orderData.orderNumber}.pdf`;
        
        // Descargar PDF
        doc.save(fileName);
        
        showPDFNotification('PDF generado exitosamente', 'success');
        return true;
        
    } catch (error) {
        pdfLogger.error('Error en downloadOrderPDF:', error);
        showPDFNotification('Error al generar el PDF', 'error');
        return false;
    }
}

// Preparar datos para el PDF
function preparePDFData(cart, customerInfo, orderNumber, paymentMethod, totals) {
    try {
        const now = new Date();
        
        // Asegurar que las funciones auxiliares estén disponibles
        const getPaymentMethodName = window.getPaymentMethodName || 
            ((method) => {
                const methods = {
                    'transferencia': 'Transferencia Bancaria',
                    'paypal': 'PayPal',
                    'efectivo': 'Efectivo (30% descuento)'
                };
                return methods[method] || 'Transferencia Bancaria';
            });
        
        const getGreetingByTime = window.getGreetingByTime || 
            (() => {
                const hour = new Date().getHours();
                if (hour >= 5 && hour < 12) return "Buenos días";
                if (hour >= 12 && hour < 18) return "Buenas tardes";
                return "Buenas noches";
            });
        
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
                name: customerInfo.name || '',
                email: customerInfo.email || '',
                phone: customerInfo.phone || '',
                address: customerInfo.address || ''
            },
            items: cart.map(item => ({
                name: item.name || 'Producto',
                version: item.versionName || 'Versión',
                quantity: item.quantity || 1,
                price: item.price || 0,
                total: (item.price || 0) * (item.quantity || 1)
            })),
            totals: totals || { subtotal: 0, discount: 0, total: 0 },
            paymentMethod: getPaymentMethodName(paymentMethod),
            discountPercentage: 0.30,
            greeting: getGreetingByTime()
        };
    } catch (error) {
        pdfLogger.error('Error en preparePDFData:', error);
        // Retornar datos básicos en caso de error
        return {
            orderNumber: orderNumber || 'ERROR',
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            customer: { name: '', email: '', phone: '', address: '' },
            items: [],
            totals: { subtotal: 0, discount: 0, total: 0 },
            paymentMethod: 'No especificado',
            discountPercentage: 0,
            greeting: 'Hola'
        };
    }
}

// Función auxiliar para obtener nombre del método de pago
function getPaymentMethodName(method) {
    const methods = {
        'transferencia': 'Transferencia Bancaria',
        'paypal': 'PayPal',
        'efectivo': 'Efectivo (30% descuento)'
    };
    return methods[method] || 'Transferencia Bancaria';
}

// Función auxiliar para obtener saludo por hora
function getGreetingByTime() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Buenos días";
    if (hour >= 12 && hour < 18) return "Buenas tardes";
    return "Buenas noches";
}

// Agregar estilos CSS para animaciones si no existen
if (!document.querySelector('#pdf-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'pdf-notification-styles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); }
        }
    `;
    document.head.appendChild(style);
}

// Exportar funciones para uso en otros archivos
window.generateOrderPDF = generateOrderPDF;
window.downloadOrderPDF = downloadOrderPDF;
window.preparePDFData = preparePDFData;
window.getPaymentMethodName = getPaymentMethodName;
window.getGreetingByTime = getGreetingByTime;
