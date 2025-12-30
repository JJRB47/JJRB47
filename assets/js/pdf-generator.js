// =======================================================================
// GENERADOR DE PDF PROFESIONAL - VERSIÓN FINAL CON DATOS DE PAGO MÓVIL
// =======================================================================

const PDF_CONFIG = {
    margin: 15,
    fontSize: 9,
    headerHeight: 50,
    primaryColor: [26, 54, 93],
    accentColor: [212, 175, 55],
    watermark: 'JJRB',
    // URLs de Google Drive
    logoUrl: 'https://drive.google.com/uc?export=view&id=1nHTY5H7Bfd6TUhXw5BdH2L3olhzHpWNh',
    watermarkUrl: 'https://drive.google.com/uc?export=view&id=1z_TD3ZD7UkPSFKk3hdsYSxbV8hjPvFhU',
    // Configuración mejorada
    imageLoadTimeout: 10000,
    maxRetries: 1,
    language: 'es-VE',
    compress: true,
    useCorsProxy: false,
    // DATOS BANCARIOS COMPLETOS PARA VENEZUELA
    bankDetails: {
        banco: 'Banco de Venezuela',
        titular: 'Jonathan José Rangel Betancourt',
        cedula: '25.175.926',
        telefono: '0412-289-1366',
        alias: 'Jonathan Rangel',
        cuentaCorriente: '01020586700000201524'
    }
};

// Caché para imágenes
const IMAGE_CACHE = {};

// Historial de generación
const PDF_GENERATION_HISTORY = [];

// Sistema de logging mejorado
const pdfLogger = {
    info: (msg) => console.info(`[PDF-GEN] ${new Date().toLocaleString('es-VE')}: ${msg}`),
    error: (msg, error) => console.error(`[PDF-GEN] ${new Date().toLocaleString('es-VE')}: ${msg}`, error?.message || error),
    warn: (msg) => console.warn(`[PDF-GEN] ${new Date().toLocaleString('es-VE')}: ${msg}`)
};

