// countryDetails.js - Ventana de detalles independiente para países
// EXPERTO EN D3.JS Y FRONTEND - VENTANA DETALLADA DE PAÍSES

let countryDetailsWindow = null;
let countryChart = null;
let currentCountryData = null;

// Variables del gráfico
const chartVariables = {
    'totalCases': { 
        label: 'Casos Totales', 
        color: '#e74c3c', 
        enabled: true,
        scale: 'linear'
    },
    'newCasesSmoothed': { 
        label: 'Casos Nuevos (promedio)', 
        color: '#f39c12', 
        enabled: false,
        scale: 'linear'
    },
    'totalDeaths': { 
        label: 'Muertes Totales', 
        color: '#8e44ad', 
        enabled: true,
        scale: 'linear'
    },
    'newDeathsSmoothed': { 
        label: 'Muertes Nuevas (promedio)', 
        color: '#9b59b6', 
        enabled: false,
        scale: 'linear'
    },
    'totalVaccinations': { 
        label: 'Vacunaciones Totales', 
        color: '#27ae60', 
        enabled: false,
        scale: 'linear'
    },
    'peopleFullyVaccinated': { 
        label: 'Totalmente Vacunados', 
        color: '#2ecc71', 
        enabled: false,
        scale: 'linear'
    },
    'stringencyIndex': { 
        label: 'Índice de Restricciones', 
        color: '#3498db', 
        enabled: false,
        scale: 'linear'
    },
    'totalCasesPerMillion': { 
        label: 'Casos por Millón', 
        color: '#e67e22', 
        enabled: false,
        scale: 'linear'
    },
    'totalDeathsPerMillion': { 
        label: 'Muertes por Millón', 
        color: '#c0392b', 
        enabled: false,
        scale: 'linear'
    }
};

// Función principal llamada desde vista3.js
function showCountryDetails(countryName, countryData, continent) {
    if (!countryData || !countryData.timeSeries) {
        console.error('Datos del país no válidos:', countryName);
        return;
    }
    
    currentCountryData = countryData;
    
    // Cerrar ventana anterior si existe
    if (countryDetailsWindow) {
        closeCountryDetails();
    }
    
    createCountryDetailsWindow(countryName, countryData, continent);
}

