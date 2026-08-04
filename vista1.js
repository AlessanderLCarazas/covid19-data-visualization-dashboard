// ========== VISTA 1 (Panel Superior Izquierdo) - Células Corona con Animación Temporal ==========
let simulation1 = null;
let nodes1 = [];
let zoomBehavior1 = null;
let svg1Container = null;
let datosGlobales = [];
let animationId = null;
let hoveredCorona = null;
// Variables para animación temporal
let vista1AnimationInterval = null;
let vista1CurrentTimeIndex = 0;
let vista1MaxTimeIndex = 0;
let vista1AnimationSpeed = 1000; // Velocidad en milisegundos
let vista1IsPlaying = false;
let allBarrasData = []; // Almacenar datos de todas las barras para animación

function initVista1() {
    const svg1 = d3.select("#svg1");
    const width = parseInt(svg1.style("width"));
    const height = parseInt(svg1.style("height"));

    // Limpiar contenido previo
    svg1.selectAll("*").remove();

    // Detener animaciones previas
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    // Detener animación temporal previa
    if (vista1AnimationInterval) {
        clearInterval(vista1AnimationInterval);
        vista1AnimationInterval = null;
    }

    // Crear contenedor para zoom
    svg1Container = svg1.append("g").attr("class", "zoom-container");

    // Configurar zoom behavior
    zoomBehavior1 = d3.zoom()
        .scaleExtent([0.3, 5])
        .on("zoom", function (event) {
            svg1Container.attr("transform", event.transform);
        });

    // Aplicar zoom al SVG
    svg1.call(zoomBehavior1);

    // Mensaje inicial
    svg1Container.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "#666")
        .text("Seleccione un continente para ver las coronas flotantes");

    console.log("Vista 1 inicializada - Sistema de coronas con física, zoom y animación temporal");
}

