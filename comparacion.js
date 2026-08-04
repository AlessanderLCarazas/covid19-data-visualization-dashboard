// ========== MÓDULO DE COMPARACIÓN DE CONTINENTES MEJORADO ==========
// Variables del módulo
let modalElements = {};
let comparisonWindow = null;
let isComparing = false;
let comparisonData = {};

// Función principal de inicialización
function initComparacion() {
    console.log("Inicializando módulo de comparación...");

    // Obtener referencias a los elementos del DOM
    modalElements = {
        compareBtn: document.getElementById("compareBtn"),
        modal: document.getElementById("compareModal"),
        closeBtn: document.querySelector(".close"),
        cancelBtn: document.getElementById("cancelCompare"),
        confirmBtn: document.getElementById("confirmCompare"),
        continent1Select: document.getElementById("continent1Select"),
        continent2Select: document.getElementById("continent2Select"),
        compareMessage: document.getElementById("compareMessage")
    };

    // Verificar que todos los elementos existen
    if (!validateModalElements()) {
        console.error("Error: No se pudieron encontrar todos los elementos del modal");
        return;
    }

    // Configurar event listeners
    setupEventListeners();

    console.log("Módulo de comparación inicializado correctamente");
}

// Validar que todos los elementos del modal existen
function validateModalElements() {
    for (const [key, element] of Object.entries(modalElements)) {
        if (!element) {
            console.error(`Elemento no encontrado: ${key}`);
            return false;
        }
    }
    return true;
}

// Configurar todos los event listeners
function setupEventListeners() {
    // Abrir modal
    modalElements.compareBtn.addEventListener('click', openCompareModal);

    // Cerrar modal - múltiples formas
    modalElements.closeBtn.addEventListener('click', closeCompareModal);
    modalElements.cancelBtn.addEventListener('click', closeCompareModal);

    // Cerrar modal al hacer clic fuera de él
    window.addEventListener('click', function(event) {
        if (event.target === modalElements.modal) {
            closeCompareModal();
        }
    });

    // Confirmar comparación
    modalElements.confirmBtn.addEventListener('click', processComparison);

    // Validación en tiempo real
    modalElements.continent1Select.addEventListener('change', validateSelection);
    modalElements.continent2Select.addEventListener('change', validateSelection);
}

// Abrir el modal de comparación
function openCompareModal() {
    console.log("Abriendo modal de comparación...");

    // Poblar los selects con continentes disponibles
    populateCompareSelects();

    // Mostrar modal
    modalElements.modal.style.display = "block";

    // Reset del estado
    resetModalState();
}

// Cerrar el modal de comparación
function closeCompareModal() {
    console.log("Cerrando modal de comparación...");

    modalElements.modal.style.display = "none";
    resetModalState();
}

// Reset del estado del modal
function resetModalState() {
    modalElements.compareMessage.style.display = "none";
    modalElements.continent1Select.value = "";
    modalElements.continent2Select.value = "";
    modalElements.confirmBtn.disabled = false;
    isComparing = false;
}

// Poblar los selects del modal con continentes disponibles
function populateCompareSelects() {
    const mainSelect = document.getElementById("continentSelect");

    if (!mainSelect) {
        console.error("No se encontró el select principal de continentes");
        return;
    }

    const options = Array.from(mainSelect.options).slice(1); // Excluir primera opción

    // Limpiar selects
    modalElements.continent1Select.innerHTML = '<option value="">Seleccione continente</option>';
    modalElements.continent2Select.innerHTML = '<option value="">Seleccione continente</option>';

    // Poblar con las mismas opciones
    options.forEach(option => {
        if (option.value) { // Solo agregar opciones válidas
            const option1 = option.cloneNode(true);
            const option2 = option.cloneNode(true);
            modalElements.continent1Select.appendChild(option1);
            modalElements.continent2Select.appendChild(option2);
        }
    });

    console.log(`Selects poblados con ${options.length} continentes`);
}

