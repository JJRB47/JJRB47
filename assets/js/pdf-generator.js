// =======================================================================
// GENERADOR DE PDF PROFESIONAL - VERSIÓN CORREGIDA 2025
// =======================================================================

const PDF_CONFIG = {
    margin: 15,
    fontSize: 9,
    headerHeight: 50,
    primaryColor: [26, 54, 93],
    accentColor: [212, 175, 55],
    watermark: 'JJRB',
    // NUEVO: URLs para las imágenes de logo y marca de agua
    logoUrl: 'https://z-cdn-media.chatglm.cn/files/d1960e89-6842-4656-b657-177071542d53.png?auth_key=1867059512-6ea27d8795104e26b1b5c7d6774e3789-0-c0918acbbf655f26fb7aadc343c183ca',
    watermarkUrl: 'https://z-cdn-media.chatglm.cn/files/ac902b2d-e518-4d9c-a84b-ace651cddec6.jpg?auth_key=1867059512-18a4958acef7464992e095d26cd5ce50-0-a57c93bfafc4286b20bc45b4aff7170a'
};

// Sistema de logging mejorado
const pdfLogger = {
    info: (msg) => console.info(`[PDF-GEN] ${new Date().toLocaleString('es-VE')}: ${msg}`),
    error: (msg, error) => console.error(`[PDF-GEN] ${new Date().toLocaleString('es-VE')}: ${msg}`, error?.message || error),
    warn: (msg) => console.warn(`[PDF-GEN] ${new Date().toLocaleString('es-VE')}: ${msg}`)
};

// Función auxiliar para capitalizar nombres
function toTitleCase(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Función de notificación mejorada
function showPDFNotification(message, type = 'success') {
    pdfLogger.info(`${type.toUpperCase()}: ${message}`);
    
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.className = 'pdf-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#4CAF50'};
            color: white;
            padding: 12px 18px;
            border-radius: 6px;
            z-index: 99999;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: pdfFadeIn 0.4s ease, pdfFadeOut 0.5s ease 2.5s forwards;
            max-width: 350px;
            word-wrap: break-word;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// Verificar disponibilidad de jsPDF
function getJSPDF() {
    try {
        if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
            return window.jspdf.jsPDF;
        } else if (typeof window.jsPDF !== 'undefined') {
            return window.jsPDF;
        } else if (typeof jsPDF !== 'undefined') {
            return jsPDF;
        } else {
            throw new Error('Biblioteca jsPDF no encontrada. Asegúrate de incluirla en tu proyecto.');
        }
    } catch (error) {
        pdfLogger.error('Error al obtener jsPDF:', error);
        showPDFNotification('Error: Biblioteca PDF no disponible. Recarga la página.', 'error');
        throw error;
    }
}

// NUEVO: Función para cargar imágenes de forma asíncrona
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // Importante para imágenes de dominios cruzados
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}

// NUEVO: Función para agregar el logo en el encabezado
async function addLogo(doc, pageWidth) {
    try {
        const logoImg = await loadImage(PDF_CONFIG.logoUrl);
        
        // Calcular dimensiones del logo (máximo 30mm de ancho para no ocupar mucho espacio)
        const maxWidth = 30;
        const scale = maxWidth / logoImg.width;
        const logoWidth = maxWidth;
        const logoHeight = logoImg.height * scale;
        
        // Posicionar logo a la izquierda del encabezado
        const logoX = PDF_CONFIG.margin;
        const logoY = PDF_CONFIG.margin + 5;
        
        // Agregar imagen al PDF
        doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
        
        // Devolver el ancho total ocupado por el logo para ajustar el texto
        return logoWidth + PDF_CONFIG.margin + 10;
        
    } catch (error) {
        pdfLogger.warn('Error al agregar el logo. Se continuará sin él.', error);
        return 0; // Devolver 0 si el logo no se pudo cargar, el texto se centrará
    }
}