function updateVista1(data, continent) {
    const svg1 = d3.select("#svg1");
    const width = parseInt(svg1.style("width"));
    const height = parseInt(svg1.style("height"));

    // Guardar datos globales para uso en las coronas
    datosGlobales = data;

    // Limpiar contenido previo
    svg1Container.selectAll("*").remove();

    // Detener simulación anterior si existe
    if (simulation1) {
        simulation1.stop();
    }

    // Detener animaciones anteriores
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    if (vista1AnimationInterval) {
        clearInterval(vista1AnimationInterval);
        vista1AnimationInterval = null;
    }

    // Resetear estado de animación temporal
    resetVista1TimeAnimation();

    if (!data || data.length === 0) {
        svg1Container.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("fill", "#666")
            .text("No hay datos para este continente");
        return;
    }

    // Obtener países únicos del continente
    const countries = [...new Set(data.map(d => d.location))];

    // Título fijo (no se mueve con zoom)
    const titleGroup = d3.select("#svg1").append("g").attr("class", "title-group");
    titleGroup.append("text")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text(`${continent} - Evolución Temporal COVID-19`);

    // NUEVA: Crear leyenda interactiva
    crearLeyendaInteractiva(titleGroup, width, height);

    // Botón "Cargar Todo" - Fijo en la esquina superior derecha
    const loadAllButton = titleGroup.append("g")
        .attr("class", "load-all-button")
        .attr("transform", `translate(${width - 120}, 10)`)
        .style("cursor", "pointer")
        .on("click", function () {
            cargarTodasLasBarras();
        });

    loadAllButton.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 100)
        .attr("height", 25)
        .attr("fill", "#4CAF50")
        .attr("stroke", "#45a049")
        .attr("stroke-width", 2)
        .attr("rx", 5)
        .style("opacity", 0.9);

    loadAllButton.append("text")
        .attr("x", 50)
        .attr("y", 17)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "white")
        .text("Cargar Todo");

    // Efecto hover en el botón
    loadAllButton
        .on("mouseenter", function () {
            d3.select(this).select("rect").style("opacity", 1);
        })
        .on("mouseleave", function () {
            d3.select(this).select("rect").style("opacity", 0.9);
        });

    // Preparar datos para las células corona - INICIALIZACIÓN TIPO ÁTOMO
    const centerX = width / 2;
    const centerY = height / 2;
    const atomRadius = 80; // Radio del "átomo" inicial

    nodes1 = countries.map((country, i) => {
        // Obtener último registro del país para mostrar casos totales
        const countryRecords = data.filter(d => d.location === country);
        const lastRecord = countryRecords[countryRecords.length - 1];
        const totalCases = parseFloat(lastRecord.total_cases) || 0;
        const population = parseFloat(lastRecord.population) || 1;

        // Calcular radio basado en casos, con límites MÁS GRANDES
        const baseRadius = Math.sqrt(totalCases / 30000) + 40;
        const radius = Math.max(50, Math.min(90, baseRadius));

        const datosPorPais = prepararDatosPorPais(country, data);

        // POSICIONAMIENTO INICIAL TIPO ÁTOMO - MÁS COMPACTO
        const angle = (2 * Math.PI * i) / countries.length;
        const atomX = centerX + Math.cos(angle) * atomRadius;
        const atomY = centerY + Math.sin(angle) * atomRadius;

        return {
            id: country,
            country: country,
            totalCases: totalCases,
            population: population,
            radius: radius,
            x: atomX, // Posición inicial en círculo
            y: atomY, // Posición inicial en círculo
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            targetVx: (Math.random() - 0.5) * 1.5,
            targetVy: (Math.random() - 0.5) * 1.5,
            datos: datosPorPais,
            isHovered: false,
            // ELIMINADO: rotationAngle y rotationSpeed
        };
    });

    // Calcular maxTimeIndex para la animación temporal
    vista1MaxTimeIndex = Math.max(...nodes1.map(n => n.datos.length)) - 1;

    // Configurar simulación de fuerzas - CONFIGURACIÓN PARA MANTENER FORMACIÓN COMPACTA
    simulation1 = d3.forceSimulation(nodes1)
        .force("collision", d3.forceCollide().radius(d => d.radius + 10).strength(0.7))
        .force("center", d3.forceCenter(width / 2, height / 2).strength(0.3)) // Más fuerza central
        .force("charge", d3.forceManyBody().strength(-30)) // Menos repulsión
        .force("boundary", boundaryForce)
        .force("drift", driftForce)
        .alpha(0.3) // Menos energía inicial
        .alphaDecay(0.005) // Decaimiento más rápido
        .velocityDecay(0.8); // Más fricción 

    // Crear grupos para cada corona
    const coronaGroups = svg1Container.selectAll(".corona-group")
        .data(nodes1)
        .enter()
        .append("g")
        .attr("class", "corona-group")
        .style("cursor", "pointer");

    // Dibujar coronas en cada grupo (inicialmente sin barras visibles)
    coronaGroups.each(function (d) {
        dibujarCoronaEnGrupo(d3.select(this), d);
    });

    // Interactividad mejorada - CORREGIDA PARA RESPETAR PERÍODO
    coronaGroups
    .on("mouseenter", function (event, d) {
        // PAUSAR MOVIMIENTO de esta corona específica
        pauseMovementForNode(d.id);
        
        hoveredCorona = d.id;
        
        // Solo mostrar barras que están dentro del período actual al hacer hover
        const coronaContent = d3.select(this).select('.corona-content');
        coronaContent.selectAll('.barra').each(function () {
            const barra = d3.select(this);
            const fechaIndex = parseInt(barra.attr('data-fecha'));
            if (fechaIndex <= vista1CurrentTimeIndex) {
                barra.attr('opacity', 1);
            } else {
                barra.attr('opacity', 0);
            }
        });
        
        d3.select(this).select('.corona-content')
            .transition()
            .duration(300)
            .attr("transform", `scale(1.1)`);
    })
    .on("mouseleave", function (event, d) {
        // REANUDAR MOVIMIENTO de esta corona
        resumeMovementForNode(d.id);
        
        if (hoveredCorona === d.id) {
            hoveredCorona = null;
        }
        
        // Restaurar estado correcto de las barras según el período actual
        const coronaContent = d3.select(this).select('.corona-content');
        coronaContent.selectAll('.barra').each(function () {
            const barra = d3.select(this);
            const fechaIndex = parseInt(barra.attr('data-fecha'));
            if (fechaIndex <= vista1CurrentTimeIndex) {
                barra.attr('opacity', 1).attr('stroke-width', 4);
            } else {
                barra.attr('opacity', 0).attr('stroke-width', 0);
            }
        });
        
        d3.select(this).select('.corona-content')
            .transition()
            .duration(300)
            .attr("transform", `scale(1)`);
    })
    .on("click", function (event, d) {
        if (event.target.classList.contains('barra') || event.target.classList.contains('rna')) {
            return;
        }
        d3.select(this).select('.corona-content')
            .transition()
            .duration(150)
            .attr("transform", `scale(1.4)`)
            .transition()
            .duration(150)
            .attr("transform", `scale(${d.isHovered ? 1.1 : 1})`);
    });
    // Actualizar posiciones en cada tick de la simulación
    simulation1.on("tick", function () {
        nodes1.forEach(node => {
            if (!node.isHovered) {
                node.vx += (node.targetVx - node.vx) * 0.05;
                node.vy += (node.targetVy - node.vy) * 0.05;

                // ELIMINADO: rotationAngle y rotationSpeed

                if (Math.random() < 0.005) {
                    node.targetVx = (Math.random() - 0.5) * 2;
                    node.targetVy = (Math.random() - 0.5) * 2;
                    // ELIMINADO: rotationSpeed
                }
            }
        });

        coronaGroups.each(function (d) {
            const group = d3.select(this);

            group.attr("transform", `translate(${d.x}, ${d.y})`);

            const coronaContent = group.select('.corona-content');
            const scale = d.isHovered ? 1.1 : 1;
            // ELIMINADO: rotation
            coronaContent.attr("transform", `scale(${scale})`); // SIN ROTACIÓN

            group.select('.corona-label').attr("transform", "translate(0, 0)");
        });
    });

    // Función de fuerza de deriva para movimiento constante - REDUCIDA PARA MANTENER COMPACTO
    function driftForce() {
        for (let node of nodes1) {
            if (!node.isHovered && !node.fx && !node.fy) {
                const angle = node.driftAngle || (node.driftAngle = Math.random() * Math.PI * 2);
                const strength = 0.05; // Reducido de 0.1 a 0.05

                node.vx += Math.cos(angle) * strength;
                node.vy += Math.sin(angle) * strength;

                if (Math.random() < 0.001) {
                    node.driftAngle = Math.random() * Math.PI * 2;
                }
            }
        }
    }

    // Iniciar animación continua adicional para efectos visuales
    startFloatingAnimation();

    // Función para mantener las coronas dentro de los límites
    function boundaryForce() {
        const padding = 70;
        for (let node of nodes1) {
            const prevX = node.x;
            const prevY = node.y;

            node.x = Math.max(padding + node.radius, Math.min(width - padding - node.radius, node.x));
            node.y = Math.max(padding + node.radius + 50, Math.min(height - padding - node.radius, node.y));

            if (node.x !== prevX) {
                node.vx = -node.vx * 0.9;
                node.targetVx = (Math.random() - 0.5) * 2;
                node.driftAngle = Math.random() * Math.PI * 2;
            }
            if (node.y !== prevY) {
                node.vy = -node.vy * 0.9;
                node.targetVy = (Math.random() - 0.5) * 2;
                node.driftAngle = Math.random() * Math.PI * 2;
            }
        }
    }

    console.log(`Vista 1 actualizada - ${countries.length} coronas flotantes de ${continent} con animación temporal`);
}

// ========== NUEVA FUNCIÓN: CREAR LEYENDA INTERACTIVA ==========
// ========== NUEVA FUNCIÓN: CREAR LEYENDA INTERACTIVA ==========

