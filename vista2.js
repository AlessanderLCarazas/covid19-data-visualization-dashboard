// ========== VISTA 2 (Panel Superior Derecho) - 4 Gráficos COVID-19 CON ANIMACIÓN TEMPORAL MEJORADA ==========
let svg2 = null;
let currentData2 = [];
let currentContinent2 = '';
let currentCountry2 = 'ALL'; // Por defecto mostrar todo el continente
// NUEVAS VARIABLES PARA ANIMACIÓN TEMPORAL
let vista2AnimationInterval = null;
let vista2CurrentTimeIndex = 0;
let vista2MaxTimeIndex = 0;
let vista2AnimationSpeed = 1000;
let vista2IsPlaying = false;
let vista2TimeData = []; // Datos agrupados por período temporal
let vista2AllCountries = []; // Lista de todos los países
// DATOS ACUMULATIVOS PARA ANIMACIÓN PROGRESIVA
let vista2AccumulativeData = {
    graph2: [], // Contagios vs Vacunas
    graph4: []  // Contagios vs Muertes
};
// NUEVA VARIABLE PARA CONTROLAR CARGA ÚNICA DEL GRÁFICO RNA
let vista2RNALoaded = false;
// Dimensiones y márgenes para los 4 gráficos
const margin = { top: 20, right: 20, bottom: 40, left: 50 };
let graphWidth, graphHeight;
// Escalas de colores para consistencia visual
const colorScale = {
    diabetes: "#FFD700",           // Dorado
    cardiovascular: "#4682B4",     // Azul acero
    elderly: "#9932CC",            // Violeta
    poverty: "#FF8C00",            // Naranja oscuro
    contagios: "#DC143C",          // Rojo carmesí
    vacunas: "#228B22",            // Verde bosque
    muertes: "#8B0000",            // Rojo oscuro
    casos: "#FF6347",              // Tomate
    paises: "#1E90FF"              // Azul dodger
};