// NUEVO: Función para agregar marca de agua con imagen
async function addImageWatermark(doc, pageWidth, pageHeight) {
    try {
        const watermarkImg = await loadImage(PDF_CONFIG.watermarkUrl);
        
        // Calcular dimensiones para la marca de agua (escalar para que no abarque toda la página)
        const scale = 0.25; // Escalar al 25% del tamaño original
        const watermarkWidth = watermarkImg.width * scale;
        const watermarkHeight = watermarkImg.height * scale;
        
        // Posicionar en el centro de la página
        const x = (pageWidth - watermarkWidth) / 2;
        const y = (pageHeight - watermarkHeight) / 2;
        
        // Configurar transparencia (muy sutil)
        doc.setGState(new doc.GState({ opacity: 0.08 }));
        
        // Agregar imagen como marca de agua
        doc.addImage(watermarkImg, 'JPG', x, y, watermarkWidth, watermarkHeight);
        
        // Restaurar opacidad para el resto del contenido
        doc.setGState(new doc.GState({ opacity: 1.0 }));
        
    } catch (error) {
        pdfLogger.warn('Error al agregar marca de agua con imagen. Usando marca de agua de texto como respaldo.', error);
        
        // Fallback a marca de agua de texto si la imagen falla
        doc.setFillColor(248, 249, 250);
        doc.setFontSize(42);
        doc.setTextColor(235, 236, 240);
        doc.setFont('helvetica', 'bold');
        
        const text = PDF_CONFIG.watermark;
        const textWidth = doc.getTextWidth(text);
        const x = (pageWidth - textWidth) / 2;
        const y = pageHeight / 2;
        
        doc.saveGraphicsState();
        doc.setGState(new window.jspdf.GState({ opacity: 0.3 }));
        doc.text(text, x, y, { angle: 45 });
        doc.restoreGraphicsState();
        doc.setTextColor(0, 0, 0);
    }
}

// ACTUALIZADO: Encabezado mejorado con logo
async function addHeader(doc, pageWidth) {
    try {
        // Fondo degradado (simulado)
        doc.setFillColor(...PDF_CONFIG.primaryColor);
        doc.rect(0, 0, pageWidth, PDF_CONFIG.headerHeight - 10, 'F');
        
        // Línea decorativa superior
        doc.setDrawColor(...PDF_CONFIG.accentColor);
        doc.setLineWidth(2);
        doc.line(0, 0, pageWidth, 0);
        
        // NUEVO: Agregar logo y obtener el ancho ocupado
        const logoWidth = await addLogo(doc, pageWidth);
        
        // Nombre principal (ajustar posición según el ancho del logo)
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        
        // Si hay logo, alinear a la derecha de este. Si no, centrar.
        const nameX = logoWidth || pageWidth / 2;
        const align = logoWidth ? 'left' : 'center';
        doc.text('JONATHAN JOSÉ RANGEL BETANCOURT', nameX, 16, { align });
        
        // Subtítulo
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Desarrollo de Software & Soluciones Tecnológicas', nameX, 24, { align });
        
        // Línea separadora
        doc.setDrawColor(...PDF_CONFIG.accentColor);
        doc.setLineWidth(0.8);
        doc.line(40, 32, pageWidth - 40, 32);
        
        doc.setTextColor(0, 0, 0);
    } catch (error) {
        pdfLogger.error('Error en encabezado:', error);
    }
}

// Información del pedido
function addOrderInfo(doc, yPosition, orderData, pageWidth) {
    try {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...PDF_CONFIG.primaryColor);
        doc.text('INFORMACIÓN DEL PEDIDO', PDF_CONFIG.margin, yPosition);
        
        yPosition += 7;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        // Fondo para datos importantes
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(PDF_CONFIG.margin, yPosition - 2, pageWidth - (PDF_CONFIG.margin * 2), 22, 2, 2, 'F');
        
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.roundedRect(PDF_CONFIG.margin, yPosition - 2, pageWidth - (PDF_CONFIG.margin * 2), 22, 2, 2, 'S');
        
        doc.text(`Nº Pedido: ${orderData.orderNumber}`, PDF_CONFIG.margin + 5, yPosition + 4);
        doc.text(`Fecha: ${orderData.date}`, pageWidth / 2, yPosition + 4);
        yPosition += 8;
        
        doc.text(`Hora: ${orderData.time}`, PDF_CONFIG.margin + 5, yPosition + 4);
        doc.text(`Estado: Pendiente`, pageWidth / 2, yPosition + 4);
        
        yPosition += 15;
        return yPosition;
    } catch (error) {
        pdfLogger.error('Error en información del pedido:', error);
        return yPosition + 10;
    }
}