function crearLeyendaInteractiva(titleGroup, width, height) {

    const leyendaData = [

        {

            tipo: "barra",

            color: "#dc143c",

            label: "Casos de COVID-19",

            descripcion: "Barras rojas - Casos nuevos por quincena",

            elemento: "line"

        },

        {

            tipo: "nucleo",

            color: "#1a1a1a",

            label: "Núcleo central",

            descripcion: "Círculo negro - Población del país",

            elemento: "circle"

        },

        {

            tipo: "diabetes",

            color: "#ffd700",

            label: "Diabetes",

            descripcion: "Ondas doradas - Prevalencia de diabetes",

            elemento: "path"

        },

        {

            tipo: "mayores",

            color: "#4682b4",

            label: "Mayores de 70",

            descripcion: "Ondas azules - Población mayor de 70 años",

            elemento: "path"

        },

        {

            tipo: "cardiovascular",

            color: "#9932cc",

            label: "Muertes cardiovasculares",

            descripción: "Ondas moradas - Tasa de muertes cardiovasculares",

            elemento: "path"

        },

        {

            tipo: "pobreza",

            color: "#ff8c00",

            label: "Pobreza extrema",

            descripcion: "Ondas naranjas - Porcentaje de pobreza extrema",

            elemento: "path"

        }

    ];



    // CAMBIO: Contenedor de la leyenda - esquina inferior izquierda, más pequeño y más abajo

    const leyendaGroup = titleGroup.append("g")

        .attr("class", "leyenda-interactiva")

        .attr("transform", `translate(20, ${height - (leyendaData.length * 30 + 40)})`); // AJUSTADO: espaciado reducido y más abajo



    // CAMBIO: Fondo de la leyenda - más pequeño

    const fondoLeyenda = leyendaGroup.append("rect")

        .attr("x", -12) // AJUSTADO: reducido

        .attr("y", -12) // AJUSTADO: reducido

        .attr("width", 320) // AJUSTADO: más pequeño

        .attr("height", leyendaData.length * 30 + 25) // AJUSTADO: espaciado reducido

        .attr("fill", "rgba(255, 255, 255, 0.95)")

        .attr("stroke", "#ddd")

        .attr("stroke-width", 1)

        .attr("rx", 5)

        .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");



    // CAMBIO: Título de la leyenda - más pequeño

    leyendaGroup.append("text")

        .attr("x", 5) // AJUSTADO: reducido

        .attr("y", 5) // AJUSTADO: reducido

        .style("font-size", "14px") // AJUSTADO: más pequeño

        .style("font-weight", "bold")

        .style("fill", "#333")

        .text("Elementos de las coronas:");



    // CAMBIO: Elementos de la leyenda - espaciado más pequeño

    const elementos = leyendaGroup.selectAll(".elemento-leyenda")

        .data(leyendaData)

        .enter()

        .append("g")

        .attr("class", "elemento-leyenda")

        .attr("transform", (d, i) => `translate(5, ${22 + i * 30})`) // AJUSTADO: espaciado reducido

        .style("cursor", "pointer");



    // CAMBIO: Dibujar elementos visuales en la leyenda - más pequeños

    elementos.each(function (d) {

        const elemento = d3.select(this);



        switch (d.tipo) {

            case "barra":

                elemento.append("line")

                    .attr("x1", 5) // AJUSTADO: reducido

                    .attr("y1", 0)

                    .attr("x2", 22) // AJUSTADO: más pequeño

                    .attr("y2", 0)

                    .attr("stroke", d.color)

                    .attr("stroke-width", 5) // AJUSTADO: más delgado

                    .attr("stroke-linecap", "round");

                break;



            case "nucleo":

                elemento.append("circle")

                    .attr("cx", 14) // AJUSTADO: reducido

                    .attr("cy", 0)

                    .attr("r", 9) // AJUSTADO: más pequeño

                    .attr("fill", d.color)

                    .attr("stroke", "#ffffff")

                    .attr("stroke-width", 2);

                break;



            default: // Para las ondas RNA - más pequeñas

                const waveData = d3.range(25).map(i => { // AJUSTADO: menos puntos

                    const t = i / 24;

                    const angle = t * Math.PI;

                    const wave = Math.cos(t * 4 * 2 * Math.PI);

                    const radius = 9 + wave * 2; // AJUSTADO: más pequeño

                    return [5 + Math.cos(angle) * radius * 0.7, Math.sin(angle) * radius * 0.4];

                });



                const waveLine = d3.line()

                    .x(d => d[0])

                    .y(d => d[1])

                    .curve(d3.curveCatmullRom.alpha(0.5));



                elemento.append("path")

                    .datum(waveData)

                    .attr("d", waveLine)

                    .attr("fill", "none")

                    .attr("stroke", d.color)

                    .attr("stroke-width", 2); // AJUSTADO: más delgado

                break;

        }



        // CAMBIO: Texto descriptivo - más pequeño

        elemento.append("text")

            .attr("x", 35) // AJUSTADO: reducido

            .attr("y", 0)

            .attr("dy", "0.35em")

            .style("font-size", "13px") // AJUSTADO: más pequeño

            .style("fill", "#333")

            .text(d.label);



        elemento.append("text")

            .attr("x", 35) // AJUSTADO: reducido

            .attr("y", 12) // AJUSTADO: reducido

            .style("font-size", "11px") // AJUSTADO: más pequeño

            .style("fill", "#666")

            .text(d.descripcion);

    });



    // Interactividad de la leyenda

    elementos

        .on("mouseenter", function (event, d) {

            d3.select(this).select("rect").remove();

            d3.select(this).insert("rect", ":first-child")

                .attr("x", -5) // AJUSTADO: reducido

                .attr("y", -10) // AJUSTADO: reducido

                .attr("width", 300) // AJUSTADO: más pequeño

                .attr("height", 25) // AJUSTADO: más pequeño

                .attr("fill", "rgba(0, 100, 200, 0.1)")

                .attr("rx", 3);



            resaltarElementosEnCoronas(d.tipo, true);

        })

        .on("mouseleave", function (event, d) {

            d3.select(this).select("rect").remove();

            resaltarElementosEnCoronas(d.tipo, false);

        });

}