// Textos multilingüe con datos específicos para Venezuela
const LANGUAGES = {
    'es-VE': {
        orderInfo: 'INFORMACIÓN DEL PEDIDO',
        customerData: 'DATOS DEL CLIENTE',
        orderDetails: 'DETALLE DEL PEDIDO',
        paymentSummary: 'RESUMEN DE PAGO',
        bankDetails: 'DATOS PARA PAGO',
        importantNotes: 'NOTAS IMPORTANTES',
        orderNumber: 'Nº Pedido',
        date: 'Fecha',
        time: 'Hora',
        status: 'Estado',
        customerName: 'Nombre',
        customerEmail: 'Email',
        customerPhone: 'Teléfono',
        customerAddress: 'Dirección',
        subtotal: 'Subtotal',
        discount: 'Descuento',
        paymentMethod: 'Método de pago',
        totalToPay: 'TOTAL A PAGAR',
        bank: 'Banco',
        accountHolder: 'Titular',
        id: 'Cédula',
        phone: 'Teléfono',
        accountType: 'Tipo de Cuenta',
        sendProof: 'Envíe el comprobante de pago vía WhatsApp al número indicado.',
        responseTime: 'Tiempo de respuesta: 15-30 minutos después del pago confirmado.',
        warranty: 'Garantía: 15 días continuos desde la instalación/activación.',
        support: 'Soporte técnico incluido durante el período de garantía.',
        securityWarning: 'Para sistemas operativos antiguos (Windows 7/8), el cliente asume los riesgos de seguridad.',
        thankYou: 'Agradecemos su confianza y preferencia.',
        company: 'Desarrollo de Software & Soluciones Tecnológicas',
        // Datos específicos para transferencia bancaria
        transferTitle: 'DATOS PARA TRANSFERENCIA BANCARIA',
        transferBank: 'Banco',
        transferHolder: 'Titular',
        transferId: 'Cédula',
        transferAccountType: 'Tipo de Cuenta',
        transferAccountNumber: 'Número de Cuenta',
        // Datos específicos para pago móvil
        mobileTitle: 'DATOS PARA PAGO MÓVIL',
        mobileBank: 'Banco',
        mobilePhone: 'Teléfono',
        mobileId: 'Cédula',
        mobileAlias: 'Alias'
    },
    'en-US': {
        orderInfo: 'ORDER INFORMATION',
        customerData: 'CUSTOMER DATA',
        orderDetails: 'ORDER DETAILS',
        paymentSummary: 'PAYMENT SUMMARY',
        bankDetails: 'PAYMENT DETAILS',
        importantNotes: 'IMPORTANT NOTES',
        orderNumber: 'Order #',
        date: 'Date',
        time: 'Time',
        status: 'Status',
        customerName: 'Name',
        customerEmail: 'Email',
        customerPhone: 'Phone',
        customerAddress: 'Address',
        subtotal: 'Subtotal',
        discount: 'Discount',
        paymentMethod: 'Payment Method',
        totalToPay: 'TOTAL TO PAY',
        bank: 'Bank',
        accountHolder: 'Account Holder',
        id: 'ID',
        phone: 'Phone',
        accountType: 'Account Type',
        sendProof: 'Send payment receipt via WhatsApp to the provided number.',
        responseTime: 'Response time: 15-30 minutes after payment confirmation.',
        warranty: 'Warranty: 15 consecutive days from installation/activation.',
        support: 'Technical support included during warranty period.',
        securityWarning: 'For legacy operating systems (Windows 7/8), customer assumes security risks.',
        thankYou: 'Thank you for your trust and preference.',
        company: 'Software Development & Technological Solutions',
        // Datos específicos para transferencia bancaria
        transferTitle: 'BANK TRANSFER DETAILS',
        transferBank: 'Bank',
        transferHolder: 'Account Holder',
        transferId: 'ID',
        transferAccountType: 'Account Type',
        transferAccountNumber: 'Account Number',
        // Datos específicos para pago móvil
        mobileTitle: 'MOBILE PAYMENT DETAILS',
        mobileBank: 'Bank',
        mobilePhone: 'Phone',
        mobileId: 'ID',
        mobileAlias: 'Alias'
    }
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

// Función para obtener textos según idioma
function getText(key) {
    const lang = LANGUAGES[PDF_CONFIG.language] || LANGUAGES['es-VE'];
    return lang[key] || key;
}

// Función para cargar imágenes con caché y reintentos
async function loadImageCached(url, retryCount = 0) {
    if (IMAGE_CACHE[url]) return IMAGE_CACHE[url];
    
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        const timeout = setTimeout(() => {
            if (retryCount < PDF_CONFIG.maxRetries) {
                pdfLogger.warn(`Reintentando imagen (${retryCount + 1}/${PDF_CONFIG.maxRetries}): ${url}`);
                clearTimeout(timeout);
                loadImageCached(url, retryCount + 1)
                    .then(resolve)
                    .catch(reject);
            } else {
                reject(new Error('Tiempo de espera agotado al cargar imagen'));
            }
        }, PDF_CONFIG.imageLoadTimeout);
        
        img.onload = () => {
            clearTimeout(timeout);
            IMAGE_CACHE[url] = img;
            resolve(img);
        };
        
        img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Error al cargar la imagen'));
        };
        
        // Usar proxy CORS solo si está configurado y es necesario
        img.src = getProxiedUrl(url);
    });
}

// Función para obtener URL con proxy si es necesario
function getProxiedUrl(url) {
    // Solo si está habilitado y estamos en desarrollo
    if (PDF_CONFIG.useCorsProxy && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1')) {
        return `https://corsproxy.io/?${encodeURIComponent(url)}`;
    }
    return url; // En producción, usar URL directa
}