// Información del cliente mejorada
function addCustomerInfo(doc, yPosition, orderData, pageWidth) {
    try {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...PDF_CONFIG.primaryColor);
        doc.text('DATOS DEL CLIENTE', PDF_CONFIG.margin, yPosition);
        
        yPosition += 7;
        
        // Fondo para datos del cliente
        doc.setFillColor(253, 253, 253);
        doc.roundedRect(PDF_CONFIG.margin, yPosition - 2, pageWidth - (PDF_CONFIG.margin * 2), 40, 2, 2, 'F');
        
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.roundedRect(PDF_CONFIG.margin, yPosition - 2, pageWidth - (PDF_CONFIG.margin * 2), 40, 2, 2, 'S');
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        const customer = orderData.customer;
        const formattedName = toTitleCase(customer.name || 'Cliente');
        
        doc.text(`Nombre: ${formattedName}`, PDF_CONFIG.margin + 5, yPosition + 4);
        yPosition += 8;
        
        doc.text(`Email: ${customer.email || 'No especificado'}`, PDF_CONFIG.margin + 5, yPosition + 4);
        doc.text(`Teléfono: ${customer.phone || 'No especificado'}`, pageWidth / 2, yPosition + 4);
        yPosition += 8;
        
        doc.text(`Dirección: ${customer.address || 'No especificada'}`, PDF_CONFIG.margin + 5, yPosition + 4);
        
        yPosition += 15;
        return yPosition;
    } catch (error) {
        pdfLogger.error('Error en datos del cliente:', error);
        return yPosition + 10;
    }
}

// Detalles del pedido con mejor manejo de páginas
function addOrderDetails(doc, yPosition, orderData, pageWidth, pageHeight) {
    try {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...PDF_CONFIG.primaryColor);
        doc.text('DETALLE DEL PEDIDO', PDF_CONFIG.margin, yPosition);
        
        yPosition += 8;
        
        // Encabezados de la tabla con mejor diseño
        doc.setFillColor(240, 242, 245);
        doc.roundedRect(PDF_CONFIG.margin, yPosition, pageWidth - (PDF_CONFIG.margin * 2), 8, 1, 1, 'F');
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...PDF_CONFIG.primaryColor);
        
        // Columnas ajustadas
        doc.text('PRODUCTO / SERVICIO', PDF_CONFIG.margin + 5, yPosition + 5);
        doc.text('CANT.', PDF_CONFIG.margin + 120, yPosition + 5);
        doc.text('PRECIO', PDF_CONFIG.margin + 160, yPosition + 5);
        
        yPosition += 10;
        
        // Items del pedido
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        for (let i = 0; i < orderData.items.length; i++) {
            const item = orderData.items[i];
            
            // Verificar espacio para nuevo item (altura aproximada: 15mm por item)
            if (yPosition > pageHeight - 40) {
                doc.addPage();
                // NUEVO: Agregar marca de agua a páginas nuevas
                addImageWatermark(doc, pageWidth, pageHeight);
                yPosition = PDF_CONFIG.margin + 10;
            }
            
            // Fondo alternado para filas
            if (i % 2 === 0) {
                doc.setFillColor(252, 252, 252);
            } else {
                doc.setFillColor(248, 249, 250);
            }
            doc.rect(PDF_CONFIG.margin, yPosition, pageWidth - (PDF_CONFIG.margin * 2), 10, 'F');
            
            // Contenido del item
            doc.setFontSize(8);
            doc.text(`${i + 1}. ${item.name}`, PDF_CONFIG.margin + 5, yPosition + 6);
            
            doc.setFont('helvetica', 'bold');
            doc.text(`${item.quantity}`, PDF_CONFIG.margin + 122, yPosition + 6);
            
            doc.text(`$${item.total.toFixed(2)}`, PDF_CONFIG.margin + 162, yPosition + 6);
            
            // Versión y detalles adicionales
            doc.setFontSize(7);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            doc.text(`Versión: ${item.version}`, PDF_CONFIG.margin + 5, yPosition + 9.5);
            
            // ADVERTENCIA para Windows 7/8 antiguos
            if (item.name.toLowerCase().includes('windows 7') || 
                item.name.toLowerCase().includes('windows 8') ||
                item.name.toLowerCase().includes('windows vista')) {
                
                doc.setFontSize(6);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(220, 53, 69); // Rojo
                doc.text('⚠ SISTEMA SIN SOPORTE OFICIAL - RIESGOS DE SEGURIDAD', PDF_CONFIG.margin + 40, yPosition + 9.5);
                doc.setTextColor(100, 100, 100);
            }
            
            yPosition += 12;
            doc.setTextColor(0, 0, 0);
        }
        
        // Línea separadora
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(PDF_CONFIG.margin, yPosition, pageWidth - PDF_CONFIG.margin, yPosition);
        
        yPosition += 8;
        return yPosition;
    } catch (error) {
        pdfLogger.error('Error en detalles del pedido:', error);
        return yPosition;
    }
}