// ========== FUNCIÓN PARA RESALTAR ELEMENTOS EN LAS CORONAS ==========
function resaltarElementosEnCoronas(tipo, resaltar) {
    if (!svg1Container) return;

    if (resaltar) {
        // Atenuar todos los elementos
        svg1Container.selectAll(".barra, .rna, .corona-content circle").attr("opacity", 0.2);

        // Resaltar elementos del tipo específico
        switch (tipo) {
            case "barra":
                svg1Container.selectAll(".barra").each(function () {
                    const barra = d3.select(this);
                    const fechaIndex = parseInt(barra.attr('data-fecha'));
                    if (fechaIndex <= vista1CurrentTimeIndex) {
                        barra.attr("opacity", 1).attr("stroke-width", 6);
                    }
                });
                break;

            case "nucleo":
                svg1Container.selectAll(".corona-content circle").each(function () {
                    const circulo = d3.select(this);
                    if (circulo.attr("fill") === "#1a1a1a") {
                        circulo.attr("opacity", 1).attr("stroke-width", 4);
                    }
                });
                break;

            case "diabetes":
                svg1Container.selectAll(`.rna[data-label='Diabetes']`)
                    .attr("opacity", 1)
                    .attr("stroke-width", 5);
                // NUEVO: Mostrar tooltips
                mostrarTooltipsRNA("Diabetes");
                break;

            case "mayores":
                svg1Container.selectAll(`.rna[data-label='Mayores de 70']`)
                    .attr("opacity", 1)
                    .attr("stroke-width", 5);
                // NUEVO: Mostrar tooltips
                mostrarTooltipsRNA("Mayores de 70");
                break;

            case "cardiovascular":
                svg1Container.selectAll(`.rna[data-label='Muertes cardiovasculares']`)
                    .attr("opacity", 1)
                    .attr("stroke-width", 5);
                // NUEVO: Mostrar tooltips
                mostrarTooltipsRNA("Muertes cardiovasculares");
                break;

            case "pobreza":
                svg1Container.selectAll(`.rna[data-label='Pobreza extrema']`)
                    .attr("opacity", 1)
                    .attr("stroke-width", 5);
                // NUEVO: Mostrar tooltips
                mostrarTooltipsRNA("Pobreza extrema");
                break;
        }
    } else {
        // Restaurar estado normal
        svg1Container.selectAll(".barra, .rna").attr("opacity", function () {
            const elemento = d3.select(this);
            if (elemento.classed("barra")) {
                const fechaIndex = parseInt(elemento.attr('data-fecha'));
                return fechaIndex <= vista1CurrentTimeIndex ? 1 : 0;
            }
            return 1;
        });

        svg1Container.selectAll(".corona-content circle").attr("opacity", 0.9);

        // Restaurar stroke-width
        svg1Container.selectAll(".barra").attr("stroke-width", function () {
            const fechaIndex = parseInt(d3.select(this).attr('data-fecha'));
            return fechaIndex <= vista1CurrentTimeIndex ? 4 : 0;
        });

        svg1Container.selectAll(".rna").attr("stroke-width", 3);
        svg1Container.selectAll(".corona-content circle").attr("stroke-width", function () {
            return d3.select(this).attr("fill") === "#1a1a1a" ? 3 : 4;
        });

        // NUEVO: Remover tooltips
        svg1Container.selectAll(".rna-tooltip").remove();
    }
}

// NUEVA: Función para mostrar tooltips de RNA desde la leyenda
function mostrarTooltipsRNA(label) {
    svg1Container.selectAll(".corona-group").each(function (d) {
        const grupo = d3.select(this);
        const rna = grupo.select(`.rna[data-label='${label}']`);

        if (!rna.empty()) {
            const valor = parseFloat(rna.attr("data-valor"));
            const country = rna.attr("data-country");

            const radioCorona = d.radius;
            const tooltipX = -70;
            const tooltipY = -radioCorona - 30;

            const tooltip = grupo.append("g")
                .attr("class", "rna-tooltip")
                .attr("transform", `translate(${tooltipX}, ${tooltipY})`);

            tooltip.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 140)
                .attr("height", 55)
                .attr("fill", "rgba(0,0,0,0.9)")
                .attr("stroke", rna.attr("stroke"))
                .attr("stroke-width", 2)
                .attr("rx", 5);

            tooltip.append("text")
                .attr("x", 70)
                .attr("y", 15)
                .attr("text-anchor", "middle")
                .style("font-size", "10px")
                .style("font-weight", "bold")
                .style("fill", "white")
                .text(country.length > 12 ? country.substring(0, 10) + "..." : country);

            tooltip.append("text")
                .attr("x", 70)
                .attr("y", 30)
                .attr("text-anchor", "middle")
                .style("font-size", "8px")
                .style("fill", "#ddd")
                .text(label);

            const valorTexto = label === "Muertes cardiovasculares"
                ? `${valor.toFixed(0)}`
                : `${valor.toFixed(2)}%`;

            tooltip.append("text")
                .attr("x", 70)
                .attr("y", 45)
                .attr("text-anchor", "middle")
                .style("font-size", "9px")
                .style("fill", rna.attr("stroke"))
                .style("font-weight", "bold")
                .text(valorTexto);
        }
    });
}

// ========== FUNCIONES DE ANIMACIÓN TEMPORAL GLOBALES ==========
// NUEVA: Función global para iniciar animación (compatible con controles HTML)
window.startVista1TimeAnimation = function () {
    if (vista1IsPlaying || !nodes1 || nodes1.length === 0) return;

    vista1IsPlaying = true;
    console.log("Iniciando animación temporal Vista 1...");

    vista1AnimationInterval = setInterval(() => {
        if (vista1CurrentTimeIndex <= vista1MaxTimeIndex) {
            updateVista1BarrasToTimeIndex(vista1CurrentTimeIndex);
            updateVista1DateDisplay(vista1CurrentTimeIndex);
            vista1CurrentTimeIndex++;
        } else {
            // Reiniciar animación al completarse
            vista1CurrentTimeIndex = 0;
            resetVista1AllBarras();
        }
    }, vista1AnimationSpeed);
};

// NUEVA: Función global para pausar animación
window.pauseVista1TimeAnimation = function () {
    if (!vista1IsPlaying) return;

    vista1IsPlaying = false;
    if (vista1AnimationInterval) {
        clearInterval(vista1AnimationInterval);
        vista1AnimationInterval = null;
    }
    console.log("Animación temporal Vista 1 pausada");
};

// NUEVA: Función global para actualizar velocidad
window.updateVista1AnimationSpeed = function (newSpeed) {
    vista1AnimationSpeed = newSpeed;
    if (vista1IsPlaying) {
        pauseVista1TimeAnimation();
        startVista1TimeAnimation();
    }
    console.log(`Velocidad de animación Vista 1 actualizada: ${newSpeed}ms`);
};

// MODIFICADA: Ahora son funciones locales de vista1
function startVista1TimeAnimation() {
    if (vista1IsPlaying || !nodes1 || nodes1.length === 0) return;

    vista1IsPlaying = true;
    console.log("Iniciando animación temporal Vista 1...");

    vista1AnimationInterval = setInterval(() => {
        if (vista1CurrentTimeIndex <= vista1MaxTimeIndex) {
            updateVista1BarrasToTimeIndex(vista1CurrentTimeIndex);
            updateVista1DateDisplay(vista1CurrentTimeIndex);
            vista1CurrentTimeIndex++;
        } else {
            // Reiniciar animación al completarse
            vista1CurrentTimeIndex = 0;
            resetVista1AllBarras();
        }
    }, vista1AnimationSpeed);
}