// Crear la ventana de detalles
function createCountryDetailsWindow(countryName, countryData, continent) {
    // Crear overlay de fondo
    const overlay = document.createElement('div');
    overlay.id = 'country-details-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    // Crear ventana principal
    const detailsWindow = document.createElement('div');
    detailsWindow.id = 'country-details-window';
    detailsWindow.style.cssText = `
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        width: 90%;
        max-width: 1200px;
        height: 85%;
        max-height: 800px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
    `;
    
    // Header de la ventana
    const header = document.createElement('div');
    header.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-height: 60px;
    `;
    
    const titleContainer = document.createElement('div');
    titleContainer.innerHTML = `
        <h2 style="margin: 0; font-size: 24px; font-weight: bold;">${countryName}</h2>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">${continent} • Población: ${formatNumberLarge(countryData.info.population)}</p>
    `;
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 24px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        transition: background 0.3s;
    `;
    closeButton.onmouseover = () => closeButton.style.background = 'rgba(255, 255, 255, 0.3)';
    closeButton.onmouseout = () => closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
    closeButton.onclick = closeCountryDetails;
    
    header.appendChild(titleContainer);
    header.appendChild(closeButton);
    
    // Contenido principal dividido en dos partes
    const mainContent = document.createElement('div');
    mainContent.style.cssText = `
        display: flex;
        flex: 1;
        overflow: hidden;
    `;
    
    // PARTE 1: Gráficas (70% del ancho)
    const chartsSection = document.createElement('div');
    chartsSection.style.cssText = `
        flex: 0 0 70%;
        padding: 20px;
        border-right: 2px solid #eee;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;
    
    // PARTE 2: Informe (30% del ancho)
    const reportSection = document.createElement('div');
    reportSection.style.cssText = `
        flex: 0 0 30%;
        padding: 20px;
        overflow-y: auto;
        background: #f8f9fa;
    `;
    
    // Construir secciones
    buildChartsSection(chartsSection, countryData);
    buildReportSection(reportSection, countryData);
    
    // Ensamblar ventana
    mainContent.appendChild(chartsSection);
    mainContent.appendChild(reportSection);
    detailsWindow.appendChild(header);
    detailsWindow.appendChild(mainContent);
    overlay.appendChild(detailsWindow);
    
    // Agregar al DOM
    document.body.appendChild(overlay);
    countryDetailsWindow = overlay;
    
    // Cerrar con ESC o click en overlay
    document.addEventListener('keydown', handleEscKey);
    overlay.addEventListener('click', handleOverlayClick);
    
    // Inicializar gráfico
    setTimeout(() => {
        initCountryChart(countryData);
    }, 100);
}

// Construir sección de gráficas
function buildChartsSection(container, countryData) {
    // Título de la sección
    const title = document.createElement('h3');
    title.textContent = 'Evolución Temporal';
    title.style.cssText = `
        margin: 0 0 15px 0;
        color: #333;
        font-size: 18px;
        border-bottom: 2px solid #3498db;
        padding-bottom: 8px;
    `;
    
    // Panel de controles de variables
    const controlsPanel = document.createElement('div');
    controlsPanel.style.cssText = `
        background: #f1f2f6;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 20px;
    `;
    
    const controlsTitle = document.createElement('h4');
    controlsTitle.textContent = 'Variables a mostrar:';
    controlsTitle.style.cssText = `
        margin: 0 0 10px 0;
        font-size: 14px;
        color: #555;
    `;
    
    const variablesGrid = document.createElement('div');
    variablesGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 8px;
    `;
    
    // Crear checkboxes para cada variable
    Object.entries(chartVariables).forEach(([key, config]) => {
        const checkboxContainer = document.createElement('label');
        checkboxContainer.style.cssText = `
            display: flex;
            align-items: center;
            cursor: pointer;
            padding: 5px;
            border-radius: 4px;
            transition: background 0.2s;
        `;
        checkboxContainer.onmouseover = () => checkboxContainer.style.background = '#e1e8ed';
        checkboxContainer.onmouseout = () => checkboxContainer.style.background = 'transparent';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = config.enabled;
        checkbox.style.cssText = `
            margin-right: 8px;
            transform: scale(1.2);
        `;
        checkbox.onchange = () => {
            chartVariables[key].enabled = checkbox.checked;
            updateCountryChart();
        };
        
        const colorIndicator = document.createElement('div');
        colorIndicator.style.cssText = `
            width: 12px;
            height: 12px;
            background: ${config.color};
            border-radius: 50%;
            margin-right: 8px;
        `;
        
        const label = document.createElement('span');
        label.textContent = config.label;
        label.style.cssText = `
            font-size: 12px;
            color: #333;
        `;
        
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(colorIndicator);
        checkboxContainer.appendChild(label);
        variablesGrid.appendChild(checkboxContainer);
    });
    
    controlsPanel.appendChild(controlsTitle);
    controlsPanel.appendChild(variablesGrid);
    
    // Contenedor del gráfico
    const chartContainer = document.createElement('div');
    chartContainer.id = 'country-chart-container';
    chartContainer.style.cssText = `
        flex: 1;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        position: relative;
    `;
    
    container.appendChild(title);
    container.appendChild(controlsPanel);
    container.appendChild(chartContainer);
}