function initVista2() {
  svg2 = d3.select("#svg2");
  const containerWidth = parseInt(svg2.style("width"));
  const containerHeight = parseInt(svg2.style("height"));

  // Calcular dimensiones para grid 2x2
  graphWidth = (containerWidth - 60) / 2;
  graphHeight = (containerHeight - 80) / 2;

  // Limpiar contenido previo
  svg2.selectAll("*").remove();

  // Detener animaciones previas
  if (vista2AnimationInterval) {
    clearInterval(vista2AnimationInterval);
    vista2AnimationInterval = null;
  }

  // Resetear control de carga RNA
  vista2RNALoaded = false;

  // Crear título principal
  svg2.append("text")
    .attr("x", containerWidth / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("fill", "#333")
    .text("Panel de Análisis COVID-19 - Evolución Temporal");

  // Crear botón "Ver Continente"
  svg2.append("foreignObject")
    .attr("x", containerWidth - 150)
    .attr("y", 5)
    .attr("width", 140)
    .attr("height", 30)
    .append("xhtml:button")
    .attr("type", "button")
    .style("width", "100%")
    .style("padding", "5px")
    .style("font-size", "12px")
    .style("background-color", "#4CAF50")
    .style("color", "white")
    .style("border", "none")
    .style("border-radius", "5px")
    .style("cursor", "pointer")
    .text("Ver Continente")
    .on("click", function() {
      // Restablecer la vista para mostrar datos por continente
      currentCountry2 = 'ALL';
      updateCountrySpecificGraphs();
      updateMainTitle();
    });

  // Crear contenedores para los 4 gráficos
  createGraphContainers();

  console.log("Vista 2 inicializada - Panel de 4 gráficos con animación temporal");
}



function createGraphContainers() {
    const positions = [
        { x: 20, y: 40, id: "graph1", title: "Factores de Riesgo (RNA)" },
        { x: graphWidth + 40, y: 40, id: "graph2", title: "Contagios vs Vacunas" },
        { x: 20, y: graphHeight + 60, id: "graph3", title: "Casos por País" }, // Se cambiará dinámicamente
        { x: graphWidth + 40, y: graphHeight + 60, id: "graph4", title: "Contagios vs Muertes" }
    ];
    
    positions.forEach(pos => {
        const container = svg2.append("g")
            .attr("class", `${pos.id}-container`)
            .attr("transform", `translate(${pos.x}, ${pos.y})`);
        
        // Fondo del gráfico
        container.append("rect")
            .attr("width", graphWidth)
            .attr("height", graphHeight)
            .attr("fill", "#f8f9fa")
            .attr("stroke", "#dee2e6")
            .attr("stroke-width", 1)
            .attr("rx", 5);
        
        // Título del gráfico (dinámico para graph3)
        container.append("text")
            .attr("class", "graph-title")
            .attr("x", graphWidth / 2)
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", "#495057")
            .text(pos.title);
    });
}

// NUEVA FUNCIÓN: Actualizar solo título principal
function updateMainTitle() {
    const containerWidth = parseInt(svg2.style("width"));
    
    svg2.select("text") // El título principal
        .text(`Panel COVID-19 - ${currentCountry2 === 'ALL' ? currentContinent2 : currentCountry2}`);
}

// NUEVA FUNCIÓN: Actualizar solo gráficos específicos del país sin reiniciar
function updateCountrySpecificGraphs() {
    if (!vista2TimeData || vista2CurrentTimeIndex >= vista2TimeData.length) return;
    
    // Obtener datos hasta el período ACTUAL de la animación (no reiniciar)
    const dataUpToCurrentIndex = [];
    for (let i = 0; i <= vista2CurrentTimeIndex; i++) {
        if (vista2TimeData[i]) {
            dataUpToCurrentIndex.push(...vista2TimeData[i].data);
        }
    }
    
    const filteredData = getFilteredData(dataUpToCurrentIndex);
    const currentPeriod = vista2TimeData[vista2CurrentTimeIndex] || vista2TimeData[0];
    
    // Limpiar solo datos acumulativos de gráficos que cambian
    vista2AccumulativeData.graph2 = [];
    vista2AccumulativeData.graph4 = [];
    
    // Re-acumular datos hasta el período actual con el nuevo filtro
    for (let i = 0; i <= vista2CurrentTimeIndex; i++) {
        if (vista2TimeData[i]) {
            const periodData = getFilteredData(vista2TimeData[i].data);
            const periodInfo = vista2TimeData[i];
            
            // Re-generar datos acumulativos para gráfico 2
            updateAccumulativeData2(periodData, periodInfo);
            // Re-generar datos acumulativos para gráfico 4  
            updateAccumulativeData4(periodData, periodInfo);
        }
    }
    
    // Actualizar solo gráficos que cambian
    updateGraph2ContagiosVacunas(filteredData, vista2CurrentTimeIndex, currentPeriod);
    updateGraph4ContagiosMuertes(filteredData, vista2CurrentTimeIndex, currentPeriod);
    
    // Cambiar gráfico 3 según el contexto
    if (currentCountry2 === 'ALL') {
        // Mostrar casos por país
        updateGraph3Title("Casos por País");
        updateGraph3CasosPorPais(dataUpToCurrentIndex, vista2CurrentTimeIndex, currentPeriod);
    } else {
        // Mostrar otro gráfico para país específico (ej: evolución temporal de casos)
        updateGraph3Title(`Evolución - ${currentCountry2}`);
        updateGraph3CountryEvolution(filteredData, vista2CurrentTimeIndex, currentPeriod);
    }
}

// NUEVA FUNCIÓN: Actualizar título del gráfico 3
function updateGraph3Title(newTitle) {
    svg2.select(".graph3-container .graph-title")
        .transition()
        .duration(300)
        .style("opacity", 0)
        .on("end", function() {
            d3.select(this)
                .text(newTitle)
                .transition()
                .duration(300)
                .style("opacity", 1);
        });
}

// NUEVAS FUNCIONES: Actualizar datos acumulativos por separado
function updateAccumulativeData2(data, currentPeriod) {
    const parseDate = d3.timeParse("%Y-%m-%d");
    const newTimeData = d3.rollups(
        data.filter(d => d.date && parseDate(d.date) <= currentPeriod.endDate),
        v => ({
            casos: d3.sum(v, d => +d.new_cases || 0),
            vacunas: d3.sum(v, d => +d.people_vaccinated || 0),
            total_vacunas: d3.sum(v, d => +d.total_vaccinations || 0)
        }),
        d => d.date
    ).map(([date, values]) => ({
        date: parseDate(date),
        casos: values.casos,
        vacunas: Math.max(values.vacunas, values.total_vacunas),
        period: currentPeriod.label
    })).filter(d => d.date && d.date <= currentPeriod.endDate)
      .sort((a, b) => a.date - b.date);
    
    // Acumular en vista2AccumulativeData.graph2
    newTimeData.forEach(newPoint => {
        const existingIndex = vista2AccumulativeData.graph2.findIndex(
            existing => existing.date.getTime() === newPoint.date.getTime()
        );
        
        if (existingIndex === -1) {
            vista2AccumulativeData.graph2.push(newPoint);
        } else {
            vista2AccumulativeData.graph2[existingIndex] = newPoint;
        }
    });
    
    vista2AccumulativeData.graph2.sort((a, b) => a.date - b.date);
}

function updateAccumulativeData4(data, currentPeriod) {
    const parseDate = d3.timeParse("%Y-%m-%d");
    const newTimeData = d3.rollups(
        data.filter(d => d.date && parseDate(d.date) <= currentPeriod.endDate),
        v => ({
            casos: d3.sum(v, d => +d.new_cases || 0),
            muertes: d3.sum(v, d => +d.new_deaths || 0)
        }),
        d => d.date
    ).map(([date, values]) => ({
        date: parseDate(date),
        casos: values.casos,
        muertes: values.muertes,
        period: currentPeriod.label
    })).filter(d => d.date && d.date <= currentPeriod.endDate)
      .sort((a, b) => a.date - b.date);
    
    // Acumular en vista2AccumulativeData.graph4
    newTimeData.forEach(newPoint => {
        const existingIndex = vista2AccumulativeData.graph4.findIndex(
            existing => existing.date.getTime() === newPoint.date.getTime()
        );
        
        if (existingIndex === -1) {
            vista2AccumulativeData.graph4.push(newPoint);
        } else {
            vista2AccumulativeData.graph4[existingIndex] = newPoint;
        }
    });
    
    vista2AccumulativeData.graph4.sort((a, b) => a.date - b.date);
}

function updateVista2(data, continent) {
    currentData2 = data;
    currentContinent2 = continent;
    
    // Detener animaciones previas
    resetVista2TimeAnimation();
    
    if (!data || data.length === 0) {
        showNoDataMessage();
        return;
    }
    
    // AJUSTE 1: Cargar RNA solo una vez al inicio
    if (!vista2RNALoaded) {
        updateGraph1RNA(data);
        vista2RNALoaded = true;
    }
    
    // Preparar datos temporales
    prepareTemporalData(data);
    
    // Crear selector de países
    createCountrySelector(data);
    
    // Inicializar gráficos vacíos (excepto RNA que ya se cargó)
    initializeEmptyGraphics();
    
    console.log(`Vista 2 actualizada para ${continent} con ${data.length} registros - ${vista2MaxTimeIndex + 1} períodos temporales`);
}

// ========== FUNCIONES DE ANIMACIÓN TEMPORAL ==========
// NUEVA: Función global para iniciar animación Vista 2 (compatible con controles HTML)
window.startVista2TimeAnimation = function() {
    if (vista2IsPlaying || !vista2TimeData || vista2TimeData.length === 0) return;
    
    vista2IsPlaying = true;
    console.log("Iniciando animación temporal Vista 2...");
    
    // Resetear datos acumulativos
    vista2AccumulativeData = {
        graph2: [],
        graph4: []
    };
    
    vista2AnimationInterval = setInterval(() => {
        if (vista2CurrentTimeIndex <= vista2MaxTimeIndex) {
            updateVista2ToTimeIndex(vista2CurrentTimeIndex);
            vista2CurrentTimeIndex++;
        } else {
            // Reiniciar animación al completarse
            vista2CurrentTimeIndex = 0;
            vista2AccumulativeData = { graph2: [], graph4: [] };
            clearAllGraphics();
        }
    }, vista2AnimationSpeed);
};

// NUEVA: Función global para pausar animación Vista 2
window.pauseVista2TimeAnimation = function() {
    if (!vista2IsPlaying) return;
    
    vista2IsPlaying = false;
    if (vista2AnimationInterval) {
        clearInterval(vista2AnimationInterval);
        vista2AnimationInterval = null;
    }
    console.log("Animación temporal Vista 2 pausada");
};

// NUEVA: Función global para actualizar velocidad Vista 2
window.updateVista2AnimationSpeed = function(newSpeed) {
    vista2AnimationSpeed = newSpeed;
    if (vista2IsPlaying) {
        pauseVista2TimeAnimation();
        startVista2TimeAnimation();
    }
    console.log(`Velocidad de animación Vista 2 actualizada: ${newSpeed}ms`);
};

function resetVista2TimeAnimation() {
    if (vista2AnimationInterval) {
        clearInterval(vista2AnimationInterval);
        vista2AnimationInterval = null;
    }
    vista2IsPlaying = false;
    vista2CurrentTimeIndex = 0;
    vista2AccumulativeData = { graph2: [], graph4: [] };
    clearAllGraphics();
}

function prepareTemporalData(data) {
    const parseDate = d3.timeParse("%Y-%m-%d");
    const inicio = new Date("2020-01-05"); // Fecha real de inicio según tus datos
    const fin = new Date("2024-08-04");   // Fecha real de fin según tus datos
    
    // Agrupar datos por períodos de 15 DÍAS (igual que Vista 1 para consistencia)
    const groupedByPeriod = d3.group(data, d => {
        const date = parseDate(d.date);
        if (!date || date < inicio || date > fin) return -1;
        return Math.floor((date - inicio) / (1000 * 60 * 60 * 24 * 15));
    });
    
    // Eliminar períodos inválidos
    groupedByPeriod.delete(-1);
    
    // Convertir a array ordenado por período
    vista2TimeData = Array.from(groupedByPeriod.entries())
        .sort(([a], [b]) => a - b)
        .map(([period, records]) => {
            const startDate = new Date(inicio.getTime() + period * 15 * 24 * 60 * 60 * 1000);
            const endDate = new Date(inicio.getTime() + (period + 1) * 15 * 24 * 60 * 60 * 1000 - 1);
            
            return {
                period,
                data: records,
                startDate: startDate,
                endDate: endDate,
                // FORMATO SOLICITADO: "DD/MM/YYYY - DD/MM/YYYY"
                label: `${startDate.getDate().toString().padStart(2, '0')}/${(startDate.getMonth() + 1).toString().padStart(2, '0')}/${startDate.getFullYear()} - ${endDate.getDate().toString().padStart(2, '0')}/${(endDate.getMonth() + 1).toString().padStart(2, '0')}/${endDate.getFullYear()}`
            };
        });
    
    vista2MaxTimeIndex = vista2TimeData.length - 1;
    vista2AllCountries = [...new Set(data.map(d => d.location))];
    
    console.log(`Datos temporales preparados: ${vista2TimeData.length} períodos de 15 días`);
    console.log(`Rango: ${vista2TimeData[0]?.label} hasta ${vista2TimeData[vista2MaxTimeIndex]?.label}`);
}

function updateVista2ToTimeIndex(timeIndex) {
    if (!vista2TimeData || timeIndex >= vista2TimeData.length) return;
    
    // Obtener datos acumulados hasta el período actual
    const dataUpToIndex = [];
    for (let i = 0; i <= timeIndex; i++) {
        if (vista2TimeData[i]) {
            dataUpToIndex.push(...vista2TimeData[i].data);
        }
    }
    
    const filteredData = getFilteredData(dataUpToIndex);
    const currentPeriod = vista2TimeData[timeIndex];
    
    // Actualizar gráficos (RNA no se actualiza más)
    updateGraph2ContagiosVacunas(filteredData, timeIndex, currentPeriod);
    updateGraph4ContagiosMuertes(filteredData, timeIndex, currentPeriod);
    
    // Gráfico 3 depende del contexto (continente vs país)
    if (currentCountry2 === 'ALL') {
        updateGraph3CasosPorPais(dataUpToIndex, timeIndex, currentPeriod); // Todos los países
    } else {
        updateGraph3CountryEvolution(filteredData, timeIndex, currentPeriod); // Evolución del país
    }
    
    // Actualizar indicador de fecha actual
    updateCurrentDateIndicator(currentPeriod.label);
}

// NUEVO GRÁFICO 3 ALTERNATIVO: Evolución temporal del país seleccionado
function updateGraph3CountryEvolution(data, timeIndex, currentPeriod) {
    const container = svg2.select(".graph3-container");
    let graphContent = container.select(".graph-content");
    
    if (graphContent.empty()) {
        initEmptyGraph3Evolution();
        graphContent = container.select(".graph-content");
    }
    
    if (!data || data.length === 0) {
        // Mostrar mensaje de no datos para el país
        showCountryNoDataMessage();
        return;
    }
    
    // Procesar datos temporales del país
    const parseDate = d3.timeParse("%Y-%m-%d");
    const timeData = d3.rollups(
        data.filter(d => d.date && parseDate(d.date) <= currentPeriod.endDate),
        v => ({
            casos_nuevos: d3.sum(v, d => +d.new_cases || 0),
            muertes_nuevas: d3.sum(v, d => +d.new_deaths || 0),
            casos_totales: d3.max(v, d => +d.total_cases || 0),
            vacunas_totales: d3.max(v, d => +d.people_vaccinated || 0)
        }),
        d => d.date
    ).map(([date, values]) => ({
        date: parseDate(date),
        ...values
    })).filter(d => d.date)
      .sort((a, b) => a.date - b.date);
    
    if (timeData.length === 0) return;
    
    // Escalas
    const xScale = d3.scaleTime()
        .domain(d3.extent(timeData, d => d.date))
        .range([margin.left, graphWidth - margin.right]);
    
    const maxCases = d3.max(timeData, d => d.casos_totales) || 1;
    const maxVaccines = d3.max(timeData, d => d.vacunas_totales) || 1;
    
    const yScaleCases = d3.scaleLinear()
        .domain([0, maxCases])
        .range([graphHeight - margin.bottom, margin.top + 20]);
    
    const yScaleVaccines = d3.scaleLinear()
        .domain([0, maxVaccines])
        .range([graphHeight - margin.bottom, margin.top + 20]);
    
    // Actualizar ejes
    graphContent.select(".x-axis-base")
        .transition().duration(300)
        .call(d3.axisBottom(xScale)
            .tickFormat(d3.timeFormat("%b %Y"))
            .ticks(d3.timeMonth.every(6)))
        .selectAll("text")
        .style("font-size", "8px")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");
    
    graphContent.select(".y-axis-left-base")
        .transition().duration(300)
        .call(d3.axisLeft(yScaleCases).ticks(5).tickFormat(d3.format(".0s")))
        .selectAll("text")
        .style("font-size", "8px")
        .style("fill", colorScale.casos);
    
    graphContent.select(".y-axis-right-base")
        .transition().duration(300)
        .call(d3.axisRight(yScaleVaccines).ticks(5).tickFormat(d3.format(".0s")))
        .selectAll("text")
        .style("font-size", "8px")
        .style("fill", colorScale.vacunas);
    
    const linesContainer = graphContent.select(".lines-container");
    
    // Línea de casos totales acumulados
    const casesLine = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScaleCases(d.casos_totales))
        .curve(d3.curveMonotoneX);
    
    let casesPath = linesContainer.select(".total-cases-line");
    if (casesPath.empty()) {
        casesPath = linesContainer.append("path")
            .attr("class", "total-cases-line")
            .attr("fill", "none")
            .attr("stroke", colorScale.casos)
            .attr("stroke-width", 4);
    }
    
    casesPath
        .datum(timeData.filter(d => d.casos_totales > 0))
        .transition()
        .duration(400)
        .attr("d", casesLine);
    
    // Línea de vacunas si hay datos
    const vaccinesData = timeData.filter(d => d.vacunas_totales > 0);
    if (vaccinesData.length > 0) {
        const vaccinesLine = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScaleVaccines(d.vacunas_totales))
            .curve(d3.curveMonotoneX);
        
        let vaccinesPath = linesContainer.select(".total-vaccines-line");
        if (vaccinesPath.empty()) {
            vaccinesPath = linesContainer.append("path")
                .attr("class", "total-vaccines-line")
                .attr("fill", "none")
                .attr("stroke", colorScale.vacunas)
                .attr("stroke-width", 4)
                .attr("stroke-dasharray", "10,5");
        }
        
        vaccinesPath
            .datum(vaccinesData)
            .transition()
            .duration(400)
            .attr("d", vaccinesLine);
    }
    
    // Área bajo la curva de casos
    const area = d3.area()
        .x(d => xScale(d.date))
        .y0(graphHeight - margin.bottom)
        .y1(d => yScaleCases(d.casos_totales))
        .curve(d3.curveMonotoneX);
    
    let areaPath = linesContainer.select(".cases-area");
    if (areaPath.empty()) {
        areaPath = linesContainer.append("path")
            .attr("class", "cases-area")
            .attr("fill", colorScale.casos)
            .attr("fill-opacity", 0.1);
    }
    
    areaPath
        .datum(timeData.filter(d => d.casos_totales > 0))
        .transition()
        .duration(400)
        .attr("d", area);
    
    // Leyenda específica del país
    updateCountryEvolutionLegend(graphContent);
}