function pauseVista1TimeAnimation() {
    if (!vista1IsPlaying) return;

    vista1IsPlaying = false;
    if (vista1AnimationInterval) {
        clearInterval(vista1AnimationInterval);
        vista1AnimationInterval = null;
    }
    console.log("Animación temporal Vista 1 pausada");
}

function resetVista1TimeAnimation() {
    pauseVista1TimeAnimation();
    vista1CurrentTimeIndex = 0;
    updateVista1DateDisplay(0);
    resetVista1AllBarras();
}

function updateVista1AnimationSpeed(newSpeed) {
    vista1AnimationSpeed = newSpeed;
    if (vista1IsPlaying) {
        pauseVista1TimeAnimation();
        startVista1TimeAnimation();
    }
    console.log(`Velocidad de animación Vista 1 actualizada: ${newSpeed}ms`);
}

function updateVista1BarrasToTimeIndex(timeIndex) {
    if (!svg1Container) return;

    svg1Container.selectAll(".corona-group").each(function (nodeData) {
        const grupo = d3.select(this);
        const coronaContent = grupo.select('.corona-content');

        // Mostrar barras hasta el índice actual
        coronaContent.selectAll('.barra').each(function () {
            const barra = d3.select(this);
            const fechaIndex = parseInt(barra.attr('data-fecha'));

            if (fechaIndex <= timeIndex) {
                // Mostrar barra con animación de crecimiento
                barra
                    .classed('barra-animada', true)
                    .transition()
                    .duration(200)
                    .attr('opacity', 1)
                    .attr('stroke-width', 4);
            } else {
                // Ocultar barras futuras
                barra
                    .attr('opacity', 0)
                    .attr('stroke-width', 0);
            }
        });
    });
}

function resetVista1AllBarras() {
    if (!svg1Container) return;

    svg1Container.selectAll('.barra')
        .attr('opacity', 0)
        .attr('stroke-width', 0);
}

function updateVista1DateDisplay(timeIndex) {
    const inicio = new Date("2020-01-01");
    const fechaActual = new Date(inicio.getTime() + timeIndex * 15 * 24 * 60 * 60 * 1000);
    const fechaFin = new Date(fechaActual.getTime() + 14 * 24 * 60 * 60 * 1000);

    const formatoFecha = d3.timeFormat("%d/%m/%Y");
    const rangoTexto = `${formatoFecha(fechaActual)} - ${formatoFecha(fechaFin)}`;

    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        currentDateElement.textContent = `Período: ${rangoTexto}`;
    }
}

// ========== FUNCIONES AUXILIARES ORIGINALES ==========
function prepararDatosPorPais(pais, data) {
    const datosPais = data.filter(d => d.location === pais && +d.new_cases > 0);
    const parseDate = d3.timeParse("%Y-%m-%d");
    const inicio = new Date("2020-01-01");

    const agrupados = d3.rollups(
        datosPais,
        v => d3.sum(v, d => +d.new_cases),
        d => Math.floor((parseDate(d.date) - inicio) / (1000 * 60 * 60 * 24 * 15))
    );

    return agrupados.map(([quincena, casos]) => ({ quincena, casos }));
}