// Resumen de pago mejorado
function addPaymentSummary(doc, yPosition, orderData, pageWidth) {
    try {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...PDF_CONFIG.primaryColor);
        doc.text('RESUMEN DE PAGO', PDF_CONFIG.margin, yPosition);
        
        yPosition += 8;
        
        // Fondo para resumen
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(PDF_CONFIG.margin, yPosition, pageWidth - (PDF_CONFIG.margin * 2), 45, 2, 2, 'F');
        
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.roundedRect(PDF_CONFIG.margin, yPosition, pageWidth - (PDF_CONFIG.margin * 2), 45, 2, 2, 'S');
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        // Subtotal
        doc.text('Subtotal:', PDF_CONFIG.margin + 10, yPosition + 8);
        doc.text(`$${orderData.totals.subtotal.toFixed(2)}`, pageWidth - PDF_CONFIG.margin - 30, yPosition + 8);
        
        yPosition += 8;
        
        // Descuento si aplica
        if (orderData.totals.discount > 0) {
            doc.setTextColor(40, 167, 69); // Verde
            doc.text('Descuento (30%):', PDF_CONFIG.margin + 10, yPosition + 8);
            doc.text(`-$${orderData.totals.discount.toFixed(2)}`, pageWidth - PDF_CONFIG.margin - 30, yPosition + 8);
            doc.setTextColor(0, 0, 0);
            yPosition += 8;
        }
        
        // Línea separadora
        doc.setDrawColor(200, 200, 200);
        doc.line(PDF_CONFIG.margin + 10, yPosition + 4, pageWidth - PDF_CONFIG.margin - 10, yPosition + 4);
        yPosition += 8;
        
        // Método de pago
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...PDF_CONFIG.accentColor);
        doc.text(`Método de pago: ${orderData.paymentMethod}`, PDF_CONFIG.margin + 10, yPosition + 8);
        yPosition += 10;
        
        // TOTAL
        doc.setFontSize(12);
        doc.setTextColor(...PDF_CONFIG.primaryColor);
        doc.text('TOTAL A PAGAR:', PDF_CONFIG.margin + 10, yPosition + 8);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 53, 69); // Rojo para destacar
        doc.text(`$${orderData.totals.total.toFixed(2)}`, pageWidth - PDF_CONFIG.margin - 35, yPosition + 8);
        
        doc.setTextColor(0, 0, 0);
        yPosition += 20;
        return yPosition;
    } catch (error) {
        pdfLogger.error('Error en resumen de pago:', error);
        return yPosition;
    }
}