function initEmptyGraph3Evolution() {
    const container = svg2.select(".graph3-container");
    container.selectAll(".graph-content").remove();
    
    const graphContent = container.append("g").attr("class", "graph-content");
    
    // Ejes base
    const xAxisGroup = graphContent.append("g")
        .attr("class", "x-axis-base")
        .attr("transform", `translate(0, ${graphHeight - margin.bottom})`);
    
    const yAxisLeftGroup = graphContent.append("g")
        .attr("class", "y-axis-left-base")
        .attr("transform", `translate(${margin.left}, 0)`);
    
    const yAxisRightGroup = graphContent.append("g")
        .attr("class", "y-axis-right-base")
        .attr("transform", `translate(${graphWidth - margin.right}, 0)`);
    
    // Contenedores
    graphContent.append("g").attr("class", "lines-container");
    graphContent.append("g").attr("class", "legend-container");
}

function updateCountryEvolutionLegend(graphContent) {
    let legend = graphContent.select(".legend-container").select(".country-legend");
    if (legend.empty()) {
        legend = graphContent.select(".legend-container")
            .append("g")
            .attr("class", "country-legend")
            .attr("transform", `translate(${graphWidth - 120}, ${margin.top + 25})`);
        
        // Casos totales
        legend.append("line")
            .attr("x1", 0).attr("x2", 15)
            .attr("y1", 0).attr("y2", 0)
            .attr("stroke", colorScale.casos)
            .attr("stroke-width", 4);
        
        legend.append("text")
            .attr("x", 20).attr("y", 0)
            .attr("dy", "0.35em")
            .style("font-size", "9px")
            .style("fill", colorScale.casos)
            .style("font-weight", "bold")
            .text("Casos Totales");
        
        // Vacunas totales
        legend.append("line")
            .attr("x1", 0).attr("x2", 15)
            .attr("y1", 12).attr("y2", 12)
            .attr("stroke", colorScale.vacunas)
            .attr("stroke-width", 4)
            .attr("stroke-dasharray", "10,5");
        
        legend.append("text")
            .attr("x", 20).attr("y", 12)
            .attr("dy", "0.35em")
            .style("font-size", "9px")
            .style("fill", colorScale.vacunas)
            .style("font-weight", "bold")
            .text("Vacunas Totales");
    }
}