function dibujarCoronaEnGrupo(grupo, nodeData) {
    const r = nodeData.radius;
    const datos = nodeData.datos;
    const country = nodeData.country;

    // Crear contenedor para el contenido rotatorio
    const coronaContent = grupo.append("g")
        .attr("class", "corona-content");

    // Crear contenedor para etiquetas fijas
    const labelContainer = grupo.append("g")
        .attr("class", "corona-label");

    // === CONTENIDO ROTATORIO ===

    // Núcleo central
    const escalaNucleo = d3.scaleSqrt().domain([0, 150000000]).range([8, r * 0.4]);
    const radioNucleo = escalaNucleo(nodeData.population);

    coronaContent.append("circle")
        .attr("r", radioNucleo)
        .attr("fill", "#1a1a1a")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 3)
        .attr("opacity", 0.9)
        .style("shape-rendering", "geometricPrecision");

    // BARRAS RADIALES - INICIALMENTE OCULTAS
    if (datos && datos.length > 0) {
        const max = d3.max(datos, d => d.casos);
        const escala = d3.scaleLinear().domain([0, max]).range([8, r * 0.6]);
        const angulo = 2 * Math.PI / datos.length;

        datos.forEach((d, i) => {
            const a = angulo * i - Math.PI / 2;
            const l = escala(d.casos);
            const radioInterno = r * 0.75;
            const x1 = Math.cos(a) * radioInterno;
            const y1 = Math.sin(a) * radioInterno;
            const x2 = Math.cos(a) * (radioInterno + l);
            const y2 = Math.sin(a) * (radioInterno + l);

            coronaContent.append("line")
                .attr("x1", x1).attr("y1", y1)
                .attr("x2", x2).attr("y2", y2)
                .attr("stroke", "#dc143c")
                .attr("stroke-width", 0) // Inicialmente invisible
                .attr("stroke-linecap", "round")
                .attr("opacity", 0) // Inicialmente invisible
                .attr("class", "barra barra-animada")
                .attr("data-fecha", i)
                .attr("data-casos", d.casos)
                .attr("data-rango", calcularRangoFechas(i))
                .attr("data-x", x2)
                .attr("data-y", y2)
                .attr("data-country", country)
                .style("shape-rendering", "geometricPrecision")
                .style("cursor", "pointer")
                .on("mouseover", function (event) {
                    handleMouseOverBarra(i, event, this);
                })
                .on("mouseout", handleMouseOutBarra);
        });
    }

    // CÍRCULO EXTERIOR
    coronaContent.append("circle")
        .attr("r", r * 0.75)
        .attr("fill", "none")
        .attr("stroke", "#2c2c2c")
        .attr("stroke-width", 4)
        .attr("opacity", 0.8)
        .style("shape-rendering", "geometricPrecision");

    // COMORBILIDADES (RNA)
    const ultimaFila = datosGlobales.find(d => d.location === nodeData.country && +d.new_cases > 0);
    if (ultimaFila) {
        const rnas = [
            { key: "diabetes_prevalence", color: "#ffd700", radio: r * 0.65, max: 20, amplitud: 6, label: "Diabetes" },
            { key: "aged_70_older", color: "#4682b4", radio: r * 0.55, max: 25, amplitud: 5, label: "Mayores de 70" },
            { key: "cardiovasc_death_rate", color: "#9932cc", radio: r * 0.45, max: 700, amplitud: 4, label: "Muertes cardiovasculares" },
            { key: "extreme_poverty", color: "#ff8c00", radio: r * 0.35, max: 70, amplitud: 3, label: "Pobreza extrema" }
        ];

        rnas.forEach(({ key, color, radio, max, amplitud, label }) => {
            const valor = +ultimaFila[key];
            if (isNaN(valor) || valor === 0) return;

            const anguloMax = 2 * Math.PI;
            const anguloValor = Math.max((valor / max) * anguloMax, 0.3);

            const ondas = 8;
            const puntos = 80;

            const waveData = d3.range(puntos).map(i => {
                const t = i / (puntos - 1);
                const angle = t * anguloValor - Math.PI / 2;
                const wave = Math.cos(t * ondas * 2 * Math.PI);
                const radius = radio + wave * amplitud;
                return [Math.cos(angle) * radius, Math.sin(angle) * radius];
            });

            const waveLine = d3.line()
                .x(d => d[0])
                .y(d => d[1])
                .curve(d3.curveCatmullRom.alpha(0.5));

            coronaContent.append("path")
                .datum(waveData)
                .attr("d", waveLine)
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-width", 3)
                .attr("opacity", 1)
                .attr("class", "rna")
                .attr("data-label", label)
                .attr("data-valor", valor)
                .attr("data-country", country)
                .style("shape-rendering", "geometricPrecision")
                .style("cursor", "pointer")
                .on("mouseover", function (event) {
                    handleMouseOverRNA(label, event, this);
                })
                .on("mouseout", handleMouseOutRNA);
        });
    }

    // EFECTO DE BRILLO
    coronaContent.append("circle")
        .attr("r", r * 0.25)
        .attr("cx", -r * 0.3)
        .attr("cy", -r * 0.3)
        .attr("fill", "rgba(255,255,255,0.6)")
        .attr("opacity", 0.8)
        .style("pointer-events", "none")
        .style("shape-rendering", "geometricPrecision");

    // BORDE EXTERIOR ADICIONAL
    coronaContent.append("circle")
        .attr("r", r * 0.76)
        .attr("fill", "none")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1)
        .attr("opacity", 0.4)
        .style("pointer-events", "none")
        .style("shape-rendering", "geometricPrecision");

    // === ETIQUETAS FIJAS (NO ROTAN) ===

    // ETIQUETA DEL PAÍS
    labelContainer.append("text")
        .text(nodeData.country.length > 8 ? nodeData.country.substring(0, 6) + "..." : nodeData.country)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("font-size", Math.max(11, r * 0.2) + "px")
        .attr("font-weight", "bold")
        .attr("fill", "#ffffff")
        .attr("stroke", "#000000")
        .attr("stroke-width", 0.5)
        .style("text-shadow", "2px 2px 4px rgba(0,0,0,0.9)")
        .style("font-family", "Arial, sans-serif")
        .style("pointer-events", "none");

    // INDICADOR DE CASOS TOTALES
    if (nodeData.totalCases > 0) {
        const casosTexto = nodeData.totalCases > 1000000
            ? (nodeData.totalCases / 1000000).toFixed(1) + "M"
            : nodeData.totalCases > 1000
                ? (nodeData.totalCases / 1000).toFixed(0) + "K"
                : nodeData.totalCases.toString();

        labelContainer.append("text")
            .text(casosTexto)
            .attr("text-anchor", "middle")
            .attr("dy", r * 0.5 + 15)
            .attr("font-size", Math.max(8, r * 0.15) + "px")
            .attr("font-weight", "normal")
            .attr("fill", "#ffcc00")
            .attr("stroke", "#000000")
            .attr("stroke-width", 0.3)
            .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.8)")
            .style("font-family", "Arial, sans-serif")
            .style("pointer-events", "none");
    }
}

// ========== FUNCIONES DE INTERACTIVIDAD CORREGIDAS ==========
function calcularRangoFechas(index) {
    const inicio = new Date("2020-01-01");
    const d1 = new Date(inicio.getTime() + index * 15 * 24 * 60 * 60 * 1000);
    const d2 = new Date(d1.getTime() + 14 * 24 * 60 * 60 * 1000);
    return `${d1.toISOString().split("T")[0]} al ${d2.toISOString().split("T")[0]}`;
}

function handleMouseOverBarra(fechaIndex, event, element) {
    // CAMBIO PRINCIPAL: Solo mostrar barras que están dentro del período actual
    svg1Container.selectAll(".barra, .rna").attr("opacity", 0.1);

    // Solo resaltar la barra específica si está dentro del período actual
    if (fechaIndex <= vista1CurrentTimeIndex) {
        svg1Container.selectAll(`.barra[data-fecha='${fechaIndex}']`)
            .attr("opacity", 1)
            .attr("stroke-width", 6);
    }

    // Obtener el grupo donde está el mouse
    const mouseGroup = d3.select(element.closest('.corona-group'));

    svg1Container.selectAll(".corona-group").each(function (d) {
        const grupo = d3.select(this);
        const barra = grupo.select(`.barra[data-fecha='${fechaIndex}']`);

        // Solo mostrar tooltip si la barra está dentro del período actual
        if (!barra.empty() && fechaIndex <= vista1CurrentTimeIndex) {
            const casos = barra.attr("data-casos");
            const rango = barra.attr("data-rango");
            const country = barra.attr("data-country");

            // CAMBIO: Posicionar tooltip arriba de la corona
            const radioCorona = d.radius;
            const tooltipX = -60; // Centrado respecto a la corona
            
            // Si este es el grupo donde está el mouse, ponerlo 10px más arriba
            let tooltipY;
            if (grupo.node() === mouseGroup.node()) {
                tooltipY = -radioCorona - 80; // 10px más arriba para la corona seleccionada
            } else {
                tooltipY = -radioCorona - 80; // Posición normal para las otras coronas
            }

            const tooltip = grupo.append("g")
                .attr("class", "barra-tooltip")
                .attr("transform", `translate(${tooltipX}, ${tooltipY})`);

            tooltip.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 120)
                .attr("height", 60)
                .attr("fill", "rgba(0,0,0,0.9)")
                .attr("stroke", "#dc143c")
                .attr("stroke-width", 2)
                .attr("rx", 5);

            tooltip.append("text")
                .attr("x", 60)
                .attr("y", 15)
                .attr("text-anchor", "middle")
                .style("font-size", "10px")
                .style("font-weight", "bold")
                .style("fill", "white")
                .text(country.length > 10 ? country.substring(0, 8) + "..." : country);

            tooltip.append("text")
                .attr("x", 60)
                .attr("y", 30)
                .attr("text-anchor", "middle")
                .style("font-size", "8px")
                .style("fill", "#ddd")
                .text(rango);

            tooltip.append("text")
                .attr("x", 60)
                .attr("y", 45)
                .attr("text-anchor", "middle")
                .style("font-size", "9px")
                .style("fill", "#dc143c")
                .style("font-weight", "bold")
                .text(`Casos: ${parseInt(casos).toLocaleString()}`);
        }
    });
}