// Función para agregar el logo en el encabezado
async function addLogo(doc, pageWidth) {
    try {
        if (!PDF_CONFIG.logoUrl) {
            return { width: 0, height: 0, x: 0, y: 0 };
        }
        
        const logoImg = await loadImageCached(PDF_CONFIG.logoUrl);
        
        // MANTENER PROPORCIONES
        const maxWidth = 35;
        const maxHeight = 25;
        const scale = Math.min(
            maxWidth / logoImg.width,
            maxHeight / logoImg.height
        );
        const logoWidth = logoImg.width * scale;
        const logoHeight = logoImg.height * scale;
        
        // CENTRAR VERTICALMENTE en el header
        const logoX = PDF_CONFIG.margin;
        const logoY = (PDF_CONFIG.headerHeight - logoHeight) / 2 - 5;
        
        doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
        
        return { width: logoWidth, height: logoHeight, x: logoX, y: logoY };
        
    } catch (error) {
        pdfLogger.warn('Logo no disponible, usando texto solo:', error.message);
        return { width: 0, height: 0, x: 0, y: 0 };
    }
}

// Función para agregar marca de agua con imagen
async function addImageWatermark(doc, pageWidth, pageHeight) {
    try {
        if (!PDF_CONFIG.watermarkUrl) {
            throw new Error('URL de marca de agua no válida');
        }
        
        const watermarkImg = await loadImageCached(PDF_CONFIG.watermarkUrl);
        
        // Dimensiones (25% del tamaño original)
        const scale = 0.25;
        const watermarkWidth = watermarkImg.width * scale;
        const watermarkHeight = watermarkImg.height * scale;
        
        // Posicionar en el centro de la página
        const x = (pageWidth - watermarkWidth) / 2;
        const y = (pageHeight - watermarkHeight) / 2;
        
        // APLICAR TRANSPARENCIA CORRECTAMENTE
        if (typeof window.jspdf !== 'undefined' && window.jspdf.GState) {
            doc.saveGraphicsState();
            const gstate = new window.jspdf.GState({ opacity: 0.1 }); // 10% de opacidad
            doc.setGState(gstate);
        }
        
        // Agregar imagen como marca de agua
        doc.addImage(watermarkImg, 'JPG', x, y, watermarkWidth, watermarkHeight);
        
        // RESTAURAR ESTADO GRÁFICO
        if (typeof window.jspdf !== 'undefined' && window.jspdf.GState) {
            doc.restoreGraphicsState();
        }
        
        pdfLogger.info('Marca de agua con imagen aplicada');
        
    } catch (error) {
        pdfLogger.warn('Error al agregar marca de agua con imagen. Usando marca de agua de texto como respaldo.', error);
        
        // Fallback a marca de agua de texto si la imagen falla
        doc.setFontSize(40);
        doc.setTextColor(230, 230, 230);
        doc.setFont('helvetica', 'bold');
        
        const text = PDF_CONFIG.watermark;
        const textWidth = doc.getTextWidth(text);
        const x = (pageWidth - textWidth) / 2;
        const y = pageHeight / 2;
        
        if (typeof window.jspdf !== 'undefined' && window.jspdf.GState) {
            doc.saveGraphicsState();
            doc.setGState(new window.jspdf.GState({ opacity: 0.2 }));
        }
        
        doc.text(text, x, y, { angle: 45 });
        
        if (typeof window.jspdf !== 'undefined' && window.jspdf.GState) {
            doc.restoreGraphicsState();
        }
        
        doc.setTextColor(0, 0, 0);
    }
}