function showCountryNoDataMessage() {
    const container = svg2.select(".graph3-container");
    container.selectAll(".graph-content").remove();
    
    const graphContent = container.append("g").attr("class", "graph-content");
    
    graphContent.append("text")
        .attr("x", graphWidth / 2)
        .attr("y", graphHeight / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#999")
        .text(`Sin datos suficientes para ${currentCountry2}`);
}

function updateCurrentDateIndicator(dateLabel) {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = `Período: ${dateLabel}`;
    }
}
if (typeof eventManager === 'undefined') {
  console.error('EventManager is not defined');
} else {
  // Función para actualizar la selección de país
  function updateCountrySelection(countryName) {
    const select = document.getElementById('countrySelector');
    if (select) {
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === countryName) {
          select.selectedIndex = i;
          currentCountry2 = countryName;
          updateCountrySpecificGraphs();
          updateMainTitle();
          break;
        }
      }
    }
  }

  // Suscribirse al evento de selección de país
  eventManager.subscribe('countrySelected', updateCountrySelection);
}

function createCountrySelector(data) {
  // Remover selector previo si existe
  d3.select("#countrySelectorContainer").remove();

  // Obtener países únicos
  const countries = ['ALL', ...new Set(data.map(d => d.location))];

  // Crear contenedor para el selector
  const selectorContainer = d3.select("#svg2")
    .append("foreignObject")
    .attr("id", "countrySelectorContainer")
    .attr("x", parseInt(svg2.style("width")) - 200)
    .attr("y", 5)
    .attr("width", 180)
    .attr("height", 30)
    .style("visibility", "hidden"); // Ocultar el contenedor

  // Crear selector
  const select = selectorContainer.append("xhtml:select")
    .attr("id", "countrySelector")
    .style("width", "100%")
    .style("padding", "4px")
    .style("font-size", "11px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "3px")
    .on("change", function() {
      const previousCountry = currentCountry2;
      currentCountry2 = this.value;
      updateCountrySpecificGraphs();
      updateMainTitle();
      console.log(`Cambio de filtro: ${previousCountry} → ${currentCountry2} (Sin reiniciar animación)`);
    });

  // Agregar opciones al selector
  select.selectAll("option")
    .data(countries)
    .enter()
    .append("xhtml:option")
    .attr("value", d => d)
    .text(d => d === 'ALL' ? `Todo ${currentContinent2}` : d);
}


function getFilteredData(data) {
    if (currentCountry2 === 'ALL') {
        return data;
    }
    return data.filter(d => d.location === currentCountry2);
}

function initializeEmptyGraphics() {
    clearAllGraphics();
    
    // Inicializar gráficos (excepto RNA que ya está cargado)
    initEmptyGraph2();
    initEmptyGraph3();
    initEmptyGraph4();
}

function clearAllGraphics() {
    // No limpiar el RNA si ya está cargado
    svg2.selectAll(".graph2-container .graph-content, .graph3-container .graph-content, .graph4-container .graph-content").remove();
}

// ========== GRÁFICO 1: FACTORES DE RIESGO (RNA) - CARGA ÚNICA ==========
// AJUSTE 1: Este gráfico ahora se carga solo UNA VEZ y no se actualiza más
function updateGraph1RNA(data) {
    const container = svg2.select(".graph1-container");
    container.selectAll(".graph-content").remove();
    
    const graphContent = container.append("g").attr("class", "graph-content");
    
    if (!data || data.length === 0) return;
    
    const centerX = graphWidth / 2;
    const centerY = graphHeight / 2;
    const maxRadius = Math.min(graphWidth, graphHeight) / 3;
    
    // Círculos de referencia permanentes
    const referenceCircles = [0.25, 0.5, 0.75, 1];
    referenceCircles.forEach(factor => {
        graphContent.append("circle")
            .attr("class", "reference-circle")
            .attr("cx", centerX)
            .attr("cy", centerY)
            .attr("r", maxRadius * factor)
            .attr("fill", "none")
            .attr("stroke", "#dee2e6")
            .attr("stroke-width", 1)
            .attr("opacity", 0.5);
    });
    
    // Obtener valores promedio de todos los datos (carga única)
    const rnaFactors = {
        diabetes: d3.mean(data, d => +d.diabetes_prevalence || 0),
        cardiovascular: d3.mean(data, d => +d.cardiovasc_death_rate || 0) / 10, // Escalar
        elderly: d3.mean(data, d => +d.aged_70_older || 0),
        poverty: d3.mean(data, d => +d.extreme_poverty || 0) || 5 // Valor por defecto si es 0
    };
    
    // Escala radial
    const maxValue = Math.max(...Object.values(rnaFactors), 1);
    const radiusScale = d3.scaleLinear()
        .domain([0, maxValue])
        .range([0, maxRadius]);
    
    // Datos para el gráfico radial
    const rnaData = Object.entries(rnaFactors).map(([key, value], i) => ({
        key,
        value,
        angle: (i * 2 * Math.PI) / 4 - Math.PI / 2,
        color: colorScale[key]
    }));
    
    // Crear path radial con animación única
    const lineGenerator = d3.line()
        .x(d => centerX + Math.cos(d.angle) * radiusScale(d.value))
        .y(d => centerY + Math.sin(d.angle) * radiusScale(d.value))
        .curve(d3.curveLinearClosed);
    
    // Área del polígono con animación única
    const polygonPath = graphContent.append("path")
        .datum(rnaData)
        .attr("fill", colorScale.diabetes)
        .attr("fill-opacity", 0)
        .attr("stroke", colorScale.diabetes)
        .attr("stroke-width", 0)
        .attr("d", lineGenerator);
    
    // Animar aparición del polígono (solo una vez)
    polygonPath.transition()
        .duration(1000)
        .attr("fill-opacity", 0.2)
        .attr("stroke-width", 2);
    
    // Puntos y etiquetas con animación única
    rnaData.forEach((d, i) => {
        const x = centerX + Math.cos(d.angle) * radiusScale(d.value);
        const y = centerY + Math.sin(d.angle) * radiusScale(d.value);
        
        // Punto animado
        const point = graphContent.append("circle")
            .attr("cx", centerX)
            .attr("cy", centerY)
            .attr("r", 0)
            .attr("fill", d.color)
            .attr("stroke", "white")
            .attr("stroke-width", 2);
        
        point.transition()
            .delay(i * 150)
            .duration(600)
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 5);
        
        // Línea de referencia
        const labelX = centerX + Math.cos(d.angle) * (maxRadius + 20);
        const labelY = centerY + Math.sin(d.angle) * (maxRadius + 20);
        
        const refLine = graphContent.append("line")
            .attr("x1", centerX)
            .attr("y1", centerY)
            .attr("x2", centerX)
            .attr("y2", centerY)
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "2,2");
        
        refLine.transition()
            .delay(i * 150 + 300)
            .duration(400)
            .attr("x2", labelX)
            .attr("y2", labelY);
        
        // Etiqueta con nombre del factor
        const label = graphContent.append("text")
            .attr("x", labelX)
            .attr("y", labelY)
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .style("fill", d.color)
            .style("opacity", 0)
            .text(`${d.key === 'diabetes' ? 'Diabetes' : 
                   d.key === 'cardiovascular' ? 'Cardiov.' : 
                   d.key === 'elderly' ? '+70 años' : 'Pobreza'}`);
        
        label.transition()
            .delay(i * 150 + 600)
            .duration(300)
            .style("opacity", 1);
        
        // Valor del factor
        const valueLabel = graphContent.append("text")
            .attr("x", labelX)
            .attr("y", labelY + 15)
            .attr("text-anchor", "middle")
            .style("font-size", "9px")
            .style("fill", "#666")
            .style("font-weight", "bold")
            .style("opacity", 0)
            .text(`${d.value.toFixed(1)}%`);
        
        valueLabel.transition()
            .delay(i * 150 + 800)
            .duration(300)
            .style("opacity", 1);
    });
    
    console.log("RNA Factores de Riesgo cargado UNA VEZ - No se actualizará más");
}