function handleMouseOutBarra() {
    // CAMBIO: Restaurar solo las barras que deberían estar visibles según el período actual
    svg1Container.selectAll(".barra, .rna").attr("opacity", function () {
        const elemento = d3.select(this);

        // Para las barras, verificar si están dentro del período actual
        if (elemento.classed("barra")) {
            const fechaIndex = parseInt(elemento.attr('data-fecha'));
            return fechaIndex <= vista1CurrentTimeIndex ? 1 : 0;
        }

        // Para RNA, mantener siempre visible
        return 1;
    });

    // Restaurar stroke-width solo para barras visibles
    svg1Container.selectAll(".barra").attr("stroke-width", function () {
        const fechaIndex = parseInt(d3.select(this).attr('data-fecha'));
        return fechaIndex <= vista1CurrentTimeIndex ? 4 : 0;
    });

    svg1Container.selectAll(".barra-tooltip").remove();
}

function handleMouseOverRNA(label, event, element) {
    svg1Container.selectAll(".barra, .rna").attr("opacity", 0.1);

    svg1Container.selectAll(`.rna[data-label='${label}']`)
        .attr("opacity", 1)
        .attr("stroke-width", 5);

    // NUEVO: Mostrar tooltips para todos los elementos RNA del mismo tipo
    svg1Container.selectAll(".corona-group").each(function (d) {
        const grupo = d3.select(this);
        const rna = grupo.select(`.rna[data-label='${label}']`);

        if (!rna.empty()) {
            const valor = parseFloat(rna.attr("data-valor"));
            const country = rna.attr("data-country");

            // Posicionar tooltip siempre arriba de la corona
            const radioCorona = d.radius;
            const tooltipX = -70;
            const tooltipY = -radioCorona - 30;

            const tooltip = grupo.append("g")
                .attr("class", "rna-tooltip")
                .attr("transform", `translate(${tooltipX}, ${tooltipY})`);

            tooltip.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 140)
                .attr("height", 55)
                .attr("fill", "rgba(0,0,0,0.9)")
                .attr("stroke", rna.attr("stroke"))
                .attr("stroke-width", 2)
                .attr("rx", 5);

            tooltip.append("text")
                .attr("x", 70)
                .attr("y", 15)
                .attr("text-anchor", "middle")
                .style("font-size", "10px")
                .style("font-weight", "bold")
                .style("fill", "white")
                .text(country.length > 12 ? country.substring(0, 10) + "..." : country);

            tooltip.append("text")
                .attr("x", 70)
                .attr("y", 30)
                .attr("text-anchor", "middle")
                .style("font-size", "8px")
                .style("fill", "#ddd")
                .text(label);

            const valorTexto = label === "Muertes cardiovasculares"
                ? `${valor.toFixed(0)}`
                : `${valor.toFixed(2)}%`;

            tooltip.append("text")
                .attr("x", 70)
                .attr("y", 45)
                .attr("text-anchor", "middle")
                .style("font-size", "9px")
                .style("fill", rna.attr("stroke"))
                .style("font-weight", "bold")
                .text(valorTexto);
        }
    });
}

function handleMouseOutRNA() {
    // Restaurar estado correcto considerando el período actual para las barras
    svg1Container.selectAll(".barra, .rna").attr("opacity", function () {
        const elemento = d3.select(this);

        // Para las barras, verificar si están dentro del período actual
        if (elemento.classed("barra")) {
            const fechaIndex = parseInt(elemento.attr('data-fecha'));
            return fechaIndex <= vista1CurrentTimeIndex ? 1 : 0;
        }

        // Para RNA, mantener siempre visible
        return 1;
    });

    svg1Container.selectAll(".rna").attr("stroke-width", 3);
    svg1Container.selectAll(".barra").attr("stroke-width", function () {
        const fechaIndex = parseInt(d3.select(this).attr('data-fecha'));
        return fechaIndex <= vista1CurrentTimeIndex ? 4 : 0;
    });
    svg1Container.selectAll(".rna-tooltip").remove();
}

// ========== FUNCIONES DE ANIMACIÓN CONTINUA MODIFICADAS ==========
// ========== 1. AGREGAR ESTAS VARIABLES AL INICIO (después de las variables existentes) ==========
// NUEVAS VARIABLES PARA MOVIMIENTO MEJORADO
let movementPaused = false;
let currentHoveredNode = null;