// Sección de datos bancarios y mensaje final
function addBankDetailsAndNotes(doc, yPosition, orderData, pageWidth, pageHeight) {
    try {
        // Verificar si necesitamos nueva página
        if (yPosition > pageHeight - 100) {
            doc.addPage();
            // NUEVO: Agregar marca de agua a páginas nuevas
            addImageWatermark(doc, pageWidth, pageHeight);
            yPosition = PDF_CONFIG.margin + 10;
        }
        
        // DATOS BANCARIOS - BANCO DE VENEZUELA
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...PDF_CONFIG.primaryColor);
        doc.text('DATOS PARA TRANSFERENCIA / PAGO MÓVIL', PDF_CONFIG.margin, yPosition);
        
        yPosition += 8;
        
        // Fondo para datos bancarios
        doc.setFillColor(240, 248, 255); // Azul muy claro
        doc.roundedRect(PDF_CONFIG.margin, yPosition, pageWidth - (PDF_CONFIG.margin * 2), 40, 3, 3, 'F');
        
        doc.setDrawColor(26, 54, 93); // Color primario
        doc.setLineWidth(0.5);
        doc.roundedRect(PDF_CONFIG.margin, yPosition, pageWidth - (PDF_CONFIG.margin * 2), 40, 3, 3, 'S');
        
        const bankData = [
            { label: 'Banco:', value: 'Banco de Venezuela' },
            { label: 'Titular:', value: 'Jonathan José Rangel Betancourt' },
            { label: 'Cédula:', value: '25.175.926' },
            { label: 'Teléfono:', value: '0412-289-1366' },
            { label: 'Tipo de Cuenta:', value: 'Corriente' }
        ];
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        bankData.forEach((item, index) => {
            const rowY = yPosition + 8 + (index * 7);
            doc.setFont('helvetica', 'bold');
            doc.text(item.label, PDF_CONFIG.margin + 8, rowY);
            doc.setFont('helvetica', 'normal');
            doc.text(item.value, PDF_CONFIG.margin + 35, rowY);
        });
        
        yPosition += 50;
        
        // NOTAS IMPORTANTES
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(33, 37, 41); // Gris oscuro
        doc.text('NOTAS IMPORTANTES', PDF_CONFIG.margin, yPosition);
        
        yPosition += 8;
        
        const notes = [
            '✓ Envíe el comprobante de pago vía WhatsApp al número indicado.',
            '✓ Tiempo de respuesta: 15-30 minutos después del pago confirmado.',
            '✓ Garantía: 15 días continuos desde la instalación/activación.',
            '✓ Soporte técnico incluido durante el período de garantía.',
            '✓ Para sistemas operativos antiguos (Windows 7/8), el cliente asume los riesgos de seguridad.'
        ];
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(73, 80, 87); // Gris
        
        notes.forEach((note, index) => {
            const noteY = yPosition + (index * 5);
            if (noteY > pageHeight - 20) {
                doc.addPage();
                // NUEVO: Agregar marca de agua a páginas nuevas
                addImageWatermark(doc, pageWidth, pageHeight);
                yPosition = PDF_CONFIG.margin + 10;
            }
            doc.text(note, PDF_CONFIG.margin + 5, yPosition + (index * 5));
        });
        
        yPosition += 30;
        
        // Mensaje de agradecimiento
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...PDF_CONFIG.primaryColor);
        doc.text(`¡${orderData.greeting}, ${toTitleCase(orderData.customer.name || 'cliente')}!`, 
                pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 5;
        doc.setFontSize(8);
        doc.setTextColor(108, 117, 125);
        doc.text('Agradecemos su confianza y preferencia.', 
                pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 5;
        doc.text('Desarrollo de Software & Soluciones Tecnológicas', 
                pageWidth / 2, yPosition, { align: 'center' });
        
        // Pie de página
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(`Documento generado el ${new Date().toLocaleDateString('es-VE')} a las ${new Date().toLocaleTimeString('es-VE', {hour: '2-digit', minute:'2-digit'})}`, 
                pageWidth / 2, pageHeight - 10, { align: 'center' });
        
    } catch (error) {
        pdfLogger.error('Error en datos bancarios/notas:', error);
    }
}

// ACTUALIZADO: Función principal para generar PDF
async function generateOrderPDF(orderData) {
    try {
        pdfLogger.info(`Generando PDF para pedido: ${orderData.orderNumber}`);
        
        const jsPDF = getJSPDF();
        const doc = new jsPDF();
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // NUEVO: Agregar marca de agua en primera página
        await addImageWatermark(doc, pageWidth, pageHeight);
        
        // NUEVO: Encabezado con logo
        await addHeader(doc, pageWidth);
        
        let yPosition = PDF_CONFIG.headerHeight + 5;
        
        // Información del pedido
        yPosition = addOrderInfo(doc, yPosition, orderData, pageWidth);
        
        // Datos del cliente
        yPosition = addCustomerInfo(doc, yPosition, orderData, pageWidth);
        
        // Detalle del pedido
        yPosition = addOrderDetails(doc, yPosition, orderData, pageWidth, pageHeight);
        
        // Resumen de pago
        yPosition = addPaymentSummary(doc, yPosition, orderData, pageWidth);
        
        // Datos bancarios y notas finales
        addBankDetailsAndNotes(doc, yPosition, orderData, pageWidth, pageHeight);
        
        pdfLogger.info('PDF generado exitosamente');
        return doc;
        
    } catch (error) {
        pdfLogger.error('Error crítico generando PDF:', error);
        throw error;
    }
}