// ========== GRÁFICO 2: CONTAGIOS VS VACUNAS CON EJE X VISIBLE ==========
function initEmptyGraph2() {
    const container = svg2.select(".graph2-container");
    container.selectAll(".graph-content").remove();
    
    const graphContent = container.append("g").attr("class", "graph-content");
    
    // Crear escalas básicas (se actualizarán con datos reales)
    const xScale = d3.scaleTime()
        .domain([new Date("2020-01-01"), new Date("2024-12-31")])
        .range([margin.left, graphWidth - margin.right]);
    
    // Crear ejes base que persisten
    const xAxisGroup = graphContent.append("g")
        .attr("class", "x-axis-base")
        .attr("transform", `translate(0, ${graphHeight - margin.bottom})`);
    
    const yAxisLeftGroup = graphContent.append("g")
        .attr("class", "y-axis-left-base")
        .attr("transform", `translate(${margin.left}, 0)`);
    
    const yAxisRightGroup = graphContent.append("g")
        .attr("class", "y-axis-right-base")
        .attr("transform", `translate(${graphWidth - margin.right}, 0)`);
    
    // Crear contenedor para las líneas
    graphContent.append("g").attr("class", "lines-container");
    graphContent.append("g").attr("class", "legend-container");
}

function updateGraph2ContagiosVacunas(data, timeIndex, currentPeriod) {
    const container = svg2.select(".graph2-container");
    let graphContent = container.select(".graph-content");
    
    if (graphContent.empty()) {
        initEmptyGraph2();
        graphContent = container.select(".graph-content");
    }
    
    if (!data || data.length === 0) return;
    
    // Procesar datos por fecha hasta el período actual
    const parseDate = d3.timeParse("%Y-%m-%d");
    const newTimeData = d3.rollups(
        data.filter(d => d.date && parseDate(d.date) <= currentPeriod.endDate),
        v => ({
            casos: d3.sum(v, d => +d.new_cases || 0),
            vacunas: d3.sum(v, d => +d.people_vaccinated || 0),
            total_vacunas: d3.sum(v, d => +d.total_vaccinations || 0)
        }),
        d => d.date
    ).map(([date, values]) => ({
        date: parseDate(date),
        casos: values.casos,
        vacunas: Math.max(values.vacunas, values.total_vacunas),
        period: currentPeriod.label
    })).filter(d => d.date && d.date <= currentPeriod.endDate)
      .sort((a, b) => a.date - b.date);
    
    // ACUMULAR DATOS PROGRESIVAMENTE
    newTimeData.forEach(newPoint => {
        const existingIndex = vista2AccumulativeData.graph2.findIndex(
            existing => existing.date.getTime() === newPoint.date.getTime()
        );
        
        if (existingIndex === -1) {
            vista2AccumulativeData.graph2.push(newPoint);
        } else {
            vista2AccumulativeData.graph2[existingIndex] = newPoint;
        }
    });
    
    vista2AccumulativeData.graph2.sort((a, b) => a.date - b.date);
    const timeData = vista2AccumulativeData.graph2;
    
    if (timeData.length === 0) return;
    
    // Escalas actualizadas
    const xScale = d3.scaleTime()
        .domain(d3.extent(timeData, d => d.date))
        .range([margin.left, graphWidth - margin.right]);
    
    const maxCases = d3.max(timeData, d => d.casos) || 1;
    const maxVaccines = d3.max(timeData, d => d.vacunas) || 1;
    
    const yScaleCases = d3.scaleLinear()
        .domain([0, maxCases])
        .range([graphHeight - margin.bottom, margin.top + 20]);
    
    const yScaleVaccines = d3.scaleLinear()
        .domain([0, maxVaccines])
        .range([graphHeight - margin.bottom, margin.top + 20]);
    
    // AJUSTE 2: EJE X SIEMPRE VISIBLE CON MES Y AÑO
    graphContent.select(".x-axis-base")
        .transition().duration(300)
        .call(d3.axisBottom(xScale)
            .tickFormat(d3.timeFormat("%b %Y")) // MES Y AÑO VISIBLE
            .ticks(d3.timeMonth.every(6))) // Cada 6 meses
        .selectAll("text")
        .style("font-size", "8px")
        .style("font-weight", "bold")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");
    
    // Eje Y izquierdo (casos)
    graphContent.select(".y-axis-left-base")
        .transition().duration(300)
        .call(d3.axisLeft(yScaleCases).ticks(5).tickFormat(d3.format(".0s")))
        .selectAll("text")
        .style("font-size", "8px")
        .style("fill", colorScale.contagios);
    
    // Eje Y derecho (vacunas)
    graphContent.select(".y-axis-right-base")
        .transition().duration(300)
        .call(d3.axisRight(yScaleVaccines).ticks(5).tickFormat(d3.format(".0s")))
        .selectAll("text")
        .style("font-size", "8px")
        .style("fill", colorScale.vacunas);
    
    const linesContainer = graphContent.select(".lines-container");
    
    // LÍNEA DE CASOS - PROGRESIVA
    const casesLine = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScaleCases(d.casos))
        .curve(d3.curveMonotoneX);
    
    let casesPath = linesContainer.select(".cases-line");
    if (casesPath.empty()) {
        casesPath = linesContainer.append("path")
            .attr("class", "cases-line")
            .attr("fill", "none")
            .attr("stroke", colorScale.contagios)
            .attr("stroke-width", 3);
    }
    
    casesPath
        .datum(timeData.filter(d => d.casos > 0))
        .transition()
        .duration(400)
        .attr("d", casesLine);
    
    // LÍNEA DE VACUNAS - PROGRESIVA
    const vaccinesData = timeData.filter(d => d.vacunas > 0);
    if (vaccinesData.length > 0) {
        const vaccinesLine = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScaleVaccines(d.vacunas))
            .curve(d3.curveMonotoneX);
        
        let vaccinesPath = linesContainer.select(".vaccines-line");
        if (vaccinesPath.empty()) {
            vaccinesPath = linesContainer.append("path")
                .attr("class", "vaccines-line")
                .attr("fill", "none")
                .attr("stroke", colorScale.vacunas)
                .attr("stroke-width", 3)
                .attr("stroke-dasharray", "8,4");
        }
        
        vaccinesPath
            .datum(vaccinesData)
            .transition()
            .duration(400)
            .attr("d", vaccinesLine);
    }
    
    // Leyenda (solo crear una vez)
    let legend = graphContent.select(".legend-container").select(".legend-group");
    if (legend.empty()) {
        legend = graphContent.select(".legend-container")
            .append("g")
            .attr("class", "legend-group")
            .attr("transform", `translate(${graphWidth - 100}, ${margin.top + 30})`);
        
        // Casos en leyenda
        legend.append("line")
            .attr("x1", 0).attr("x2", 15)
            .attr("y1", 0).attr("y2", 0)
            .attr("stroke", colorScale.contagios)
            .attr("stroke-width", 3);
        
        legend.append("text")
            .attr("x", 20).attr("y", 0)
            .attr("dy", "0.35em")
            .style("font-size", "9px")
            .style("fill", colorScale.contagios)
            .style("font-weight", "bold")
            .text("Casos");
        
        // Vacunas en leyenda
        legend.append("line")
            .attr("x1", 0).attr("x2", 15)
            .attr("y1", 12).attr("y2", 12)
            .attr("stroke", colorScale.vacunas)
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", "8,4");
        
        legend.append("text")
            .attr("x", 20).attr("y", 12)
            .attr("dy", "0.35em")
            .style("font-size", "9px")
            .style("fill", colorScale.vacunas)
            .style("font-weight", "bold")
            .text("Vacunas");
    }
}