// ========== 2. REEMPLAZAR COMPLETAMENTE LA FUNCIÓN startFloatingAnimation() ==========
function startFloatingAnimation() {
    function animate() {
        if (!nodes1 || nodes1.length === 0) return;
        
        const time = Date.now() * 0.001; // Tiempo más suave
        
        nodes1.forEach((node, index) => {
            // Solo animar si no está siendo hovereada y no está fijada
            if (!node.isHovered && !node.fx && !node.fy && !movementPaused) {
                
                // MOVIMIENTO ORBITAL SUAVE - cada nodo tiene su propia órbita
                const orbitalSpeed = 0.3 + (index * 0.05); // Velocidades diferentes
                const orbitalRadius = 15 + (index % 3) * 8; // Radios orbitales variables
                const orbitalAngle = time * orbitalSpeed + (index * 0.8);
                
                // MOVIMIENTO SINUSOIDAL EN MÚLTIPLES CAPAS
                const waveX1 = Math.sin(time * 0.4 + index * 0.3) * 12;
                const waveY1 = Math.cos(time * 0.6 + index * 0.4) * 8;
                const waveX2 = Math.sin(time * 0.8 + index * 0.7) * 6;
                const waveY2 = Math.cos(time * 1.1 + index * 0.9) * 4;
                
                // DERIVA LENTA CONTINUA
                const driftX = Math.sin(time * 0.1 + index) * 0.8;
                const driftY = Math.cos(time * 0.15 + index * 1.2) * 0.6;
                
                // PULSO RADIAL SUTIL
                const pulse = Math.sin(time * 2 + index * 0.5) * 0.3;
                
                // COMBINAR TODOS LOS MOVIMIENTOS
                const totalMoveX = waveX1 + waveX2 + driftX + Math.cos(orbitalAngle) * orbitalRadius * 0.1;
                const totalMoveY = waveY1 + waveY2 + driftY + Math.sin(orbitalAngle) * orbitalRadius * 0.1 + pulse;
                
                // APLICAR MOVIMIENTO GRADUAL
                node.x += totalMoveX * 0.02;
                node.y += totalMoveY * 0.02;
                
                // VELOCIDAD ADICIONAL PARA SIMULACIÓN DE FÍSICA
                node.vx += Math.sin(time * 0.9 + index * 0.6) * 0.08;
                node.vy += Math.cos(time * 1.2 + index * 0.8) * 0.06;
                
                // CAMBIOS ALEATORIOS DE DIRECCIÓN MÁS FRECUENTES
                if (Math.random() < 0.008) { // Más frecuente que antes
                    node.targetVx = (Math.random() - 0.5) * 3; // Más intenso
                    node.targetVy = (Math.random() - 0.5) * 3;
                }
                
                // LIMITAR VELOCIDAD MÁXIMA PERO PERMITIR MÁS MOVIMIENTO
                const maxSpeed = 4; // Aumentado de 3 a 4
                const currentSpeed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
                if (currentSpeed > maxSpeed) {
                    node.vx = (node.vx / currentSpeed) * maxSpeed;
                    node.vy = (node.vy / currentSpeed) * maxSpeed;
                }
                
                // APLICAR FRICCIÓN MÁS SUAVE PARA MANTENER MOVIMIENTO
                node.vx *= 0.98; // Menos fricción que antes (era 0.95)
                node.vy *= 0.98;
                
                // IMPULSOS ALEATORIOS PERIÓDICOS PARA MANTENER ENERGÍA
                if (Math.random() < 0.005) {
                    const impulseAngle = Math.random() * Math.PI * 2;
                    const impulseStrength = 0.5 + Math.random() * 1;
                    node.vx += Math.cos(impulseAngle) * impulseStrength;
                    node.vy += Math.sin(impulseAngle) * impulseStrength;
                }
            }
        });
        
        animationId = requestAnimationFrame(animate);
    }
    animate();
}

// ========== 3. AGREGAR ESTAS DOS FUNCIONES NUEVAS ==========
function pauseMovementForNode(nodeId) {
    const node = nodes1.find(n => n.id === nodeId);
    if (node) {
        node.isHovered = true;
        currentHoveredNode = nodeId;
        // Detener gradualmente el movimiento
        node.vx *= 0.1;
        node.vy *= 0.1;
        node.fx = node.x; // Fijar posición
        node.fy = node.y;
    }
}

function resumeMovementForNode(nodeId) {
    const node = nodes1.find(n => n.id === nodeId);
    if (node && currentHoveredNode === nodeId) {
        node.isHovered = false;
        currentHoveredNode = null;
        node.fx = null; // Liberar posición fija
        node.fy = null;
        // Reanudar movimiento suave
        node.targetVx = (Math.random() - 0.5) * 2;
        node.targetVy = (Math.random() - 0.5) * 2;
        node.vx = node.targetVx * 0.3;
        node.vy = node.targetVy * 0.3;
    }
}

function stopFloatingAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

// ========== FUNCIÓN AUXILIAR PARA VERIFICAR VISIBILIDAD ==========
function isBarraVisible(fechaIndex) {
    return fechaIndex <= vista1CurrentTimeIndex;
}

// ========== NUEVA FUNCIÓN: CARGAR TODAS LAS BARRAS ==========
function cargarTodasLasBarras() {
    if (!svg1Container || !nodes1 || nodes1.length === 0) return;

    console.log("Cargando todas las barras de las coronas...");

    // Pausar animación temporal si está activa
    const wasPlaying = vista1IsPlaying;
    if (vista1IsPlaying) {
        pauseVista1TimeAnimation();
    }

    // Establecer el índice al máximo para mostrar todas las barras
    vista1CurrentTimeIndex = vista1MaxTimeIndex;

    // Mostrar todas las barras con animación escalonada
    svg1Container.selectAll(".corona-group").each(function (nodeData, coronaIndex) {
        const grupo = d3.select(this);
        const coronaContent = grupo.select('.corona-content');

        coronaContent.selectAll('.barra').each(function (d, barraIndex) {
            const barra = d3.select(this);
            const fechaIndex = parseInt(barra.attr('data-fecha'));

            // Animación escalonada para efecto visual atractivo
            const delay = (coronaIndex * 100) + (barraIndex * 20);

            setTimeout(() => {
                barra
                    .classed('barra-animada', true)
                    .transition()
                    .duration(400)
                    .ease(d3.easeElasticOut.amplitude(1).period(0.5))
                    .attr('opacity', 1)
                    .attr('stroke-width', 4);
            }, delay);
        });
    });

    // Actualizar display de fecha al período final
    updateVista1DateDisplay(vista1MaxTimeIndex);

    // Mensaje de confirmación temporal
    mostrarMensajeConfirmacion("¡Todas las barras cargadas completamente!", "#4CAF50");

    console.log(`Todas las barras cargadas. Período final: ${vista1MaxTimeIndex}`);
}

// ========== FUNCIÓN AUXILIAR: MOSTRAR MENSAJE DE CONFIRMACIÓN ==========
function mostrarMensajeConfirmacion(mensaje, color = "#4CAF50") {
    const svg1 = d3.select("#svg1");
    const width = parseInt(svg1.style("width"));

    // Crear mensaje temporal
    const mensajeGroup = svg1.append("g")
        .attr("class", "mensaje-confirmacion")
        .attr("transform", `translate(${width / 2}, 60)`);

    const fondo = mensajeGroup.append("rect")
        .attr("x", -100)
        .attr("y", -15)
        .attr("width", 200)
        .attr("height", 30)
        .attr("fill", color)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)
        .attr("rx", 15)
        .attr("opacity", 0);

    const texto = mensajeGroup.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "white")
        .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.8)")
        .text(mensaje)
        .attr("opacity", 0);

    // Animación de aparición
    fondo.transition()
        .duration(300)
        .attr("opacity", 0.9);

    texto.transition()
        .duration(300)
        .attr("opacity", 1);

    // Animación de desaparición después de 3 segundos
    setTimeout(() => {
        mensajeGroup.transition()
            .duration(500)
            .attr("opacity", 0)
            .remove();
    }, 3000);
}