// Construir sección de informe
function buildReportSection(container, countryData) {
    const { info, summary } = countryData;
    
    // Título de la sección
    const title = document.createElement('h3');
    title.textContent = 'Resumen Estadístico';
    title.style.cssText = `
        margin: 0 0 20px 0;
        color: #333;
        font-size: 18px;
        border-bottom: 2px solid #e74c3c;
        padding-bottom: 8px;
    `;
    
    // Datos demográficos
    const demographicsSection = createReportSection('Demografía', [
        { label: 'Población', value: formatNumberLarge(info.population) },
        { label: 'Edad mediana', value: `${info.medianAge} años` },
        { label: '65+ años', value: `${info.aged65Older.toFixed(1)}%` },
        { label: '70+ años', value: `${info.aged70Older.toFixed(1)}%` }
    ]);
    
    // Datos económicos
    const economicsSection = createReportSection('Economía', [
        { label: 'PIB per cápita', value: `$${formatNumberLarge(info.gdpPerCapita)}` },
        { label: 'Pobreza extrema', value: info.extremePoverty > 0 ? `${info.extremePoverty.toFixed(1)}%` : 'N/D' }
    ]);
    
    // Datos de salud
    const healthSection = createReportSection('Salud Pública', [
        { label: 'Mortalidad cardiovascular', value: `${info.cardiovascDeathRate.toFixed(1)}/100k` },
        { label: 'Prevalencia diabetes', value: `${info.diabetesPrevalence.toFixed(1)}%` }
    ]);
    
    // Estadísticas COVID-19
    const covidSection = createReportSection('COVID-19', [
        { label: 'Total de casos', value: formatNumberLarge(summary.totalCases), color: '#e74c3c' },
        { label: 'Total de muertes', value: formatNumberLarge(summary.totalDeaths), color: '#8e44ad' },
        { label: 'Tasa de letalidad', value: `${summary.caseFatalityRate.toFixed(2)}%`, color: '#c0392b' },
        { label: 'Casos por millón', value: formatNumberLarge(summary.casesPerMillion), color: '#e67e22' },
        { label: 'Muertes por millón', value: formatNumberLarge(summary.deathsPerMillion), color: '#9b59b6' },
        { label: 'Vacunación completa', value: `${summary.fullyVaccinatedRate.toFixed(1)}%`, color: '#27ae60' }
    ]);
    
    // Picos máximos
    const peaksSection = createReportSection('Picos Máximos', [
        { label: 'Máx. casos/día', value: formatNumberLarge(summary.peakNewCases), color: '#f39c12' },
        { label: 'Máx. muertes/día', value: formatNumberLarge(summary.peakNewDeaths), color: '#9b59b6' }
    ]);
    
    container.appendChild(title);
    container.appendChild(demographicsSection);
    container.appendChild(economicsSection);
    container.appendChild(healthSection);
    container.appendChild(covidSection);
    container.appendChild(peaksSection);
}