// Validar selección en tiempo real
function validateSelection() {
    const continent1 = modalElements.continent1Select.value;
    const continent2 = modalElements.continent2Select.value;

    // Habilitar/deshabilitar botón de confirmar
    const isValid = continent1 && continent2 && continent1 !== continent2;
    modalElements.confirmBtn.disabled = !isValid;

    // Mostrar advertencia si seleccionan el mismo continente
    if (continent1 && continent2 && continent1 === continent2) {
        showTemporaryMessage("⚠️ Por favor seleccione continentes diferentes", "warning");
    }
}

// Procesar la comparación
function processComparison() {
    if (isComparing) return; // Evitar múltiples clics

    const continent1 = modalElements.continent1Select.value;
    const continent2 = modalElements.continent2Select.value;

    // Validaciones finales
    if (!continent1 || !continent2) {
        showTemporaryMessage("Por favor seleccione ambos continentes", "error");
        return;
    }

    if (continent1 === continent2) {
        showTemporaryMessage("Por favor seleccione continentes diferentes", "error");
        return;
    }

    // Iniciar proceso de comparación
    isComparing = true;
    modalElements.confirmBtn.disabled = true;

    console.log(`Iniciando comparación entre ${continent1} y ${continent2}`);

    // Simular proceso de comparación
    showTemporaryMessage("Procesando comparación...", "processing");

    setTimeout(() => {
        executeComparison(continent1, continent2);
    }, 1000);
}

// Ejecutar la comparación real
function executeComparison(continent1, continent2) {
    try {
        // Procesar datos de comparación
        const comparison = compareDataBetweenContinents(continent1, continent2);
        comparisonData = comparison;

        console.log(`Comparando ${continent1} vs ${continent2}`);

        // Mostrar mensaje de éxito temporalmente
        showSuccessMessage(continent1, continent2);

        // Cerrar modal después de 1.5 segundos y abrir ventana de comparación
        setTimeout(() => {
            closeCompareModal();
            openComparisonWindow(continent1, continent2, comparison);
        }, 1500);

    } catch (error) {
        console.error("Error en la comparación:", error);
        showTemporaryMessage("Error al procesar la comparación", "error");
        isComparing = false;
        modalElements.confirmBtn.disabled = false;
    }
}

// ========== NUEVA FUNCIÓN: VENTANA DE COMPARACIÓN ==========
function openComparisonWindow(continent1, continent2, comparisonData) {
    // Si ya existe una ventana, la cerramos
    if (comparisonWindow) {
        document.body.removeChild(comparisonWindow);
        comparisonWindow = null;
    }

    // Crear ventana de comparación
    comparisonWindow = document.createElement('div');
    comparisonWindow.className = 'comparison-window';
    comparisonWindow.innerHTML = createComparisonWindowHTML(continent1, continent2);
    document.body.appendChild(comparisonWindow);

    // Configurar event listeners para la nueva ventana
    setupComparisonWindowEvents(continent1, continent2, comparisonData);

    // Inicializar gráficos
    setTimeout(() => {
        initializeComparisonCharts(continent1, continent2, comparisonData);
    }, 100);

    console.log("Ventana de comparación abierta");
}