// Encabezado mejorado con logo
async function addHeader(doc, pageWidth) {
    try {
        // Fondo del header
        doc.setFillColor(...PDF_CONFIG.primaryColor);
        doc.rect(0, 0, pageWidth, PDF_CONFIG.headerHeight - 10, 'F');
        
        // Línea decorativa superior
        doc.setDrawColor(...PDF_CONFIG.accentColor);
        doc.setLineWidth(2);
        doc.line(0, 0, pageWidth, 0);
        
        // Cargar logo
        const logo = await addLogo(doc, pageWidth);
        
        // Posición del texto
        let textX, textAlign;
        if (logo.width > 0) {
            textX = logo.x + logo.width + 15;
            textAlign = 'left';
        } else {
            textX = pageWidth / 2;
            textAlign = 'center';
        }
        
        // Nombre principal
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(logo.width > 0 ? 12 : 14);
        doc.setFont('helvetica', 'bold');
        doc.text('JONATHAN JOSÉ RANGEL BETANCOURT', textX, 20, { align: textAlign });
        
        // Subtítulo
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(getText('company'), textX, 27, { align: textAlign });
        
        // Línea separadora
        const lineStart = logo.width > 0 ? textX - 5 : 40;
        doc.setDrawColor(...PDF_CONFIG.accentColor);
        doc.setLineWidth(0.8);
        doc.line(lineStart, 34, pageWidth - 40, 34);
        
        doc.setTextColor(0, 0, 0);
        
    } catch (error) {
        pdfLogger.error('Error en header, usando versión simple:', error);
        
        // Versión simple sin logo
        doc.setFillColor(...PDF_CONFIG.primaryColor);
        doc.rect(0, 0, pageWidth, PDF_CONFIG.headerHeight - 10, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('JONATHAN JOSÉ RANGEL BETANCOURT', pageWidth / 2, 20, { align: 'center' });
    }
}

// Información del pedido
function addOrderInfo(doc, yPosition, orderData, pageWidth) {
    try {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...PDF_CONFIG.primaryColor);
        doc.text(getText('orderInfo'), PDF_CONFIG.margin, yPosition);
        
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
        
        doc.text(`${getText('orderNumber')} ${orderData.orderNumber}`, PDF_CONFIG.margin + 5, yPosition + 4);
        doc.text(`${getText('date')} ${orderData.date}`, pageWidth / 2, yPosition + 4);
        yPosition += 8;
        
        doc.text(`${getText('time')} ${orderData.time}`, PDF_CONFIG.margin + 5, yPosition + 4);
        doc.text(`${getText('status')} Pendiente`, pageWidth / 2, yPosition + 4);
        
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
        doc.text(getText('customerData'), PDF_CONFIG.margin, yPosition);
        
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
        
        doc.text(`${getText('customerName')}: ${formattedName}`, PDF_CONFIG.margin + 5, yPosition + 4);
        yPosition += 8;
        
        doc.text(`${getText('customerEmail')}: ${customer.email || 'No especificado'}`, PDF_CONFIG.margin + 5, yPosition + 4);
        doc.text(`${getText('customerPhone')}: ${customer.phone || 'No especificado'}`, pageWidth / 2, yPosition + 4);
        yPosition += 8;
        
        doc.text(`${getText('customerAddress')}: ${customer.address || 'No especificada'}`, PDF_CONFIG.margin + 5, yPosition + 4);
        
        yPosition += 15;
        return yPosition;
    } catch (error) {
        pdfLogger.error('Error en datos del cliente:', error);
        return yPosition + 10;
    }
}

