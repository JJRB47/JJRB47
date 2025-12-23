// rates-panel.js - Archivo para manejar las tasas de cambio BCV con BCV oficial via DolarApi
document.addEventListener('DOMContentLoaded', function() {
    // Variables globales para las tasas
    let currentUSDRate = 0;
    let currentEURRate = 0;
    let lastUpdateTime = null;
    
    // Eliminar el botón de actualización manual del DOM
    const refreshButton = document.getElementById('panel-refresh');
    if (refreshButton) {
        refreshButton.remove();
        console.log('✅ Botón de actualización manual eliminado');
    }
    
    // Fuentes de API: Prioridad 1 es DolarApi (BCV Oficial)
    const API_SOURCES = [
        'https://ve.dolarapi.com/v1/dolares/oficial',      // BCV Oficial - Dólar
        'https://s3.amazonaws.com/dolartoday/data.json',   // Respaldo DolarToday
        'https://api.exchangerate-api.com/v4/latest/USD'   // Respaldo ExchangeRate
    ];
    
    // Función para obtener las tasas de cambio BCV con BCV oficial como prioridad
    async function getBCVRates() {
        let success = false;
        let apiUsed = '';
        
        // Notificar que se está actualizando
        const panel = document.querySelector('.panel-paper');
        if (panel) panel.classList.add('updating');
        
        for (const apiUrl of API_SOURCES) {
            try {
                // Configurar timeout para evitar esperas infinitas
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                
                const response = await fetch(apiUrl, {
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`API ${apiUrl} respondió con estado: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Procesar datos según la fuente
                let usdRate = 0;
                let eurRate = 0;
                
                if (apiUrl.includes('ve.dolarapi.com')) {
                    // --- LÓGICA PARA DOLARAPI (BCV OFICIAL) ---
                    usdRate = parseFloat(data.promedio) || 
                              parseFloat(data.precio) || 
                              parseFloat(data.venta) || 
                              36.50;
                    
                    // Para el euro, estimamos basado en el dólar (relación aproximada 1 USD = 0.92 EUR)
                    eurRate = usdRate / 0.92; // Tasa aproximada
                    
                } else if (apiUrl.includes('dolartoday')) {
                    // --- LÓGICA PARA DOLARTODAY (RESPALDO) ---
                    usdRate = parseFloat(data?.USD?.promedio) || 
                             parseFloat(data?.USD?.sicad2) || 
                             parseFloat(data?.USD?.dolartoday) || 
                             36.50;
                    
                    eurRate = parseFloat(data?.EUR?.promedio) || 
                             parseFloat(data?.EUR?.dolartoday) || 
                             39.50;
                    
                } else if (apiUrl.includes('exchangerate-api')) {
                    // --- LÓGICA PARA EXCHANGERATE-API (RESPALDO) ---
                    // Esta API devuelve tasas internacionales, no BCV
                    // Convertimos a tasa BCV estimada
                    if (data.rates && data.rates.VES) {
                        usdRate = 1 / parseFloat(data.rates.VES);
                        eurRate = data.rates.EUR ? (data.rates.EUR / data.rates.VES) : usdRate * 0.92;
                    } else {
                        usdRate = 36.50;
                        eurRate = 39.50;
                    }
                }
                
                // Validar que las tasas sean válidas
                if (usdRate > 0 && eurRate > 0) {
                    // Guardar tasas en variables globales
                    currentUSDRate = usdRate;
                    currentEURRate = eurRate;
                    lastUpdateTime = new Date();
                    
                    // Formatear las tasas con 2 decimales
                    const formattedUSD = currentUSDRate.toFixed(2);
                    const formattedEUR = currentEURRate.toFixed(2);
                    
                    // Actualizar los elementos del DOM con las tasas
                    document.getElementById('panel-usd-rate').textContent = `Bs. ${formattedUSD}`;
                    document.getElementById('panel-eur-rate').textContent = `Bs. ${formattedEUR}`;
                    
                    // Actualizar fecha y hora
                    updateDateTime();
                    
                    // Actualizar convertidor (solo USD)
                    updateConverter();
                    
                    // Remover indicador offline si existe
                    const offlineIndicator = document.querySelector('.offline-indicator');
                    if (offlineIndicator) {
                        offlineIndicator.remove();
                    }
                    
                    // Determinar fuente usada para el log
                    if (apiUrl.includes('ve.dolarapi.com')) {
                        apiUsed = 'BCV Oficial (DolarApi)';
                    } else if (apiUrl.includes('dolartoday')) {
                        apiUsed = 'DolarToday';
                    } else {
                        apiUsed = 'ExchangeRate-API';
                    }
                    
                    console.log(`✅ Tasas BCV obtenidas de: ${apiUsed}`);
                    console.log(`   USD: Bs. ${formattedUSD} | EUR: Bs. ${formattedEUR}`);
                    
                    success = true;
                    break; // Salir del bucle si tuvo éxito
                }
                
            } catch (error) {
                console.warn(`⚠️ Error con API ${apiUrl}:`, error.message);
                // Continuar con la siguiente API
            }
        }
        
        // Si todas las APIs fallan, usar valores por defecto
        if (!success) {
            console.warn('⚠️ Todas las APIs fallaron, usando valores por defecto del BCV');
            
            currentUSDRate = 36.50;
            currentEURRate = 39.50;
            lastUpdateTime = new Date();
            
            const formattedUSD = currentUSDRate.toFixed(2);
            const formattedEUR = currentEURRate.toFixed(2);
            
            document.getElementById('panel-usd-rate').textContent = `Bs. ${formattedUSD}`;
            document.getElementById('panel-eur-rate').textContent = `Bs. ${formattedEUR}`;
            
            updateDateTime();
            updateConverter();
            
            // Mostrar indicador de modo offline
            const panelHeader = document.querySelector('.panel-header');
            const offlineIndicator = document.createElement('span');
            offlineIndicator.className = 'offline-indicator';
            offlineIndicator.textContent = ' (Offline)';
            offlineIndicator.style.color = '#ff6b6b';
            offlineIndicator.style.fontSize = '0.8em';
            offlineIndicator.style.marginLeft = '5px';
            
            if (!document.querySelector('.offline-indicator')) {
                panelHeader.querySelector('span').appendChild(offlineIndicator);
            }
            
            // Mostrar notificación de error
            showTasaNotification('⚠️ Modo offline: Tasas BCV por defecto', 'warning');
        } else {
            // Mostrar notificación de éxito
            showTasaNotification(`✅ Tasas BCV actualizadas desde ${apiUsed}`, 'success');
            
            // Disparar evento para que otros componentes se actualicen
            document.dispatchEvent(new CustomEvent('ratesUpdated', { 
                detail: { 
                    usd: currentUSDRate, 
                    eur: currentEURRate,
                    source: apiUsed
                } 
            }));
        }
        
        // Quitar animación de actualización
        if (panel) {
            setTimeout(() => {
                panel.classList.remove('updating');
            }, 1000);
        }
    }
    
    // Función para actualizar fecha y hora
    function updateDateTime() {
        const now = lastUpdateTime || new Date();
        
        const dateStr = now.toLocaleDateString('es-VE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        document.getElementById('panel-usd-date').textContent = dateStr;
        document.getElementById('panel-eur-date').textContent = dateStr;
        
        const timeStr = now.toLocaleTimeString('es-VE', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        document.getElementById('panel-last-update').textContent = timeStr;
    }
    
    // Función para actualizar el convertidor (SOLO USD↔Bs)
    function updateConverter() {
        // Verificar que la tasa sea válida
        if (currentUSDRate <= 0) {
            console.warn('⚠️ Tasa USD no válida para el convertidor');
            return;
        }
        
        // Obtener valores de los inputs (solo USD)
        const usdToBsInput = document.getElementById('convert-usd-to-bs');
        const bsToUsdInput = document.getElementById('convert-bs-to-usd');
        
        // Convertir USD a Bs
        if (usdToBsInput && usdToBsInput.value) {
            const usdAmount = parseFloat(usdToBsInput.value) || 0;
            const result = usdAmount * currentUSDRate;
            const resultElement = document.getElementById('convert-usd-to-bs-result');
            if (resultElement) {
                resultElement.textContent = `Bs. ${result.toFixed(2)}`;
                resultElement.setAttribute('aria-label', `Resultado: ${result.toFixed(2)} Bolívares`);
            }
        }
        
        // Convertir Bs a USD
        if (bsToUsdInput && bsToUsdInput.value) {
            const bsAmount = parseFloat(bsToUsdInput.value) || 0;
            const result = currentUSDRate > 0 ? bsAmount / currentUSDRate : 0;
            const resultElement = document.getElementById('convert-bs-to-usd-result');
            if (resultElement) {
                resultElement.textContent = `$ ${result.toFixed(2)}`;
                resultElement.setAttribute('aria-label', `Resultado: ${result.toFixed(2)} Dólares`);
            }
        }
    }
    
    // Función para inicializar el convertidor (SOLO USD↔Bs)
    function initializeConverter() {
        // Crear el HTML del convertidor si no existe
        if (!document.getElementById('currency-converter')) {
            const converterHTML = `
                <div class="converter-container" id="currency-converter">
                    <div class="converter-header">
                        <i class="fas fa-exchange-alt"></i>
                        <span>Convertidor USD ↔ Bs</span>
                        <button class="converter-toggle" id="converter-toggle" aria-label="Mostrar/ocultar convertidor">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                    <div class="converter-content" id="converter-content">
                        <div class="converter-grid">
                            <div class="converter-item">
                                <div class="converter-label">
                                    <i class="fas fa-dollar-sign"></i>
                                    <span>USD → Bs</span>
                                    <small class="converter-rate">1 USD = ${currentUSDRate.toFixed(2)} Bs</small>
                                </div>
                                <div class="converter-input-group">
                                    <input type="number" id="convert-usd-to-bs" class="converter-input" 
                                           placeholder="0.00" min="0" step="0.01" aria-label="Cantidad en Dólares">
                                    <span class="converter-arrow">→</span>
                                    <span class="converter-result" id="convert-usd-to-bs-result">Bs. 0.00</span>
                                </div>
                            </div>
                            
                            <div class="converter-item">
                                <div class="converter-label">
                                    <i class="fas fa-bolivar-sign"></i>
                                    <span>Bs → USD</span>
                                    <small class="converter-rate">1 Bs = $ ${(1/currentUSDRate).toFixed(4)}</small>
                                </div>
                                <div class="converter-input-group">
                                    <input type="number" id="convert-bs-to-usd" class="converter-input" 
                                           placeholder="0.00" min="0" step="0.01" aria-label="Cantidad en Bolívares">
                                    <span class="converter-arrow">→</span>
                                    <span class="converter-result" id="convert-bs-to-usd-result">$ 0.00</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="converter-info">
                            <i class="fas fa-info-circle"></i>
                            <span>Conversión basada en tasa oficial del BCV: 1 USD = ${currentUSDRate.toFixed(2)} Bs</span>
                        </div>
                        
                        <button class="clear-converter-btn" id="clear-converter">
                            <i class="fas fa-broom"></i> Limpiar Convertidor
                        </button>
                    </div>
                </div>
            `;
            
            // Insertar el convertidor después del panel de tasas
            const exchangePanel = document.querySelector('.exchange-panel');
            if (exchangePanel) {
                const panelPaper = exchangePanel.querySelector('.panel-paper');
                if (panelPaper) {
                    panelPaper.insertAdjacentHTML('beforeend', converterHTML);
                    
                    // Configurar event listeners
                    setupConverterListeners();
                }
            }
        }
    }
    
    // Configurar listeners del convertidor
    function setupConverterListeners() {
        // Event listeners para los inputs (solo USD)
        document.querySelectorAll('.converter-input').forEach(input => {
            input.addEventListener('input', updateConverter);
            input.addEventListener('keyup', updateConverter);
            input.addEventListener('change', updateConverter);
        });
        
        // Configurar toggle del convertidor
        const converterToggle = document.getElementById('converter-toggle');
        const converterContent = document.getElementById('converter-content');
        
        if (converterToggle && converterContent) {
            converterToggle.addEventListener('click', function() {
                const isHidden = converterContent.style.display === 'none';
                converterContent.style.display = isHidden ? 'block' : 'none';
                this.querySelector('i').className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
                this.setAttribute('aria-label', isHidden ? 'Ocultar convertidor' : 'Mostrar convertidor');
                
                // Guardar preferencia en localStorage
                localStorage.setItem('converter-visible', isHidden ? 'true' : 'false');
                
                // Animar la transición
                if (isHidden) {
                    converterContent.style.animation = 'fadeIn 0.3s ease';
                }
            });
            
            // Restaurar estado del convertidor
            const converterVisible = localStorage.getItem('converter-visible') !== 'false';
            converterContent.style.display = converterVisible ? 'block' : 'none';
            converterToggle.querySelector('i').className = converterVisible ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
        }
        
        // Botón para limpiar convertidor
        const clearButton = document.getElementById('clear-converter');
        if (clearButton) {
            clearButton.addEventListener('click', function() {
                document.querySelectorAll('.converter-input').forEach(input => {
                    input.value = '';
                });
                
                document.querySelectorAll('.converter-result').forEach(result => {
                    if (result.id.includes('usd-to-bs')) {
                        result.textContent = 'Bs. 0.00';
                    } else if (result.id.includes('bs-to-usd')) {
                        result.textContent = '$ 0.00';
                    }
                });
                
                showTasaNotification('Convertidor limpiado', 'success');
            });
        }
    }
    
    // Función para mostrar notificaciones de tasas
    function showTasaNotification(message, type = 'info') {
        // Remover notificaciones anteriores
        document.querySelectorAll('.tasa-notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `tasa-notification ${type}`;
        notification.textContent = message;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        
        const panelPaper = document.querySelector('.panel-paper');
        if (panelPaper) {
            panelPaper.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateY(-10px)';
                    setTimeout(() => notification.remove(), 300);
                }
            }, 3000);
        }
    }
    
    // Agregar estilos CSS dinámicamente
    function addConverterStyles() {
        if (!document.querySelector('#tasa-converter-styles')) {
            const style = document.createElement('style');
            style.id = 'tasa-converter-styles';
            style.textContent = `
                /* Estilos para panel sin botón de actualizar */
                .panel-header {
                    justify-content: center !important;
                }
                
                .panel-header > i {
                    margin-right: 10px;
                }
                
                .panel-header > span {
                    text-align: center;
                }
                
                .converter-container {
                    margin-top: 25px;
                    padding-top: 20px;
                    border-top: 1px solid var(--border-light);
                }
                
                .converter-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 15px;
                    cursor: pointer;
                    user-select: none;
                    padding: 10px;
                    border-radius: 8px;
                    background: rgba(42, 55, 85, 0.3);
                    transition: var(--transition);
                }
                
                .converter-header:hover {
                    background: rgba(42, 55, 85, 0.5);
                }
                
                .converter-header i:first-child {
                    color: var(--accent-color);
                    margin-right: 10px;
                }
                
                .converter-header span {
                    font-weight: 600;
                    color: var(--text-light);
                    flex-grow: 1;
                }
                
                .converter-toggle {
                    background: transparent;
                    border: none;
                    color: var(--accent-color);
                    cursor: pointer;
                    padding: 5px 10px;
                    border-radius: 5px;
                    transition: var(--transition);
                }
                
                .converter-toggle:hover {
                    background: rgba(212, 175, 55, 0.1);
                }
                
                .converter-content {
                    display: block;
                    animation: fadeIn 0.3s ease;
                }
                
                .converter-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                    margin-bottom: 15px;
                }
                
                .converter-item {
                    background: rgba(42, 55, 85, 0.3);
                    border-radius: 10px;
                    padding: 15px;
                    border: 1px solid rgba(212, 175, 55, 0.1);
                    transition: var(--transition);
                }
                
                .converter-item:hover {
                    border-color: rgba(212, 175, 55, 0.3);
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                }
                
                .converter-label {
                    display: flex;
                    flex-direction: column;
                    margin-bottom: 10px;
                }
                
                .converter-label > span {
                    font-weight: 600;
                    color: var(--text-light);
                    font-size: 1em;
                }
                
                .converter-label i {
                    color: var(--accent-color);
                    font-size: 1.2em;
                    margin-bottom: 5px;
                }
                
                .converter-rate {
                    color: var(--text-gray);
                    font-size: 0.8em;
                    margin-top: 3px;
                    opacity: 0.8;
                }
                
                .converter-input-group {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .converter-input {
                    flex: 1;
                    padding: 10px 12px;
                    border-radius: 8px;
                    border: 1px solid var(--border-light);
                    background: rgba(42, 55, 85, 0.5);
                    color: var(--text-light);
                    font-family: 'Raleway', sans-serif;
                    font-size: 14px;
                    transition: var(--transition);
                }
                
                .converter-input:focus {
                    outline: none;
                    border-color: var(--accent-color);
                    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
                }
                
                .converter-arrow {
                    color: var(--accent-color);
                    font-weight: bold;
                    font-size: 16px;
                    min-width: 20px;
                    text-align: center;
                }
                
                .converter-result {
                    min-width: 100px;
                    text-align: center;
                    font-weight: 600;
                    color: var(--accent-color);
                    padding: 8px 12px;
                    background: rgba(212, 175, 55, 0.1);
                    border-radius: 6px;
                    border: 1px solid rgba(212, 175, 55, 0.2);
                    word-break: break-all;
                }
                
                .converter-info {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 0.85em;
                    color: var(--text-gray);
                    margin-top: 15px;
                    padding: 12px;
                    background: rgba(42, 55, 85, 0.2);
                    border-radius: 8px;
                    border-left: 3px solid var(--accent-color);
                    text-align: center;
                }
                
                .converter-info i {
                    color: var(--accent-color);
                    flex-shrink: 0;
                }
                
                .clear-converter-btn {
                    display: block;
                    width: 100%;
                    margin: 15px auto 0;
                    padding: 10px;
                    background: rgba(66, 133, 244, 0.1);
                    color: #4285f4;
                    border: 1px solid rgba(66, 133, 244, 0.3);
                    border-radius: 8px;
                    cursor: pointer;
                    font-family: 'Raleway', sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    transition: var(--transition);
                }
                
                .clear-converter-btn:hover {
                    background: rgba(66, 133, 244, 0.2);
                    transform: translateY(-2px);
                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
                }
                
                .clear-converter-btn i {
                    margin-right: 8px;
                }
                
                .tasa-notification {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    padding: 8px 16px;
                    border-radius: 8px;
                    background: var(--primary-color);
                    color: white;
                    font-size: 0.9em;
                    z-index: 100;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    border: 1px solid var(--border-light);
                    animation: slideIn 0.3s ease;
                    transition: opacity 0.3s, transform 0.3s;
                    max-width: 300px;
                }
                
                .tasa-notification.success {
                    background: var(--success-color);
                    border-color: rgba(76, 175, 80, 0.3);
                }
                
                .tasa-notification.warning {
                    background: var(--warning-color);
                    border-color: rgba(255, 152, 0, 0.3);
                }
                
                .tasa-notification.error {
                    background: var(--error-color);
                    border-color: rgba(244, 67, 54, 0.3);
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .offline-indicator {
                    animation: blink 2s infinite;
                }
                
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                /* Responsive */
                @media (max-width: 768px) {
                    .converter-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .converter-input-group {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 8px;
                    }
                    
                    .converter-input {
                        width: 100%;
                    }
                    
                    .converter-arrow {
                        display: none;
                    }
                    
                    .converter-result {
                        text-align: center;
                        min-width: auto;
                        width: 100%;
                    }
                    
                    .tasa-notification {
                        top: 5px;
                        right: 5px;
                        left: 5px;
                        max-width: none;
                    }
                }
                
                @media (max-width: 480px) {
                    .converter-item {
                        padding: 12px;
                    }
                    
                    .tasa-notification {
                        font-size: 0.8em;
                        padding: 6px 12px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Inicializar todo
    function initializeTasaPanel() {
        // Agregar estilos
        addConverterStyles();
        
        // Obtener tasas iniciales automáticamente al cargar
        getBCVRates();
        
        // Inicializar convertidor después de obtener tasas
        setTimeout(() => {
            initializeConverter();
        }, 1000);
        
        // Actualizar automáticamente cada 5 minutos (300000 ms)
        setInterval(getBCVRates, 300000);
        
        // Escuchar evento de actualización de tasas
        document.addEventListener('ratesUpdated', function(e) {
            console.log('📈 Tasas BCV actualizadas:', e.detail);
            updateConverter();
        });
        
        console.log('✅ Panel de tasas BCV inicializado - Convertidor USD↔Bs solamente');
    }
    
    // Inicializar cuando el DOM esté listo
    initializeTasaPanel();
    
    // Exportar funciones para uso externo
    window.getCurrentRates = function() {
        return {
            usd: currentUSDRate,
            eur: currentEURRate,
            lastUpdate: lastUpdateTime,
            source: 'BCV Oficial via DolarApi'
        };
    };
    
    // Función para formatear precio según tasa BCV
    window.formatPriceBCV = function(priceUSD) {
        const total = priceUSD * currentUSDRate;
        return {
            usd: `$${priceUSD.toFixed(2)}`,
            bs: `Bs. ${total.toFixed(2)}`,
            rate: currentUSDRate
        };
    };
});