// ========== CREAR HTML DE LA VENTANA DE COMPARACIÓN ==========
function createComparisonWindowHTML(continent1, continent2) {
    return `
        <div class="comparison-content">
            <div class="comparison-header">
                <h2>Comparación COVID-19: ${continent1} vs ${continent2}</h2>
                <button class="comparison-close">✕</button>
            </div>
            
            <div class="comparison-controls">
                <div class="time-controls">
                    <label>Período:</label>
                    <select id="timeRangeSelect">
                        <option value="2020">2020</option>
                        <option value="2021">2021</option>
                        <option value="2022">2022</option>
                        <option value="2023">2023</option>
                        <option value="all" selected>Todo el período</option>
                    </select>
                    
                    <label>Granularidad:</label>
                    <select id="granularitySelect">
                        <option value="monthly" selected>Por mes</option>
                        <option value="quarterly">Por trimestre</option>
                        <option value="yearly">Por año</option>
                    </select>
                </div>
                
                <div class="metric-controls">
                    <label>Métrica principal:</label>
                    <select id="metricSelect">
                        <option value="new_cases" selected>Casos nuevos</option>
                        <option value="new_deaths">Muertes nuevas</option>
                        <option value="total_cases">Casos totales</option>
                        <option value="total_deaths">Muertes totales</option>
                    </select>
                </div>
            </div>
            
            <div class="comparison-charts">
                <div class="chart-container">
                    <h3>Evolución Temporal</h3>
                    <svg id="timelineChart" width="100%" height="400"></svg>
                </div>
                
                <div class="chart-container">
                    <h3>Comparación por Países Top</h3>
                    <svg id="countriesChart" width="100%" height="400"></svg>
                </div>

                <div class="chart-container">
                    <h3>Indicadores de Salud</h3>
                    <svg id="healthChart" width="100%" height="400"></svg>
                </div>
            
                <div class="chart-container">
                    <h3>Indicadores Socioeconómicos</h3>
                    <svg id="socioeconomicChart" width="100%" height="400"></svg>
                </div>
            </div>
            
            <div class="comparison-stats">
                <div class="stats-continent1">
                    <h4>${continent1}</h4>
                    <div class="stat-item">
                        <span class="stat-label">Países:</span>
                        <span class="stat-value" id="countries1">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Casos totales:</span>
                        <span class="stat-value" id="totalCases1">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Muertes totales:</span>
                        <span class="stat-value" id="totalDeaths1">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Población total:</span>
                        <span class="stat-value" id="totalPop1">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Diabetes (%):</span>
                        <span class="stat-value" id="diabetes1">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Mayores 70 (%):</span>
                        <span class="stat-value" id="aged70older1">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Mort. cardiovascular:</span>
                        <span class="stat-value" id="cardiovasc1">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Pobreza extrema (%):</span>
                        <span class="stat-value" id="extremePoverty1">-</span>
                    </div>
                </div>
                
                <div class="stats-vs">VS</div>
                
                <div class="stats-continent2">
                    <h4>${continent2}</h4>
                    <div class="stat-item">
                        <span class="stat-label">Países:</span>
                        <span class="stat-value" id="countries2">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Casos totales:</span>
                        <span class="stat-value" id="totalCases2">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Muertes totales:</span>
                        <span class="stat-value" id="totalDeaths2">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Población total:</span>
                        <span class="stat-value" id="totalPop2">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Diabetes (%):</span>
                        <span class="stat-value" id="diabetes2">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Mayores 70 (%):</span>
                        <span class="stat-value" id="aged70older2">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Mort. cardiovascular:</span>
                        <span class="stat-value" id="cardiovasc2">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Pobreza extrema (%):</span>
                        <span class="stat-value" id="extremePoverty2">-</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ========== CONFIGURAR EVENTOS DE LA VENTANA DE COMPARACIÓN ==========
function setupComparisonWindowEvents(continent1, continent2, comparisonData) {
    // Cerrar ventana
    const closeBtn = comparisonWindow.querySelector('.comparison-close');
    closeBtn.addEventListener('click', closeComparisonWindow);

    // Controles de filtrado
    const timeRangeSelect = comparisonWindow.querySelector('#timeRangeSelect');
    const granularitySelect = comparisonWindow.querySelector('#granularitySelect');
    const metricSelect = comparisonWindow.querySelector('#metricSelect');

    // Event listeners para actualizar gráficos
    [timeRangeSelect, granularitySelect, metricSelect].forEach(control => {
        control.addEventListener('change', () => {
            updateComparisonCharts(continent1, continent2, comparisonData);
        });
    });

    // Cerrar con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && comparisonWindow) {
            closeComparisonWindow();
        }
    });
}

// ========== INICIALIZAR GRÁFICOS DE COMPARACIÓN ==========
function initializeComparisonCharts(continent1, continent2, comparisonData) {
    // Actualizar estadísticas - LÍNEA EXISTENTE
    updateComparisonStats(continent1, continent2, comparisonData);
    
    // Crear gráficos - LÍNEA EXISTENTE
    updateComparisonCharts(continent1, continent2, comparisonData);

    // AGREGAR ESTAS DOS LÍNEAS NUEVAS:
    createHealthChart(continent1, continent2, comparisonData);
    createSocioeconomicChart(continent1, continent2, comparisonData);
}

// ========== ACTUALIZAR ESTADÍSTICAS ==========
function updateComparisonStats(continent1, continent2, comparisonData) {
    const data1 = comparisonData.continent1.data;
    const data2 = comparisonData.continent2.data;
    
    // Calcular estadísticas para continente 1
    const stats1 = calculateContinentStats(data1);
    const stats2 = calculateContinentStats(data2);
    
    // Actualizar DOM - LÍNEAS EXISTENTES
    comparisonWindow.querySelector('#countries1').textContent = comparisonData.continent1.countries;
    comparisonWindow.querySelector('#totalCases1').textContent = formatNumber(stats1.totalCases);
    comparisonWindow.querySelector('#totalDeaths1').textContent = formatNumber(stats1.totalDeaths);
    comparisonWindow.querySelector('#totalPop1').textContent = formatNumber(stats1.totalPopulation);
    
    comparisonWindow.querySelector('#countries2').textContent = comparisonData.continent2.countries;
    comparisonWindow.querySelector('#totalCases2').textContent = formatNumber(stats2.totalCases);
    comparisonWindow.querySelector('#totalDeaths2').textContent = formatNumber(stats2.totalDeaths);
    comparisonWindow.querySelector('#totalPop2').textContent = formatNumber(stats2.totalPopulation);

    // AGREGAR ESTAS LÍNEAS NUEVAS:
    // Continente 1 - nuevos indicadores
    comparisonWindow.querySelector('#diabetes1').textContent = stats1.avgDiabetes.toFixed(1) + '%';
    comparisonWindow.querySelector('#aged70older1').textContent = stats1.avgAged70.toFixed(1) + '%';
    comparisonWindow.querySelector('#cardiovasc1').textContent = stats1.avgCardiovasc.toFixed(1);
    comparisonWindow.querySelector('#extremePoverty1').textContent = stats1.avgExtremePoverty.toFixed(1) + '%';
    
    // Continente 2 - nuevos indicadores
    comparisonWindow.querySelector('#diabetes2').textContent = stats2.avgDiabetes.toFixed(1) + '%';
    comparisonWindow.querySelector('#aged70older2').textContent = stats2.avgAged70.toFixed(1) + '%';
    comparisonWindow.querySelector('#cardiovasc2').textContent = stats2.avgCardiovasc.toFixed(1);
    comparisonWindow.querySelector('#extremePoverty2').textContent = stats2.avgExtremePoverty.toFixed(1) + '%';
}
// ========== ACTUALIZAR GRÁFICOS ==========
function updateComparisonCharts(continent1, continent2, comparisonData) {
    const timeRange = comparisonWindow.querySelector('#timeRangeSelect').value;
    const granularity = comparisonWindow.querySelector('#granularitySelect').value;
    const metric = comparisonWindow.querySelector('#metricSelect').value;

    // Procesar datos según filtros
    const processedData1 = processDataForChart(comparisonData.continent1.data, timeRange, granularity, metric);
    const processedData2 = processDataForChart(comparisonData.continent2.data, timeRange, granularity, metric);

    // Crear gráfico de líneas temporal
    createTimelineChart(processedData1, processedData2, continent1, continent2, metric);
    
    // Crear gráfico de barras por países
    createCountriesChart(comparisonData.continent1.data, comparisonData.continent2.data, continent1, continent2, metric);
}

// ========== CREAR GRÁFICO DE LÍNEAS TEMPORAL ==========
function createTimelineChart(data1, data2, continent1, continent2, metric) {
    const svg = d3.select(comparisonWindow.querySelector('#timelineChart'));
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 120, bottom: 40, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Combinar datos para escalar
    const allData = [...data1, ...data2];
    
    // Escalas
    const parseDate = d3.timeParse("%Y-%m-%d");
    const xScale = d3.scaleTime()
        .domain(d3.extent(allData, d => parseDate(d.date)))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(allData, d => d.value)])
        .nice()
        .range([height, 0]);

    // Línea generadora
    const line = d3.line()
        .x(d => xScale(parseDate(d.date)))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);

    // Ejes
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %Y")));

    g.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d => formatNumber(d)));

    // Línea para continente 1
    g.append("path")
        .datum(data1)
        .attr("fill", "none")
        .attr("stroke", "#2E86AB")
        .attr("stroke-width", 3)
        .attr("d", line);

    // Línea para continente 2
    g.append("path")
        .datum(data2)
        .attr("fill", "none")
        .attr("stroke", "#A23B72")
        .attr("stroke-width", 3)
        .attr("d", line);

    // Puntos para continente 1
    g.selectAll(".dot1")
        .data(data1)
        .enter().append("circle")
        .attr("class", "dot1")
        .attr("cx", d => xScale(parseDate(d.date)))
        .attr("cy", d => yScale(d.value))
        .attr("r", 4)
        .attr("fill", "#2E86AB");

    // Puntos para continente 2
    g.selectAll(".dot2")
        .data(data2)
        .enter().append("circle")
        .attr("class", "dot2")
        .attr("cx", d => xScale(parseDate(d.date)))
        .attr("cy", d => yScale(d.value))
        .attr("r", 4)
        .attr("fill", "#A23B72");

    // Leyenda
    const legend = g.append("g")
        .attr("transform", `translate(${width + 10}, 20)`);

    legend.append("line")
        .attr("x1", 0).attr("x2", 20)
        .attr("y1", 0).attr("y2", 0)
        .attr("stroke", "#2E86AB")
        .attr("stroke-width", 3);

    legend.append("text")
        .attr("x", 25)
        .attr("y", 0)
        .attr("dy", "0.35em")
        .style("font-size", "12px")
        .text(continent1);

    legend.append("line")
        .attr("x1", 0).attr("x2", 20)
        .attr("y1", 20).attr("y2", 20)
        .attr("stroke", "#A23B72")
        .attr("stroke-width", 3);

    legend.append("text")
        .attr("x", 25)
        .attr("y", 20)
        .attr("dy", "0.35em")
        .style("font-size", "12px")
        .text(continent2);

    // Título del eje Y
    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text(getMetricLabel(metric));
}

// ========== CREAR GRÁFICO DE BARRAS POR PAÍSES ==========
function createCountriesChart(data1, data2, continent1, continent2, metric) {
    const svg = d3.select(comparisonWindow.querySelector('#countriesChart'));
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 100, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Obtener top 5 países de cada continente
    const top1 = getTopCountries(data1, metric, 5);
    const top2 = getTopCountries(data2, metric, 5);

    // Combinar datos
    const combinedData = [
        ...top1.map(d => ({ ...d, continent: continent1, color: "#2E86AB" })),
        ...top2.map(d => ({ ...d, continent: continent2, color: "#A23B72" }))
    ];

    // Escalas
    const xScale = d3.scaleBand()
        .domain(combinedData.map(d => `${d.country} (${d.continent})`))
        .range([0, width])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(combinedData, d => d.value)])
        .nice()
        .range([height, 0]);

    // Ejes
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)")
        .style("font-size", "10px");

    g.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d => formatNumber(d)));

    // Barras
    g.selectAll(".bar")
        .data(combinedData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(`${d.country} (${d.continent})`))
        .attr("y", d => yScale(d.value))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.value))
        .attr("fill", d => d.color)
        .attr("opacity", 0.8);

    // Etiquetas de valores
    g.selectAll(".label")
        .data(combinedData)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => xScale(`${d.country} (${d.continent})`) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.value) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text(d => formatNumber(d.value));

    // Título del eje Y
    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text(getMetricLabel(metric));
}

// ========== FUNCIONES AUXILIARES ==========
function closeComparisonWindow() {
    if (comparisonWindow) {
        document.body.removeChild(comparisonWindow);
        comparisonWindow = null;
        console.log("Ventana de comparación cerrada");
    }
}

function calculateContinentStats(data) {
    const totalCases = d3.sum(data, d => +(d.total_cases || 0));
    const totalDeaths = d3.sum(data, d => +(d.total_deaths || 0));
    const countries = [...new Set(data.map(d => d.location))];
    const totalPopulation = d3.sum(countries.map(country => {
        const countryData = data.filter(d => d.location === country);
        return +(countryData[countryData.length - 1]?.population || 0);
    }));

    // AGREGAR ESTAS LÍNEAS:
    const avgDiabetes = d3.mean(countries.map(country => {
        const countryData = data.filter(d => d.location === country);
        return +(countryData[countryData.length - 1]?.diabetes_prevalence || 0);
    }));
    
    const avgAged70 = d3.mean(countries.map(country => {
        const countryData = data.filter(d => d.location === country);
        return +(countryData[countryData.length - 1]?.aged_70_older || 0);
    }));
    
    const avgCardiovasc = d3.mean(countries.map(country => {
        const countryData = data.filter(d => d.location === country);
        return +(countryData[countryData.length - 1]?.cardiovasc_death_rate || 0);
    }));
    
    const avgExtremePoverty = d3.mean(countries.map(country => {
        const countryData = data.filter(d => d.location === country);
        return +(countryData[countryData.length - 1]?.extreme_poverty || 0);
    }));

    // MODIFICAR EL RETURN:
    return { 
        totalCases, 
        totalDeaths, 
        totalPopulation, 
        avgDiabetes: avgDiabetes || 0,
        avgAged70: avgAged70 || 0,
        avgCardiovasc: avgCardiovasc || 0,
        avgExtremePoverty: avgExtremePoverty || 0
    };
}

function processDataForChart(data, timeRange, granularity, metric) {
    const parseDate = d3.timeParse("%Y-%m-%d");
    
    // Filtrar por rango de tiempo
    let filteredData = data;
    if (timeRange !== 'all') {
        filteredData = data.filter(d => {
            const date = parseDate(d.date);
            return date && date.getFullYear().toString() === timeRange;
        });
    }

    // Agrupar por granularidad
    const grouped = d3.rollups(
        filteredData,
        v => d3.sum(v, d => +(d[metric] || 0)),
        d => {
            const date = parseDate(d.date);
            if (!date) return null;
            
            if (granularity === 'monthly') {
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
            } else if (granularity === 'quarterly') {
                const quarter = Math.floor(date.getMonth() / 3) + 1;
                return `${date.getFullYear()}-${String(quarter * 3).padStart(2, '0')}-01`;
            } else { // yearly
                return `${date.getFullYear()}-01-01`;
            }
        }
    );

    return grouped
        .filter(([date]) => date !== null)
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

function getTopCountries(data, metric, count) {
    const byCountry = d3.rollups(
        data,
        v => d3.sum(v, d => +(d[metric] || 0)),
        d => d.location
    );

    return byCountry
        .map(([country, value]) => ({ country, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, count);
}

function getMetricLabel(metric) {
    const labels = {
        'new_cases': 'Casos Nuevos',
        'new_deaths': 'Muertes Nuevas',
        'total_cases': 'Casos Totales',
        'total_deaths': 'Muertes Totales'
    };
    return labels[metric] || metric;
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
}

// ========== FUNCIONES ORIGINALES MANTENIDAS ==========
function showSuccessMessage(continent1, continent2) {
    const message = `✅ Comparación exitosa entre ${continent1} y ${continent2}`;
    modalElements.compareMessage.className = "compare-message success";
    modalElements.compareMessage.innerHTML = `<p>${message}</p>`;
    modalElements.compareMessage.style.display = "block";

    console.log(`Comparación completada: ${continent1} vs ${continent2}`);
}

function showTemporaryMessage(message, type = "info") {
    modalElements.compareMessage.className = `compare-message ${type}`;
    modalElements.compareMessage.innerHTML = `<p>${message}</p>`;
    modalElements.compareMessage.style.display = "block";

    // Ocultar mensaje después de 3 segundos (excepto para éxito)
    if (type !== "success") {
        setTimeout(() => {
            modalElements.compareMessage.style.display = "none";
        }, 3000);
    }
}

function getDataByContinent(continent) {
    if (typeof covidData === 'undefined' || !covidData) {
        console.warn("Datos COVID no disponibles");
        return [];
    }

    return covidData.filter(d => d.continent === continent);
}

function compareDataBetweenContinents(continent1, continent2) {
    const data1 = getDataByContinent(continent1);
    const data2 = getDataByContinent(continent2);

    return {
        continent1: {
            name: continent1,
            data: data1,
            countries: [...new Set(data1.map(d => d.location))].length,
            totalRecords: data1.length
        },
        continent2: {
            name: continent2,
            data: data2,
            countries: [...new Set(data2.map(d => d.location))].length,
            totalRecords: data2.length
        }
    };
}
function createHealthChart(continent1, continent2, comparisonData) {
    const svg = d3.select(comparisonWindow.querySelector('#healthChart'));
    svg.selectAll("*").remove();
    
    const margin = { top: 20, right: 80, bottom: 60, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Calcular estadísticas
    const stats1 = calculateContinentStats(comparisonData.continent1.data);
    const stats2 = calculateContinentStats(comparisonData.continent2.data);
    
    // Datos para el gráfico
    const healthData = [
        { metric: 'Diabetes (%)', continent1: stats1.avgDiabetes, continent2: stats2.avgDiabetes },
        { metric: 'Mayores 70 (%)', continent1: stats1.avgAged70, continent2: stats2.avgAged70 }
    ];
    
    // Escalas
    const xScale = d3.scaleBand()
        .domain(healthData.map(d => d.metric))
        .range([0, width])
        .padding(0.1);
        
    const xSubScale = d3.scaleBand()
        .domain(['continent1', 'continent2'])
        .range([0, xScale.bandwidth()])
        .padding(0.05);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(healthData, d => Math.max(d.continent1, d.continent2))])
        .nice()
        .range([height, 0]);
    
    // Ejes
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));
    
    g.append("g")
        .call(d3.axisLeft(yScale));
    
    // Barras
    const groups = g.selectAll(".group")
        .data(healthData)
        .enter().append("g")
        .attr("class", "group")
        .attr("transform", d => `translate(${xScale(d.metric)},0)`);
    
    groups.append("rect")
        .attr("x", xSubScale('continent1'))
        .attr("y", d => yScale(d.continent1))
        .attr("width", xSubScale.bandwidth())
        .attr("height", d => height - yScale(d.continent1))
        .attr("fill", "#2E86AB");
    
    groups.append("rect")
        .attr("x", xSubScale('continent2'))
        .attr("y", d => yScale(d.continent2))
        .attr("width", xSubScale.bandwidth())
        .attr("height", d => height - yScale(d.continent2))
        .attr("fill", "#A23B72");
    
    // Etiquetas de valores
    groups.append("text")
        .attr("x", xSubScale('continent1') + xSubScale.bandwidth()/2)
        .attr("y", d => yScale(d.continent1) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text(d => d.continent1.toFixed(1));
    
    groups.append("text")
        .attr("x", xSubScale('continent2') + xSubScale.bandwidth()/2)
        .attr("y", d => yScale(d.continent2) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text(d => d.continent2.toFixed(1));
    
    // Leyenda
    const legend = g.append("g")
        .attr("transform", `translate(${width + 10}, 20)`);
    
    legend.append("rect")
        .attr("width", 15).attr("height", 15)
        .attr("fill", "#2E86AB");
    legend.append("text")
        .attr("x", 20).attr("y", 12)
        .style("font-size", "12px")
        .text(continent1);
    
    legend.append("rect")
        .attr("y", 20)
        .attr("width", 15).attr("height", 15)
        .attr("fill", "#A23B72");
    legend.append("text")
        .attr("x", 20).attr("y", 32)
        .style("font-size", "12px")
        .text(continent2);
}
function createSocioeconomicChart(continent1, continent2, comparisonData) {
    const svg = d3.select(comparisonWindow.querySelector('#socioeconomicChart'));
    svg.selectAll("*").remove();
    
    const margin = { top: 20, right: 80, bottom: 60, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Calcular estadísticas
    const stats1 = calculateContinentStats(comparisonData.continent1.data);
    const stats2 = calculateContinentStats(comparisonData.continent2.data);
    
    // Datos para el gráfico
    const socioData = [
        { metric: 'Mort. Cardiovascular', continent1: stats1.avgCardiovasc, continent2: stats2.avgCardiovasc },
        { metric: 'Pobreza Extrema (%)', continent1: stats1.avgExtremePoverty, continent2: stats2.avgExtremePoverty }
    ];
    
    // Escalas
    const xScale = d3.scaleBand()
        .domain(socioData.map(d => d.metric))
        .range([0, width])
        .padding(0.1);
        
    const xSubScale = d3.scaleBand()
        .domain(['continent1', 'continent2'])
        .range([0, xScale.bandwidth()])
        .padding(0.05);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(socioData, d => Math.max(d.continent1, d.continent2))])
        .nice()
        .range([height, 0]);
    
    // Ejes
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));
    
    g.append("g")
        .call(d3.axisLeft(yScale));
    
    // Barras
    const groups = g.selectAll(".group")
        .data(socioData)
        .enter().append("g")
        .attr("class", "group")
        .attr("transform", d => `translate(${xScale(d.metric)},0)`);
    
    groups.append("rect")
        .attr("x", xSubScale('continent1'))
        .attr("y", d => yScale(d.continent1))
        .attr("width", xSubScale.bandwidth())
        .attr("height", d => height - yScale(d.continent1))
        .attr("fill", "#2E86AB");
    
    groups.append("rect")
        .attr("x", xSubScale('continent2'))
        .attr("y", d => yScale(d.continent2))
        .attr("width", xSubScale.bandwidth())
        .attr("height", d => height - yScale(d.continent2))
        .attr("fill", "#A23B72");
    
    // Etiquetas de valores
    groups.append("text")
        .attr("x", xSubScale('continent1') + xSubScale.bandwidth()/2)
        .attr("y", d => yScale(d.continent1) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text(d => d.continent1.toFixed(1));
    
    groups.append("text")
        .attr("x", xSubScale('continent2') + xSubScale.bandwidth()/2)
        .attr("y", d => yScale(d.continent2) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text(d => d.continent2.toFixed(1));
    
    // Leyenda
    const legend = g.append("g")
        .attr("transform", `translate(${width + 10}, 20)`);
    
    legend.append("rect")
        .attr("width", 15).attr("height", 15)
        .attr("fill", "#2E86AB");
    legend.append("text")
        .attr("x", 20).attr("y", 12)
        .style("font-size", "12px")
        .text(continent1);
    
    legend.append("rect")
        .attr("y", 20)
        .attr("width", 15).attr("height", 15)
        .attr("fill", "#A23B72");
    legend.append("text")
        .attr("x", 20).attr("y", 32)
        .style("font-size", "12px")
        .text(continent2);
}
// Exportar funciones para uso externo
if (typeof window !== 'undefined') {
    window.comparacion = {
        init: initComparacion,
        compare: compareDataBetweenContinents,
        openModal: openCompareModal,
        closeModal: closeCompareModal
    };
}