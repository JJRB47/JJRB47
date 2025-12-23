// =======================================================================
// rates-panel.js - Panel de Tasas BCV con Simetría Perfecta
// Versión: 2.0 - Alineación Visual Total
// =======================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Variables globales para las tasas
    let currentUSDRate = 0;
    let currentEURRate = 0;
    let lastUpdateTime = null;
    
    // Variables para el convertidor
    let converterVisible = true;
    
    // Eliminar el botón de actualización manual del DOM
    const refreshButton = document.getElementById('panel-refresh');
    if (refreshButton) {
        refreshButton.remove();
        console.log('✅ Botón de actualización manual eliminado');
    }
    
    // Fuentes de API: Prioridad 1 es DolarApi (BCV Oficial)
    const API_SOURCES = [
        {
            name: 'BCV Oficial (DolarApi)',
            url: 'https://ve.dolarapi.com/v1/dolares/oficial',
            processor: function(data) {
                return {
                    usd: parseFloat(data.promedio) || 
                         parseFloat(data.precio) || 
                         parseFloat(data.venta) || 
                         36.50,
                    eur: null // Se calculará basado en USD
                };
            }
        },
        {
            name: 'DolarToday (Respaldo)',
            url: 'https://s3.amazonaws.com/dolartoday/data.json',
            processor: function(data) {
                return {
                    usd: parseFloat(data?.USD?.promedio) || 
                         parseFloat(data?.USD?.sicad2) || 
                         parseFloat(data?.USD?.dolartoday) || 
                         36.50,
                    eur: parseFloat(data?.EUR?.promedio) || 
                         parseFloat(data?.EUR?.dolartoday) || 
                         39.50
                };
            }
        },
        {
            name: 'ExchangeRate-API (Respaldo)',
            url: 'https://api.exchangerate-api.com/v4/latest/USD',
            processor: function(data) {
                if (data.rates && data.rates.VES) {
                    const usdRate = 1 / parseFloat(data.rates.VES);
                    const eurRate = data.rates.EUR ? (data.rates.EUR / data.rates.VES) : usdRate * 0.92;
                    return { usd: usdRate, eur: eurRate };
                }
                return { usd: 36.50, eur: 39.50 };
            }
        }
    ];
    
    // =======================================================================
    // FUNCIONES PRINCIPALES
    // =======================================================================
    
    // Función para obtener las tasas de cambio BCV
    async function getBCVRates() {
        let success = false;
        let apiUsed = '';
        let rates = { usd: 0, eur: 0 };
        
        // Notificar que se está actualizando
        const panel = document.querySelector('.panel-paper');
        if (panel) panel.classList.add('updating');
        
        // Intentar cada fuente de API
        for (const apiSource of API_SOURCES) {
            try {
                console.log(`🔄 Intentando API: ${apiSource.name}`);
                
                // Configurar timeout para evitar esperas infinitas
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const response = await fetch(apiSource.url, {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`API ${apiSource.name} respondió con estado: ${response.status}`);
                }
                
                const data = await response.json();
                rates = apiSource.processor(data);
                
                // Si EUR es null, calcular basado en USD (relación aproximada)
                if (rates.eur === null && rates.usd > 0) {
                    rates.eur = rates.usd * 1.08; // 1 USD ≈ 0.92 EUR → 1 EUR ≈ 1.08 USD
                }
                
                // Validar que las tasas sean válidas
                if (rates.usd > 0 && rates.eur > 0) {
                    // Guardar tasas en variables globales
                    currentUSDRate = rates.usd;
                    currentEURRate = rates.eur;
                    lastUpdateTime = new Date();
                    
                    // Formatear las tasas con 2 decimales FIJOS (para simetría)
                    const formattedUSD = formatNumber(currentUSDRate, 2);
                    const formattedEUR = formatNumber(currentEURRate, 2);
                    
                    // Actualizar los elementos del DOM con las tasas
                    updateRateDisplay('panel-usd-rate', `Bs. ${formattedUSD}`);
                    updateRateDisplay('panel-eur-rate', `Bs. ${formattedEUR}`);
                    
                    // Actualizar fecha y hora
                    updateDateTime();
                    
                    // Actualizar convertidor (solo USD)
                    updateConverter();
                    
                    // Remover indicador offline si existe
                    const offlineIndicator = document.querySelector('.offline-indicator');
                    if (offlineIndicator) {
                        offlineIndicator.remove();
                    }
                    
                    apiUsed = apiSource.name;
                    console.log(`✅ Tasas BCV obtenidas de: ${apiUsed}`);
                    console.log(`   USD: Bs. ${formattedUSD} | EUR: Bs. ${formattedEUR}`);
                    
                    success = true;
                    break; // Salir del bucle si tuvo éxito
                }
                
            } catch (error) {
                console.warn(`⚠️ Error con API ${apiSource.name}:`, error.message);
                // Continuar con la siguiente API
            }
        }
        
        // Si todas las APIs fallan, usar valores por defecto
        if (!success) {
            console.warn('⚠️ Todas las APIs fallaron, usando valores por defecto del BCV');
            
            currentUSDRate = 36.50;
            currentEURRate = 39.50;
            lastUpdateTime = new Date();
            
            const formattedUSD = formatNumber(currentUSDRate, 2);
            const formattedEUR = formatNumber(currentEURRate, 2);
            
            updateRateDisplay('panel-usd-rate', `Bs. ${formattedUSD}`);
            updateRateDisplay('panel-eur-rate', `Bs. ${formattedEUR}`);
            
            updateDateTime();
            updateConverter();
            
            // Mostrar indicador de modo offline
            showOfflineIndicator();
            
            // Mostrar notificación de error
            showTasaNotification('⚠️ Modo offline: Tasas BCV por defecto', 'warning');
        } else {
            // Mostrar notificación de éxito
            showTasaNotification(`✅ Tasas actualizadas: ${apiUsed}`, 'success');
            
            // Disparar evento para que otros componentes se actualicen
            document.dispatchEvent(new CustomEvent('ratesUpdated', { 
                detail: { 
                    usd: currentUSDRate, 
                    eur: currentEURRate,
                    source: apiUsed,
                    timestamp: lastUpdateTime
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
    
    // Función para actualizar la visualización de una tasa con animación
    function updateRateDisplay(elementId, value) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Agregar clase de animación
        element.classList.add('updating-number');
        
        // Actualizar valor
        element.textContent = value;
        
        // Eliminar clase después de la animación
        setTimeout(() => {
            element.classList.remove('updating-number');
        }, 300);
    }
    
    // Función para formatear números con decimales fijos
    function formatNumber(num, decimals = 2) {
        return parseFloat(num).toFixed(decimals);
    }
    
    // Función para actualizar fecha y hora
    function updateDateTime() {
        const now = lastUpdateTime || new Date();
        
        const dateStr = now.toLocaleDateString('es-VE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        const dateElements = [
            'panel-usd-date',
            'panel-eur-date'
        ];
        
        dateElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = dateStr;
        });
        
        const timeStr = now.toLocaleTimeString('es-VE', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const timeElement = document.getElementById('panel-last-update');
        if (timeElement) timeElement.textContent = timeStr;
    }
    
    // Función para mostrar indicador offline
    function showOfflineIndicator() {
        const panelHeader = document.querySelector('.panel-header');
        if (!panelHeader || document.querySelector('.offline-indicator')) return;
        
        const offlineIndicator = document.createElement('span');
        offlineIndicator.className = 'offline-indicator';
        offlineIndicator.textContent = ' (Offline)';
        offlineIndicator.style.cssText = `
            color: var(--warning-color);
            font-size: 0.8em;
            margin-left: 5px;
            font-weight: 500;
        `;
        
        panelHeader.querySelector('span').appendChild(offlineIndicator);
    }
    
    // =======================================================================
    // CONVERTIDOR DE DIVISAS (USD ↔ Bs)
    // =======================================================================
    
    // Función para actualizar el convertidor (SOLO USD↔Bs)
    function updateConverter() {
        // Verificar que la tasa sea válida
        if (currentUSDRate <= 0) {
            console.warn('⚠️ Tasa USD no válida para el convertidor');
            return;
        }
        
        // Actualizar tasas en los labels del convertidor
        const usdRateElement = document.querySelector('.converter-rate-usd');
        const bsRateElement = document.querySelector('.converter-rate-bs');
        
        if (usdRateElement) {
            usdRateElement.textContent = `1 USD = ${formatNumber(currentUSDRate, 2)} Bs`;
        }
        
        if (bsRateElement) {
            bsRateElement.textContent = `1 Bs = $ ${formatNumber(1/currentUSDRate, 4)}`;
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
                resultElement.textContent = `Bs. ${formatNumber(result, 2)}`;
                resultElement.setAttribute('aria-label', `Resultado: ${formatNumber(result, 2)} Bolívares`);
            }
        }
        
        // Convertir Bs a USD
        if (bsToUsdInput && bsToUsdInput.value) {
            const bsAmount = parseFloat(bsToUsdInput.value) || 0;
            const result = currentUSDRate > 0 ? bsAmount / currentUSDRate : 0;
            const resultElement = document.getElementById('convert-bs-to-usd-result');
            if (resultElement) {
                resultElement.textContent = `$ ${formatNumber(result, 2)}`;
                resultElement.setAttribute('aria-label', `Resultado: ${formatNumber(result, 2)} Dólares`);
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
                        <i class="fas fa-exchange-alt" aria-hidden="true"></i>
                        <span>Convertidor USD ↔ Bs</span>
                        <button class="converter-toggle" id="converter-toggle" 
                                aria-label="${converterVisible ? 'Ocultar' : 'Mostrar'} convertidor"
                                aria-expanded="${converterVisible}">
                            <i class="fas ${converterVisible ? 'fa-chevron-up' : 'fa-chevron-down'}" 
                               aria-hidden="true"></i>
                        </button>
                    </div>
                    <div class="converter-content" id="converter-content" 
                         style="display: ${converterVisible ? 'block' : 'none'};">
                        <div class="converter-grid">
                            <div class="converter-item">
                                <div class="converter-label">
                                    <i class="fas fa-dollar-sign" aria-hidden="true"></i>
                                    <span>USD → Bs</span>
                                    <small class="converter-rate converter-rate-usd">
                                        1 USD = ${formatNumber(currentUSDRate, 2)} Bs
                                    </small>
                                </div>
                                <div class="converter-input-group">
                                    <input type="number" id="convert-usd-to-bs" class="converter-input" 
                                           placeholder="0.00" min="0" step="0.01" 
                                           aria-label="Cantidad en Dólares a convertir a Bolívares">
                                    <span class="converter-arrow" aria-hidden="true">→</span>
                                    <span class="converter-result" id="convert-usd-to-bs-result"
                                          aria-live="polite">Bs. 0.00</span>
                                </div>
                            </div>
                            
                            <div class="converter-item">
                                <div class="converter-label">
                                    <i class="fas fa-bolivar-sign" aria-hidden="true"></i>
                                    <span>Bs → USD</span>
                                    <small class="converter-rate converter-rate-bs">
                                        1 Bs = $ ${formatNumber(1/currentUSDRate, 4)}
                                    </small>
                                </div>
                                <div class="converter-input-group">
                                    <input type="number" id="convert-bs-to-usd" class="converter-input" 
                                           placeholder="0.00" min="0" step="0.01" 
                                           aria-label="Cantidad en Bolívares a convertir a Dólares">
                                    <span class="converter-arrow" aria-hidden="true">→</span>
                                    <span class="converter-result" id="convert-bs-to-usd-result"
                                          aria-live="polite">$ 0.00</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="converter-info">
                            <i class="fas fa-info-circle" aria-hidden="true"></i>
                            <span>Conversión basada en tasa oficial del BCV: 1 USD = ${formatNumber(currentUSDRate, 2)} Bs</span>
                        </div>
                        
                        <button class="clear-converter-btn" id="clear-converter" 
                                aria-label="Limpiar todos los campos del convertidor">
                            <i class="fas fa-broom" aria-hidden="true"></i> Limpiar Convertidor
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
            
            // Mejorar experiencia en móviles
            input.addEventListener('focus', function() {
                this.select();
            });
        });
        
        // Configurar toggle del convertidor
        const converterToggle = document.getElementById('converter-toggle');
        const converterContent = document.getElementById('converter-content');
        
        if (converterToggle && converterContent) {
            converterToggle.addEventListener('click', function() {
                converterVisible = !converterVisible;
                converterContent.style.display = converterVisible ? 'block' : 'none';
                
                const icon = this.querySelector('i');
                icon.className = converterVisible ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
                
                this.setAttribute('aria-label', converterVisible ? 'Ocultar convertidor' : 'Mostrar convertidor');
                this.setAttribute('aria-expanded', converterVisible);
                
                // Guardar preferencia en localStorage
                localStorage.setItem('converter-visible', converterVisible);
                
                // Animar la transición
                if (converterVisible) {
                    converterContent.style.animation = 'fadeIn 0.3s ease';
                }
            });
            
            // Restaurar estado del convertidor desde localStorage
            const savedVisibility = localStorage.getItem('converter-visible');
            if (savedVisibility !== null) {
                converterVisible = savedVisibility === 'true';
                converterContent.style.display = converterVisible ? 'block' : 'none';
                converterToggle.querySelector('i').className = converterVisible ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
                converterToggle.setAttribute('aria-expanded', converterVisible);
                converterToggle.setAttribute('aria-label', converterVisible ? 'Ocultar convertidor' : 'Mostrar convertidor');
            }
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
                
                // Enfocar el primer input
                const firstInput = document.getElementById('convert-usd-to-bs');
                if (firstInput) firstInput.focus();
            });
        }
    }
    
    // =======================================================================
    // NOTIFICACIONES Y ESTILOS
    // =======================================================================
    
    // Función para mostrar notificaciones de tasas
    function showTasaNotification(message, type = 'info') {
        // Remover notificaciones anteriores
        document.querySelectorAll('.tasa-notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `tasa-notification ${type}`;
        notification.textContent = message;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        notification.setAttribute('aria-atomic', 'true');
        
        const panelPaper = document.querySelector('.panel-paper');
        if (panelPaper) {
            panelPaper.appendChild(notification);
            
            // Auto-eliminar después de 3 segundos
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
                /* ============================================================
                   ESTILOS PARA SIMETRÍA PERFECTA EN TASAS Y CONVERTIDOR
                   ============================================================ */
                
                /* 1. SIMETRÍA DE NÚMEROS - FUNDAMENTAL */
                .rate-value,
                .converter-input,
                .converter-result,
                .converter-rate {
                    font-variant-numeric: tabular-nums !important;
                    font-family: 'Montserrat', 'SF Mono', 'Roboto Mono', monospace !important;
                    letter-spacing: -0.02em !important;
                    text-rendering: geometricPrecision !important;
                }
                
                /* 2. PANEL SIN BOTÓN DE ACTUALIZAR - CENTRADO PERFECTO */
                .panel-header {
                    justify-content: center !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 10px !important;
                }
                
                .panel-header > i {
                    margin-right: 0 !important;
                }
                
                .panel-header > span {
                    text-align: center !important;
                    font-weight: 600 !important;
                    font-size: 1.1em !important;
                }
                
                /* 3. DISEÑO SIMÉTRICO DE TASAS */
                .panel-content {
                    display: grid !important;
                    grid-template-columns: repeat(2, 1fr) !important;
                    gap: 20px !important;
                    justify-items: center !important;
                    align-items: start !important;
                }
                
                .rate-item {
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    width: 100% !important;
                    max-width: 180px !important;
                    min-height: 100px !important;
                }
                
                .rate-label {
                    order: 1 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 8px !important;
                    margin-bottom: 12px !important;
                    width: 100% !important;
                }
                
                .rate-label i {
                    order: 1 !important;
                    min-width: 16px !important;
                    text-align: center !important;
                }
                
                .rate-label span {
                    order: 2 !important;
                    font-weight: 600 !important;
                    min-width: 50px !important;
                    text-align: left !important;
                }
                
                .rate-value {
                    order: 2 !important;
                    min-width: 140px !important;
                    text-align: center !important;
                    padding: 8px 12px !important;
                    background: rgba(212, 175, 55, 0.05) !important;
                    border-radius: 8px !important;
                    border: 1px solid rgba(212, 175, 55, 0.1) !important;
                    font-size: 1.4em !important;
                    font-weight: 700 !important;
                    margin-bottom: 6px !important;
                }
                
                .rate-date {
                    order: 3 !important;
                    font-size: 0.85em !important;
                    opacity: 0.8 !important;
                    min-width: 100px !important;
                    text-align: center !important;
                }
                
                /* 4. CONVERTIDOR - ALINEACIÓN PRECISA */
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
                    font-family: 'Montserrat', monospace;
                }
                
                .converter-input-group {
                    display: grid;
                    grid-template-columns: 1fr auto 1fr;
                    gap: 10px;
                    align-items: center;
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
                    text-align: right;
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
                    text-align: right;
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
                
                /* 5. NOTIFICACIONES */
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
                
                /* 6. ANIMACIONES */
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
                
                /* Animación para números que se actualizan */
                .updating-number {
                    animation: numberUpdate 0.3s ease !important;
                    display: inline-block !important;
                }
                
                @keyframes numberUpdate {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                
                .offline-indicator {
                    animation: blink 2s infinite;
                }
                
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                /* 7. RESPONSIVE */
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
                    
                    .panel-content {
                        grid-template-columns: 1fr !important;
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
    
    // =======================================================================
    // INICIALIZACIÓN
    // =======================================================================
    
    // Inicializar todo
    function initializeTasaPanel() {
        console.log('🚀 Inicializando Panel de Tasas BCV con Simetría Perfecta...');
        
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
            
            // Actualizar convertidor con nuevas tasas
            updateConverter();
            
            // Mostrar notificación visual
            const timeStr = new Date(e.detail.timestamp).toLocaleTimeString('es-VE', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            showTasaNotification(`Tasas actualizadas a las ${timeStr}`, 'success');
        });
        
        console.log('✅ Panel de tasas BCV inicializado - Convertidor USD↔Bs habilitado');
    }
    
    // Inicializar cuando el DOM esté listo
    initializeTasaPanel();
    
    // =======================================================================
    // FUNCIONES DE UTILIDAD PARA USO EXTERNO
    // =======================================================================
    
    // Exportar funciones para uso externo
    window.getCurrentRates = function() {
        return {
            usd: currentUSDRate,
            eur: currentEURRate,
            lastUpdate: lastUpdateTime,
            source: 'BCV Oficial via DolarApi',
            formattedUSD: formatNumber(currentUSDRate, 2),
            formattedEUR: formatNumber(currentEURRate, 2)
        };
    };
    
    // Función para formatear precio según tasa BCV
    window.formatPriceBCV = function(priceUSD) {
        const total = priceUSD * currentUSDRate;
        return {
            usd: `$${formatNumber(priceUSD, 2)}`,
            bs: `Bs. ${formatNumber(total, 2)}`,
            rate: currentUSDRate,
            formattedRate: formatNumber(currentUSDRate, 2)
        };
    };
    
    // Función para convertir USD a Bs
    window.convertUSDToBS = function(usdAmount) {
        return usdAmount * currentUSDRate;
    };
    
    // Función para convertir Bs a USD
    window.convertBSToUSD = function(bsAmount) {
        return currentUSDRate > 0 ? bsAmount / currentUSDRate : 0;
    };
    
    // Función para forzar actualización manual (útil para debugging)
    window.forceUpdateRates = function() {
        console.log('🔄 Forzando actualización manual de tasas...');
        getBCVRates();
        return window.getCurrentRates();
    };
});