// Detalles del pedido con mejor manejo de páginas
async function addOrderDetails(doc, yPosition, orderData, pageWidth, pageHeight) {
    try {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...PDF_CONFIG.primaryColor);
        doc.text(getText('orderDetails'), PDF_CONFIG.margin, yPosition);
        
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
                // Agregar marca de agua a páginas nuevas
                await addImageWatermark(doc, pageWidth, pageHeight);
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
        doc.text(getText('paymentSummary'), PDF_CONFIG.margin, yPosition);
        
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
        doc.text(getText('subtotal') + ':', PDF_CONFIG.margin + 10, yPosition + 8);
        doc.text(`$${orderData.totals.subtotal.toFixed(2)}`, pageWidth - PDF_CONFIG.margin - 30, yPosition + 8);
        
        yPosition += 8;
        
        // Descuento si aplica
        if (orderData.totals.discount > 0) {
            doc.setTextColor(40, 167, 69); // Verde
            doc.text(getText('discount') + ' (30%):', PDF_CONFIG.margin + 10, yPosition + 8);
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
        doc.text(`${getText('paymentMethod')}: ${orderData.paymentMethod}`, PDF_CONFIG.margin + 10, yPosition + 8);
        yPosition += 10;
        
        // TOTAL
        doc.setFontSize(12);
        doc.setTextColor(...PDF_CONFIG.primaryColor);
        doc.text(getText('totalToPay') + ':', PDF_CONFIG.margin + 10, yPosition + 8);
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

// Sección de datos bancarios y mensaje final MEJORADA
async function addBankDetailsAndNotes(doc, yPosition, orderData, pageWidth, pageHeight) {
    try {
        // Verificar si necesitamos nueva página
        if (yPosition > pageHeight - 150) { // Aumentado para容纳 dos secciones
            doc.addPage();
            // Agregar marca de agua a páginas nuevas
            await addImageWatermark(doc, pageWidth, pageHeight);
            yPosition = PDF_CONFIG.margin + 10;
        }
        
        // DATOS PARA TRANSFERENCIA BANCARIA
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...PDF_CONFIG.primaryColor);
        doc.text(getText('transferTitle'), PDF_CONFIG.margin, yPosition);
        
        yPosition += 8;
        
        // Fondo para transferencia bancaria
        doc.setFillColor(240, 248, 255); // Azul muy claro
        doc.roundedRect(PDF_CONFIG.margin, yPosition, pageWidth - (PDF_CONFIG.margin * 2), 40, 3, 3, 'F');
        
        doc.setDrawColor(26, 54, 93); // Color primario
        doc.setLineWidth(0.5);
        doc.roundedRect(PDF_CONFIG.margin, yPosition, pageWidth - (PDF_CONFIG.margin * 2), 40, 3, 3, 'S');
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        // Datos de transferencia bancaria
        doc.setFont('helvetica', 'bold');
        doc.text(`${getText('transferBank')}:`, PDF_CONFIG.margin + 8, yPosition + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(PDF_CONFIG.bankDetails.banco, PDF_CONFIG.margin + 35, yPosition + 8);
        
        yPosition += 8;
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${getText('transferHolder')}:`, PDF_CONFIG.margin + 8, yPosition + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(PDF_CONFIG.bankDetails.titular, PDF_CONFIG.margin + 35, yPosition + 8);
        
        yPosition += 8;
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${getText('transferId')}:`, PDF_CONFIG.margin + 8, yPosition + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(PDF_CONFIG.bankDetails.cedula, PDF_CONFIG.margin + 35, yPosition + 8);
        
        yPosition += 8;
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${getText('transferAccountType')}:`, PDF_CONFIG.margin + 8, yPosition + 8);
        doc.setFont('helvetica', 'normal');
        doc.text('Corriente', PDF_CONFIG.margin + 35, yPosition + 8);
        
        yPosition += 8;
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${getText('transferAccountNumber')}:`, PDF_CONFIG.margin + 8, yPosition + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(PDF_CONFIG.bankDetails.cuentaCorriente, PDF_CONFIG.margin + 35, yPosition + 8);
        
        yPosition += 50;
        
        // DATOS PARA PAGO MÓVIL
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...PDF_CONFIG.primaryColor);
        doc.text(getText('mobileTitle'), PDF_CONFIG.margin, yPosition);
        
        yPosition += 8;
        
        // Fondo para pago móvil (color diferente para diferenciar)
        doc.setFillColor(240, 255, 240); // Verde muy claro
        doc.roundedRect(PDF_CONFIG.margin, yPosition, pageWidth - (PDF_CONFIG.margin * 2), 40, 3, 3, 'F');
        
        doc.setDrawColor(26, 93, 26); // Verde oscuro para diferenciar
        doc.setLineWidth(0.5);
        doc.roundedRect(PDF_CONFIG.margin, yPosition, pageWidth - (PDF_CONFIG.margin * 2), 40, 3, 3, 'S');
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        // Datos de pago móvil
        doc.setFont('helvetica', 'bold');
        doc.text(`${getText('mobileBank')}:`, PDF_CONFIG.margin + 8, yPosition + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(PDF_CONFIG.bankDetails.banco, PDF_CONFIG.margin + 35, yPosition + 8);
        
        yPosition += 8;
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${getText('mobilePhone')}:`, PDF_CONFIG.margin + 8, yPosition + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(PDF_CONFIG.bankDetails.telefono, PDF_CONFIG.margin + 35, yPosition + 8);
        
        yPosition += 8;
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${getText('mobileId')}:`, PDF_CONFIG.margin + 8, yPosition + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(PDF_CONFIG.bankDetails.cedula, PDF_CONFIG.margin + 35, yPosition + 8);
        
        yPosition += 8;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Alias:', PDF_CONFIG.margin + 8, yPosition + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(PDF_CONFIG.bankDetails.alias, PDF_CONFIG.margin + 35, yPosition + 8);
        
        yPosition += 50;
        
        // NOTAS IMPORTANTES
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(33, 37, 41); // Gris oscuro
        doc.text(getText('importantNotes'), PDF_CONFIG.margin, yPosition);
        
        yPosition += 8;
        
        const notes = [
            `✓ ${getText('sendProof')}`,
            `✓ ${getText('responseTime')}`,
            `✓ ${getText('warranty')}`,
            `✓ ${getText('support')}`,
            `✓ ${getText('securityWarning')}`
        ];
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(73, 80, 87); // Gris
        
        notes.forEach((note, index) => {
            const noteY = yPosition + (index * 5);
            if (noteY > pageHeight - 20) {
                doc.addPage();
                // Agregar marca de agua a páginas nuevas
                await addImageWatermark(doc, pageWidth, pageHeight);
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
        doc.text(getText('thankYou'), 
                pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 5;
        doc.text(getText('company'), 
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

// Validación de datos mejorada
function validateOrderData(orderData) {
    const errors = [];
    
    if (!orderData.orderNumber) errors.push('Número de pedido requerido');
    if (!orderData.customer?.name) errors.push('Nombre del cliente requerido');
    if (!orderData.items || orderData.items.length === 0) errors.push('El pedido debe tener items');
    
    // Validar precios
    orderData.items.forEach((item, index) => {
        if (item.total <= 0) errors.push(`Item ${index + 1}: Precio inválido`);
    });
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// Track de uso (analytics) mejorado
function trackPDFGeneration(orderData, doc) {
    const stats = {
        orderNumber: orderData.orderNumber,
        timestamp: new Date().toISOString(),
        itemCount: orderData.items.length,
        totalAmount: orderData.totals.total,
        pageCount: doc.internal.getNumberOfPages(),
        generationTime: performance.now() - window.pdfStartTime,
        language: PDF_CONFIG.language,
        hasLogo: IMAGE_CACHE[PDF_CONFIG.logoUrl] ? true : false,
        hasWatermark: IMAGE_CACHE[PDF_CONFIG.watermarkUrl] ? true : false
    };
    
    // Guardar en localStorage
    const history = JSON.parse(localStorage.getItem('pdf_generation_history') || '[]');
    history.unshift(stats);
    if (history.length > 100) history.pop();
    localStorage.setItem('pdf_generation_history', JSON.stringify(history));
    
    pdfLogger.info(`Estadísticas: ${JSON.stringify(stats)}`);
    
    // Opcional: Enviar a analytics
    if (window.ga) {
        window.ga('send', 'event', 'PDF', 'generate', stats);
    }
    
    return stats;
}

// Función para cambiar de idioma
function setPDFLanguage(lang) {
    if (LANGUAGES[lang]) {
        PDF_CONFIG.language = lang;
        return true;
    }
    return false;
}

// Función principal para generar PDF
async function generateOrderPDF(orderData) {
    try {
        const startTime = performance.now();
        pdfLogger.info(`Generando PDF para pedido: ${orderData.orderNumber}`);
        
        // Validar datos
        const validation = validateOrderData(orderData);
        if (!validation.isValid) {
            pdfLogger.error('Datos inválidos:', validation.errors);
            throw new Error(`Datos del pedido inválidos: ${validation.errors.join(', ')}`);
        }
        
        const jsPDF = getJSPDF();
        const doc = new jsPDF({
            unit: 'mm',
            format: 'a4',
            compress: PDF_CONFIG.compress
        });
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Agregar marca de agua en primera página
        await addImageWatermark(doc, pageWidth, pageHeight);
        
        // Encabezado con logo
        await addHeader(doc, pageWidth);
        
        let yPosition = PDF_CONFIG.headerHeight + 5;
        
        // Información del pedido
        yPosition = addOrderInfo(doc, yPosition, orderData, pageWidth);
        
        // Datos del cliente
        yPosition = addCustomerInfo(doc, yPosition, orderData, pageWidth);
        
        // Detalle del pedido
        yPosition = await addOrderDetails(doc, yPosition, orderData, pageWidth, pageHeight);
        
        // Resumen de pago
        yPosition = addPaymentSummary(doc, yPosition, orderData, pageWidth);
        
        // Datos bancarios y notas finales
        await addBankDetailsAndNotes(doc, yPosition, orderData, pageWidth, pageHeight);
        
        // Track de generación
        trackPDFGeneration(orderData, doc);
        
        const endTime = performance.now();
        pdfLogger.info(`PDF generado en ${(endTime - startTime).toFixed(2)}ms`);
        
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

// Función para vista previa del PDF
async function previewPDF(orderData) {
    try {
        const doc = await generateOrderPDF(orderData);
        
        // Crear ventana de previsualización
        const pdfWindow = window.open();
        const pdfData = doc.output('datauristring');
        
        pdfWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Vista previa - Pedido ${orderData.orderNumber}</title>
                <style>
                    body { margin: 0; padding: 20px; background: #f5f5f5; }
                    iframe { width: 100%; height: calc(100vh - 40px); border: none; }
                    .toolbar { 
                        background: white; padding: 10px; margin-bottom: 10px;
                        border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                        display: flex; gap: 10px;
                    }
                    button { 
                        padding: 8px 15px; border: none; border-radius: 4px;
                        cursor: pointer; background: #1a365d; color: white;
                    }
                </style>
            </head>
            <body>
                <div class="toolbar">
                    <button onclick="window.print()">🖨️ Imprimir</button>
                    <button onclick="window.close()">❌ Cerrar</button>
                    <span style="margin-left: auto; font-weight: bold;">
                        Pedido: ${orderData.orderNumber}
                    </span>
                </div>
                <iframe src="${pdfData}"></iframe>
            </body>
            </html>
        `);
        
    } catch (error) {
        pdfLogger.error('Error en previsualización:', error);
        showPDFNotification('Error al generar vista previa', 'error');
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
    window.previewPDF = previewPDF;
    window.preparePDFData = preparePDFData;
    window.getPaymentMethodName = getPaymentMethodName;
    window.getGreetingByTime = getGreetingByTime;
    window.toTitleCase = toTitleCase;
    window.setPDFLanguage = setPDFLanguage;
    window.PDF_CONFIG = PDF_CONFIG;
    window.showPDFNotification = showPDFNotification;
    window.validateOrderData = validateOrderData;
}

// Si es módulo, exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateOrderPDF,
        downloadOrderPDF,
        previewPDF,
        preparePDFData,
        getPaymentMethodName,
        getGreetingByTime,
        toTitleCase,
        PDF_CONFIG,
        validateOrderData,
        trackPDFGeneration,
        setPDFLanguage,
        showPDFNotification
    };
}

// Función para probar las URLs de imágenes
async function testImageUrls() {
    console.log('🔍 Probando URLs de imágenes...');
    
    const testUrls = [
        { name: 'Logo PNG', url: PDF_CONFIG.logoUrl },
        { name: 'Marca de Agua JPG', url: PDF_CONFIG.watermarkUrl }
    ];
    
    for (const test of testUrls) {
        try {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    console.log(`✅ ${test.name}: Cargado (${img.width}x${img.height})`);
                    resolve();
                };
                img.onerror = () => {
                    console.error(`❌ ${test.name}: Error de carga`);
                    reject();
                };
                img.src = getProxiedUrl(test.url);
            });
        } catch (error) {
            console.warn(`⚠️ ${test.name}: No se pudo cargar - ${error.message}`);
        }
    }
}

// Ejecutar prueba después de 1 segundo
setTimeout(testImageUrls, 1000);