// Crear sección de informe
function createReportSection(sectionTitle, items) {
    const section = document.createElement('div');
    section.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
        border-left: 4px solid #3498db;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;
    
    const title = document.createElement('h4');
    title.textContent = sectionTitle;
    title.style.cssText = `
        margin: 0 0 12px 0;
        color: #2c3e50;
        font-size: 14px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    `;
    
    section.appendChild(title);
    
    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            border-bottom: 1px solid #ecf0f1;
        `;
        
        const label = document.createElement('span');
        label.textContent = item.label;
        label.style.cssText = `
            font-size: 12px;
            color: #555;
        `;
        
        const value = document.createElement('span');
        value.textContent = item.value;
        value.style.cssText = `
            font-size: 12px;
            font-weight: bold;
            color: ${item.color || '#2c3e50'};
        `;
        
        itemDiv.appendChild(label);
        itemDiv.appendChild(value);
        section.appendChild(itemDiv);
    });
    
    return section;
}

// Inicializar gráfico de país
function initCountryChart(countryData) {
    const container = document.getElementById('country-chart-container');
    if (!container || !countryData.timeSeries) return;
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Crear SVG
    const margin = { top: 20, right: 80, bottom: 40, left: 80 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    
    const svg = d3.select(container)
        .append('svg')
        .attr('width', container.clientWidth)
        .attr('height', container.clientHeight);
    
    const chartGroup = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    countryChart = {
        svg: svg,
        chartGroup: chartGroup,
        width: width,
        height: height,
        margin: margin,
        data: countryData.timeSeries
    };
    
    updateCountryChart();
}

// Actualizar gráfico según variables seleccionadas
function updateCountryChart() {
    if (!countryChart || !countryChart.data) return;
    
    const { chartGroup, width, height, data } = countryChart;
    
    // Limpiar gráfico anterior
    chartGroup.selectAll('*').remove();
    
    // Obtener variables habilitadas
    const enabledVars = Object.entries(chartVariables)
        .filter(([key, config]) => config.enabled)
        .map(([key, config]) => ({ key, ...config }));
    
    if (enabledVars.length === 0) {
        chartGroup.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('fill', '#999')
            .text('Seleccione al menos una variable para mostrar');
        return;
    }
    
    // Parsear fechas
    const parseDate = d3.timeParse('%Y-%m-%d');
    const chartData = data.map(d => ({
        ...d,
        date: parseDate(d.date)
    })).filter(d => d.date).sort((a, b) => a.date - b.date);
    
    // Escalas
    const xScale = d3.scaleTime()
        .domain(d3.extent(chartData, d => d.date))
        .range([0, width]);
    
    // Calcular dominio Y considerando todas las variables habilitadas
    let yMin = 0;
    let yMax = 0;
    enabledVars.forEach(variable => {
        const values = chartData.map(d => d[variable.key]).filter(v => v != null && !isNaN(v));
        if (values.length > 0) {
            yMin = Math.min(yMin, d3.min(values));
            yMax = Math.max(yMax, d3.max(values));
        }
    });
    
    const yScale = d3.scaleLinear()
        .domain([yMin, yMax * 1.1])
        .range([height, 0]);
    
    // Ejes
    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat('%b %Y'));
    
    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d => formatNumberLarge(d));
    
    chartGroup.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis)
        .selectAll('text')
        .style('font-size', '10px');
    
    chartGroup.append('g')
        .call(yAxis)
        .selectAll('text')
        .style('font-size', '10px');
    
    // Líneas para cada variable
    const line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);
    
    enabledVars.forEach(variable => {
        const lineData = chartData
            .map(d => ({ date: d.date, value: d[variable.key] }))
            .filter(d => d.value != null && !isNaN(d.value));
        
        if (lineData.length > 0) {
            chartGroup.append('path')
                .datum(lineData)
                .attr('fill', 'none')
                .attr('stroke', variable.color)
                .attr('stroke-width', 2)
                .attr('d', line);
        }
    });
    
    // Leyenda
    const legend = chartGroup.append('g')
        .attr('transform', `translate(${width + 10}, 20)`);
    
    enabledVars.forEach((variable, i) => {
        const legendItem = legend.append('g')
            .attr('transform', `translate(0, ${i * 20})`);
        
        legendItem.append('line')
            .attr('x1', 0)
            .attr('x2', 15)
            .attr('y1', 0)
            .attr('y2', 0)
            .attr('stroke', variable.color)
            .attr('stroke-width', 2);
        
        legendItem.append('text')
            .attr('x', 20)
            .attr('y', 0)
            .attr('dy', '0.35em')
            .style('font-size', '10px')
            .style('fill', '#333')
            .text(variable.label);
    });
}

// Cerrar ventana de detalles
function closeCountryDetails() {
    if (countryDetailsWindow) {
        document.removeEventListener('keydown', handleEscKey);
        document.body.removeChild(countryDetailsWindow);
        countryDetailsWindow = null;
        countryChart = null;
        currentCountryData = null;
    }
}

// Manejadores de eventos
function handleEscKey(event) {
    if (event.key === 'Escape') {
        closeCountryDetails();
    }
}

function handleOverlayClick(event) {
    if (event.target.id === 'country-details-overlay') {
        closeCountryDetails();
    }
}

// Funciones auxiliares
function formatNumberLarge(num) {
    if (num == null || isNaN(num)) return 'N/D';
    
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return Math.round(num).toString();
}

// Exponer funciones globales necesarias
window.showCountryDetails = showCountryDetails;
window.closeCountryDetails = closeCountryDetails;

console.log('countryDetails.js cargado correctamente');