// ========== GRÁFICO 3: CASOS POR PAÍS CON NOMBRES VISIBLES ==========
function initEmptyGraph3() {
    const container = svg2.select(".graph3-container");
    container.selectAll(".graph-content").remove();
    
    const graphContent = container.append("g").attr("class", "graph-content");
    
    // Crear ejes base
    const xAxisGroup = graphContent.append("g")
        .attr("class", "x-axis-base")
        .attr("transform", `translate(0, ${graphHeight - margin.bottom})`);
    
    const yAxisGroup = graphContent.append("g")
        .attr("class", "y-axis-base")
        .attr("transform", `translate(${margin.left}, 0)`);
    
    // Contenedor para círculos y etiquetas
    graphContent.append("g").attr("class", "circles-container");
    graphContent.append("g").attr("class", "labels-container");
}

function updateGraph3CasosPorPais(data, timeIndex, currentPeriod) {
    const container = svg2.select(".graph3-container");
    let graphContent = container.select(".graph-content");
    
    if (graphContent.empty()) {
        initEmptyGraph3();
        graphContent = container.select(".graph-content");
    }
    
    if (!data || data.length === 0) return;
    
    // Agregar datos por país hasta el período actual
    const parseDate = d3.timeParse("%Y-%m-%d");
    const countryData = d3.rollups(
        data.filter(d => {
            const recordDate = parseDate(d.date);
            return recordDate && recordDate <= currentPeriod.endDate;
        }),
        v => ({
            totalCases: d3.max(v, d => +d.total_cases || 0),
            population: d3.max(v, d => +d.population || 0) || 1000000,
            country: v[0].location,
            newCases: d3.sum(v, d => +d.new_cases || 0)
        }),
        d => d.location
    ).map(([country, values]) => values)
     .filter(d => d.totalCases > 0 && d.population > 0)
     .sort((a, b) => b.totalCases - a.totalCases) // Ordenar por casos
     .slice(0, 12); // Limitar a 12 países para que las etiquetas sean legibles
    
    if (countryData.length === 0) return;
    
    // Escalas
    const maxPop = d3.max(countryData, d => d.population);
    const minPop = d3.min(countryData, d => d.population);
    
    const xScale = d3.scaleLog()
        .domain([minPop, maxPop])
        .range([margin.left, graphWidth - margin.right]);
    
    const maxCases = d3.max(countryData, d => d.totalCases);
    const minCases = Math.max(1, d3.min(countryData, d => d.totalCases));
    
    const yScale = d3.scaleLog()
        .domain([minCases, maxCases])
        .range([graphHeight - margin.bottom, margin.top + 20]);
    
    // ESCALA DE TAMAÑO QUE SE EXPANDE CON MÁS CASOS
    const sizeScale = d3.scaleSqrt()
        .domain([0, maxCases])
        .range([3, 18]);
    
    // Actualizar ejes
    if (timeIndex === 0 || timeIndex % 3 === 0) {
        graphContent.select(".x-axis-base")
            .transition().duration(400)
            .call(d3.axisBottom(xScale).tickFormat(d => d3.format(".0s")(d)).ticks(4))
            .selectAll("text")
            .style("font-size", "7px");
        
        graphContent.select(".y-axis-base")
            .transition().duration(400)
            .call(d3.axisLeft(yScale).tickFormat(d => d3.format(".0s")(d)).ticks(4))
            .selectAll("text")
            .style("font-size", "7px");
        
        // Etiquetas de ejes (una sola vez)
        if (timeIndex === 0) {
            graphContent.selectAll(".axis-label").remove();
            
            graphContent.append("text")
                .attr("class", "axis-label")
                .attr("x", graphWidth / 2)
                .attr("y", graphHeight - 5)
                .attr("text-anchor", "middle")
                .style("font-size", "9px")
                .style("fill", "#666")
                .style("font-weight", "bold")
                .text("Población");
            
            graphContent.append("text")
                .attr("class", "axis-label")
                .attr("transform", "rotate(-90)")
                .attr("x", -graphHeight / 2)
                .attr("y", 12)
                .attr("text-anchor", "middle")
                .style("font-size", "9px")
                .style("fill", "#666")
                .style("font-weight", "bold")
                .text("Casos Totales");
        }
    }
    
    const circlesContainer = graphContent.select(".circles-container");
    const labelsContainer = graphContent.select(".labels-container");
    
    // CÍRCULOS ANIMADOS QUE SE EXPANDEN
    const circles = circlesContainer.selectAll(".country-circle")
        .data(countryData, d => d.country);
    
    // Círculos nuevos
    const circlesEnter = circles.enter()
        .append("circle")
        .attr("class", "country-circle")
        .attr("cx", d => xScale(d.population))
        .attr("cy", d => yScale(d.totalCases))
        .attr("r", 0)
        .attr("fill", colorScale.paises)
        .attr("fill-opacity", 0.7)
        .attr("stroke", "white")
        .attr("stroke-width", 2);
    
    // Actualizar círculos existentes + nuevos
    circles.merge(circlesEnter)
        .transition()
        .duration(600)
        .attr("cx", d => xScale(d.population))
        .attr("cy", d => yScale(d.totalCases))
        .attr("r", d => sizeScale(d.totalCases));
    
    // Remover círculos que ya no están
    circles.exit()
        .transition()
        .duration(300)
        .attr("r", 0)
        .remove();
    
    // AJUSTE 3: ETIQUETAS CON NOMBRES DE PAÍSES SIEMPRE VISIBLES
    const labels = labelsContainer.selectAll(".country-label")
        .data(countryData, d => d.country);
    
    // Etiquetas nuevas
    const labelsEnter = labels.enter()
        .append("text")
        .attr("class", "country-label")
        .attr("x", d => xScale(d.population))
        .attr("y", d => yScale(d.totalCases) - sizeScale(d.totalCases) - 3)
        .attr("text-anchor", "middle")
        .style("font-size", "8px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .style("opacity", 0)
        .text(d => {
            // Abreviar nombres muy largos
            if (d.country.length > 12) {
                return d.country.substring(0, 10) + "...";
            }
            return d.country;
        });
    
    // Actualizar etiquetas existentes + nuevas
    labels.merge(labelsEnter)
        .transition()
        .duration(600)
        .attr("x", d => xScale(d.population))
        .attr("y", d => yScale(d.totalCases) - sizeScale(d.totalCases) - 3)
        .style("opacity", 1)
        .text(d => {
            if (d.country.length > 12) {
                return d.country.substring(0, 10) + "...";
            }
            return d.country;
        });
    
    // Remover etiquetas que ya no están
    labels.exit()
        .transition()
        .duration(300)
        .style("opacity", 0)
        .remove();
    
    // ETIQUETAS CON NÚMERO DE CASOS DEBAJO DEL NOMBRE
    const caseLabels = labelsContainer.selectAll(".case-label")
        .data(countryData, d => d.country);
    
    const caseLabelsEnter = caseLabels.enter()
        .append("text")
        .attr("class", "case-label")
        .attr("x", d => xScale(d.population))
        .attr("y", d => yScale(d.totalCases) - sizeScale(d.totalCases) + 8)
        .attr("text-anchor", "middle")
        .style("font-size", "7px")
        .style("fill", "#666")
        .style("opacity", 0)
        .text(d => d3.format(".2s")(d.totalCases));
    
    caseLabels.merge(caseLabelsEnter)
        .transition()
        .duration(600)
        .attr("x", d => xScale(d.population))
        .attr("y", d => yScale(d.totalCases) - sizeScale(d.totalCases) + 8)
        .style("opacity", 1)
        .text(d => d3.format(".2s")(d.totalCases));
    
    caseLabels.exit()
        .transition()
        .duration(300)
        .style("opacity", 0)
        .remove();
}

// ========== GRÁFICO 4: CONTAGIOS VS MUERTES CON EJE X VISIBLE ==========
function initEmptyGraph4() {
    const container = svg2.select(".graph4-container");
    container.selectAll(".graph-content").remove();
    
    const graphContent = container.append("g").attr("class", "graph-content");
    
    // Crear ejes base que persisten
    const xAxisGroup = graphContent.append("g")
        .attr("class", "x-axis-base")
        .attr("transform", `translate(0, ${graphHeight - margin.bottom})`);
    
    const yAxisLeftGroup = graphContent.append("g")
        .attr("class", "y-axis-left-base")
        .attr("transform", `translate(${margin.left}, 0)`);
    
    const yAxisRightGroup = graphContent.append("g")
        .attr("class", "y-axis-right-base")
        .attr("transform", `translate(${graphWidth - margin.right}, 0)`);
    
    // Crear contenedor para las líneas
    graphContent.append("g").attr("class", "lines-container");
    graphContent.append("g").attr("class", "legend-container");
}

function updateGraph4ContagiosMuertes(data, timeIndex, currentPeriod) {
    const container = svg2.select(".graph4-container");
    let graphContent = container.select(".graph-content");
    
    if (graphContent.empty()) {
        initEmptyGraph4();
        graphContent = container.select(".graph-content");
    }
    
    if (!data || data.length === 0) return;
    
    // Procesar datos por fecha hasta el período actual
    const parseDate = d3.timeParse("%Y-%m-%d");
    const newTimeData = d3.rollups(
        data.filter(d => d.date && parseDate(d.date) <= currentPeriod.endDate),
        v => ({
            casos: d3.sum(v, d => +d.new_cases || 0),
            muertes: d3.sum(v, d => +d.new_deaths || 0)
        }),
        d => d.date
    ).map(([date, values]) => ({
        date: parseDate(date),
        casos: values.casos,
        muertes: values.muertes,
        period: currentPeriod.label
    })).filter(d => d.date && d.date <= currentPeriod.endDate)
      .sort((a, b) => a.date - b.date);
    
    // ACUMULAR DATOS PROGRESIVAMENTE
    newTimeData.forEach(newPoint => {
        const existingIndex = vista2AccumulativeData.graph4.findIndex(
            existing => existing.date.getTime() === newPoint.date.getTime()
        );
        
        if (existingIndex === -1) {
            vista2AccumulativeData.graph4.push(newPoint);
        } else {
            vista2AccumulativeData.graph4[existingIndex] = newPoint;
        }
    });
    
    vista2AccumulativeData.graph4.sort((a, b) => a.date - b.date);
    const timeData = vista2AccumulativeData.graph4;
    
    if (timeData.length === 0) return;
    
    // Escalas actualizadas
    const xScale = d3.scaleTime()
        .domain(d3.extent(timeData, d => d.date))
        .range([margin.left, graphWidth - margin.right]);
    
    const maxCases = d3.max(timeData, d => d.casos) || 1;
    const maxDeaths = d3.max(timeData, d => d.muertes) || 1;
    
    const yScaleCases = d3.scaleLinear()
        .domain([0, maxCases])
        .range([graphHeight - margin.bottom, margin.top + 20]);
    
    const yScaleDeaths = d3.scaleLinear()
        .domain([0, maxDeaths])
        .range([graphHeight - margin.bottom, margin.top + 20]);
    
    // AJUSTE 2: EJE X SIEMPRE VISIBLE CON MES Y AÑO
    graphContent.select(".x-axis-base")
        .transition().duration(300)
        .call(d3.axisBottom(xScale)
            .tickFormat(d3.timeFormat("%b %Y")) // MES Y AÑO VISIBLE
            .ticks(d3.timeMonth.every(6))) // Cada 6 meses
        .selectAll("text")
        .style("font-size", "8px")
        .style("font-weight", "bold")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");
    
    // Eje Y izquierdo (casos)
    graphContent.select(".y-axis-left-base")
        .transition().duration(300)
        .call(d3.axisLeft(yScaleCases).ticks(5).tickFormat(d3.format(".0s")))
        .selectAll("text")
        .style("font-size", "8px")
        .style("fill", colorScale.casos);
    
    // Eje Y derecho (muertes)
    graphContent.select(".y-axis-right-base")
        .transition().duration(300)
        .call(d3.axisRight(yScaleDeaths).ticks(5).tickFormat(d3.format(".0s")))
        .selectAll("text")
        .style("font-size", "8px")
        .style("fill", colorScale.muertes);
    
    const linesContainer = graphContent.select(".lines-container");
    
    // LÍNEA DE CASOS - PROGRESIVA
    const casesLine = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScaleCases(d.casos))
        .curve(d3.curveMonotoneX);
    
    let casesPath = linesContainer.select(".cases-line");
    if (casesPath.empty()) {
        casesPath = linesContainer.append("path")
            .attr("class", "cases-line")
            .attr("fill", "none")
            .attr("stroke", colorScale.casos)
            .attr("stroke-width", 3);
    }
    
    casesPath
        .datum(timeData.filter(d => d.casos > 0))
        .transition()
        .duration(400)
        .attr("d", casesLine);
    
    // LÍNEA DE MUERTES - PROGRESIVA
    const deathsData = timeData.filter(d => d.muertes > 0);
    if (deathsData.length > 0) {
        const deathsLine = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScaleDeaths(d.muertes))
            .curve(d3.curveMonotoneX);
        
        let deathsPath = linesContainer.select(".deaths-line");
        if (deathsPath.empty()) {
            deathsPath = linesContainer.append("path")
                .attr("class", "deaths-line")
                .attr("fill", "none")
                .attr("stroke", colorScale.muertes)
                .attr("stroke-width", 3)
                .attr("stroke-dasharray", "6,3");
        }
        
        deathsPath
            .datum(deathsData)
            .transition()
            .duration(400)
            .attr("d", deathsLine);
    }
    
    // Leyenda (solo crear una vez)
    let legend = graphContent.select(".legend-container").select(".legend-group");
    if (legend.empty()) {
        legend = graphContent.select(".legend-container")
            .append("g")
            .attr("class", "legend-group")
            .attr("transform", `translate(${graphWidth - 100}, ${margin.top + 30})`);
        
        // Casos en leyenda
        legend.append("line")
            .attr("x1", 0).attr("x2", 15)
            .attr("y1", 0).attr("y2", 0)
            .attr("stroke", colorScale.casos)
            .attr("stroke-width", 3);
        
        legend.append("text")
            .attr("x", 20).attr("y", 0)
            .attr("dy", "0.35em")
            .style("font-size", "9px")
            .style("fill", colorScale.casos)
            .style("font-weight", "bold")
            .text("Casos");
        
        // Muertes en leyenda
        legend.append("line")
            .attr("x1", 0).attr("x2", 15)
            .attr("y1", 12).attr("y2", 12)
            .attr("stroke", colorScale.muertes)
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", "6,3");
        
        legend.append("text")
            .attr("x", 20).attr("y", 12)
            .attr("dy", "0.35em")
            .style("font-size", "9px")
            .style("fill", colorScale.muertes)
            .style("font-weight", "bold")
            .text("Muertes");
    }
}

function showNoDataMessage() {
    svg2.selectAll(".graph-content, .dynamic-element").remove();
    svg2.append("text")
        .attr("x", parseInt(svg2.style("width")) / 2)
        .attr("y", parseInt(svg2.style("height")) / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "#666")
        .text("Seleccione un continente para ver los análisis");
}

// ========== INTEGRACIÓN CON EL SISTEMA DE CONTROLES HTML ==========
console.log("Vista 2 MEJORADA con ajustes solicitados:");
console.log("✅ 1. RNA se carga UNA SOLA VEZ (variables fijas)");
console.log("✅ 2. Eje X visible con MES Y AÑO en gráficos 2 y 4");
console.log("✅ 3. Nombres de países visibles en gráfico 3 sin tooltips");
console.log("✅ Todo visual y deductivo como solicitado");