// Función para descargar PDF
async function downloadOrderPDF(orderData) {
    try {
        showPDFNotification('Generando PDF profesional...', 'info');
        
        const doc = await generateOrderPDF(orderData);
        const fileName = `Pedido-${orderData.orderNumber}_${new Date().toISOString().slice(0, 10)}.pdf`;
        
        // Descargar PDF
        doc.save(fileName);
        
        showPDFNotification(`PDF "${fileName}" generado exitosamente`, 'success');
        return { success: true, fileName };
        
    } catch (error) {
        pdfLogger.error('Error en downloadOrderPDF:', error);
        showPDFNotification('Error al generar el PDF. Intente nuevamente.', 'error');
        return { success: false, error: error.message };
    }
}

// Preparar datos para el PDF (función mejorada)
function preparePDFData(cart, customerInfo, orderNumber, paymentMethod, totals) {
    try {
        const now = new Date();
        
        // Formatear fecha y hora en español
        const dateOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        return {
            orderNumber: orderNumber || `ORD-${Date.now().toString().slice(-6)}`,
            date: now.toLocaleDateString('es-VE', dateOptions),
            time: now.toLocaleTimeString('es-VE', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }),
            customer: {
                name: customerInfo?.name?.trim() || 'Cliente',
                email: customerInfo?.email?.trim() || '',
                phone: customerInfo?.phone?.trim() || '',
                address: customerInfo?.address?.trim() || 'No especificada'
            },
            items: (cart || []).map((item, index) => ({
                id: item.id || index + 1,
                name: item.name || `Producto ${index + 1}`,
                version: item.versionName || 'Estándar',
                quantity: parseInt(item.quantity) || 1,
                price: parseFloat(item.price) || 0,
                total: (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)
            })),
            totals: totals || { 
                subtotal: 0, 
                discount: 0, 
                total: 0 
            },
            paymentMethod: getPaymentMethodName(paymentMethod),
            discountPercentage: paymentMethod === 'efectivo' ? 0.30 : 0,
            greeting: getGreetingByTime()
        };
    } catch (error) {
        pdfLogger.error('Error en preparePDFData:', error);
        return {
            orderNumber: 'ERROR-' + Date.now().toString().slice(-6),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            customer: { 
                name: 'Cliente', 
                email: '', 
                phone: '', 
                address: '' 
            },
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
        'efectivo': 'Efectivo (con 30% de descuento)',
        'zelle': 'Zelle',
        'binance': 'Binance Pay',
        'pago_movil': 'Pago Móvil'
    };
    return methods[method?.toLowerCase()] || 'Transferencia Bancaria';
}

// Función auxiliar para obtener saludo por hora
function getGreetingByTime() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Buenos días";
    if (hour >= 12 && hour < 18) return "Buenas tardes";
    return "Buenas noches";
}

// Agregar estilos CSS para animaciones
if (typeof document !== 'undefined' && !document.querySelector('#pdf-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'pdf-notification-styles';
    style.textContent = `
        @keyframes pdfFadeIn {
            from { 
                opacity: 0; 
                transform: translateY(-15px) scale(0.95); 
            }
            to { 
                opacity: 1; 
                transform: translateY(0) scale(1); 
            }
        }
        @keyframes pdfFadeOut {
            from { 
                opacity: 1; 
                transform: translateY(0) scale(1); 
            }
            to { 
                opacity: 0; 
                transform: translateY(-15px) scale(0.95); 
            }
        }
    `;
    document.head.appendChild(style);
}

// Exportar funciones para uso global
if (typeof window !== 'undefined') {
    window.generateOrderPDF = generateOrderPDF;
    window.downloadOrderPDF = downloadOrderPDF;
    window.preparePDFData = preparePDFData;
    window.getPaymentMethodName = getPaymentMethodName;
    window.getGreetingByTime = getGreetingByTime;
    window.toTitleCase = toTitleCase;
}

// Si es módulo, exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateOrderPDF,
        downloadOrderPDF,
        preparePDFData,
        getPaymentMethodName,
        getGreetingByTime,
        toTitleCase,
        PDF_CONFIG
    };
}