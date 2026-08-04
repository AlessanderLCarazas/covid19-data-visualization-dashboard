// Vista 3; ADAPTADO PARA CONTROLES GLOBALES, ANIMACIÓN CADA 2 SEMANAS CON RANKING LATERAL Y ZOOM/ARRASTRE
function createColorLegend(svg, width, height, colorScale, maxValue, mapWidth) {
    const legendWidth = 25;
    const legendHeight = 200;
    const legendGroup = svg.append("g")
        .attr("class", "color-legend-fixed")
        .attr("transform", `translate(${mapWidth - 50}, ${height / 2 - legendHeight / 2})`);

    const defs = svg.select("defs").empty() ? svg.append("defs") : svg.select("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "map-legend-gradient")
        .attr("x1", "0%")
        .attr("x2", "0%")
        .attr("y1", "100%")
        .attr("y2", "0%");

    const numStops = 10;
    for (let i = 0; i <= numStops; i++) {
        const offset = (i / numStops) * 100;
        const value = (i / numStops) * maxValue;
        gradient.append("stop")
            .attr("offset", `${offset}%`)
            .attr("stop-color", colorScale(value));
    }

    legendGroup.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#map-legend-gradient)")
        .attr("stroke", "#999");

    legendGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -legendHeight / 2)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#333")
        .style("font-weight", "bold")
        .text("Casos por millón");

    legendGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -legendHeight / 2)
        .attr("y", -15)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#333")
        .style("font-weight", "bold")
        .text("de habitantes");

    const numLabels = 5;
    for (let i = 0; i <= numLabels; i++) {
        const y = legendHeight - (i / numLabels) * legendHeight;
        const value = (i / numLabels) * maxValue;

        legendGroup.append("text")
            .attr("x", legendWidth + 5)
            .attr("y", y + 3)
            .style("font-size", "10px")
            .style("fill", "#666")
            .text(formatNumber(value));

        legendGroup.append("line")
            .attr("x1", legendWidth)
            .attr("x2", legendWidth + 3)
            .attr("y1", y)
            .attr("y2", y)
            .attr("stroke", "#666")
            .attr("stroke-width", 1);
    }
}

function createRankingPanel(svg, width, height) {
    const rankingWidth = 280;
    const rankingHeight = height - 100;

    const rankingPanel = svg.append("g")
        .attr("class", "ranking-panel-fixed")
        .attr("transform", `translate(10, 80)`);

    rankingPanel.append("rect")
        .attr("width", rankingWidth)
        .attr("height", rankingHeight)
        .attr("fill", "#f8f9fa")
        .attr("stroke", "#dee2e6")
        .attr("stroke-width", 1)
        .attr("rx", 8);

    rankingPanel.append("text")
        .attr("class", "ranking-title")
        .attr("x", rankingWidth / 2)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text("Top 10 Países");

    rankingPanel.append("text")
        .attr("class", "ranking-date")
        .attr("x", rankingWidth / 2)
        .attr("y", 45)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#666")
        .text("Mapa Mundial - COVID-19");

    const rankingContainer = rankingPanel.append("g")
        .attr("class", "ranking-container")
        .attr("transform", "translate(10, 60)");

    return { rankingPanel, rankingContainer };
}

let vista3AnimationInterval = null;
let vista3MapData = null;
let worldData = null;
let projection = null;
let path = null;
let rankingWindow = null;
let vista3AnimationSpeed = 1000;
let vista3IsPlaying = false;
let vista3CurrentDateIndex = 0;
let vista3AllDates = [];
let vista3CountryData = {};
let vista3Countries = null;
let vista3ColorScale = null;
let vista3DateDisplay = null;
let vista3CurrentContinent = 'World';
let vista3RankingContainer = null;
let vista3ZoomBehavior = null;
let vista3MapContainer = null;
let vista3IsInteracting = false;
let vista3Initialized = false;

const continentBounds = {
    "World": [[-180, -60], [180, 85]],
    "Europe": [[-15, 35], [40, 70]],
    "Asia": [[60, 5], [150, 55]],
    "Africa": [[-20, -35], [55, 40]],
    "North America": [[-170, 15], [-50, 75]],
    "South America": [[-85, -60], [-30, 15]],
    "Oceania": [[110, -50], [180, -5]]
};

function getBiweeklyDates(allDates) {
    if (!allDates || allDates.length === 0) return [];
    const biweeklyDates = [];
    const inicio = new Date("2020-01-01");
    const endDate = new Date(allDates[allDates.length - 1]);
    let timeIndex = 0;
    let currentDate = new Date(inicio);

    while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        const closestDate = findClosestDate(dateString, allDates);
        if (closestDate && !biweeklyDates.includes(closestDate)) {
            biweeklyDates.push(closestDate);
        }
        timeIndex++;
        currentDate = new Date(inicio.getTime() + timeIndex * 15 * 24 * 60 * 60 * 1000);
    }
    return biweeklyDates.sort();
}

function findClosestDate(targetDate, availableDates) {
    const target = new Date(targetDate);
    let closestDate = null;
    let minDiff = Infinity;

    for (const date of availableDates) {
        const current = new Date(date);
        const diff = Math.abs(current - target);
        if (diff < minDiff) {
            minDiff = diff;
            closestDate = date;
        }
    }
    return closestDate;
}

function getDateRangeFromIndex(timeIndex) {
    const inicio = new Date("2020-01-01");
    const fechaActual = new Date(inicio.getTime() + timeIndex * 15 * 24 * 60 * 60 * 1000);
    const fechaFin = new Date(fechaActual.getTime() + 14 * 24 * 60 * 60 * 1000);
    const formatoFecha = d3.timeFormat("%d/%m/%Y");
    return `${formatoFecha(fechaActual)} - ${formatoFecha(fechaFin)}`;
}

function getTimeIndexFromDate(dateString) {
    const inicio = new Date("2020-01-01");
    const targetDate = new Date(dateString);
    const diffInMs = targetDate.getTime() - inicio.getTime();
    const diffInDays = Math.floor(diffInMs / (24 * 60 * 60 * 1000));
    return Math.floor(diffInDays / 15);
}

window.startTimeAnimation = function () {
    if (vista3AllDates.length === 0) return;
    vista3IsPlaying = true;
    vista3AnimationInterval = setInterval(() => {
        vista3CurrentDateIndex++;
        if (vista3CurrentDateIndex >= vista3AllDates.length) {
            vista3CurrentDateIndex = 0;
        }
        updateVista3Map(vista3AllDates[vista3CurrentDateIndex]);
        const currentDateSpan = document.getElementById('currentDate');
        if (currentDateSpan) {
            const timeIndex = getTimeIndexFromDate(vista3AllDates[vista3CurrentDateIndex]);
            const rangoTexto = getDateRangeFromIndex(timeIndex);
        }
    }, vista3AnimationSpeed);
};

window.pauseTimeAnimation = function () {
    vista3IsPlaying = false;
    if (vista3AnimationInterval) {
        clearInterval(vista3AnimationInterval);
        vista3AnimationInterval = null;
    }
};

window.updateAnimationSpeed = function (newSpeed) {
    vista3AnimationSpeed = newSpeed;
    if (vista3IsPlaying) {
        pauseTimeAnimation();
        startTimeAnimation();
    }
};

function initVista3() {
    const svg3 = d3.select("#svg3");
    const width = parseInt(svg3.style("width"));
    const height = parseInt(svg3.style("height"));
    svg3.selectAll("*").remove();

    const loadingText = svg3.append("text")
        .attr("class", "loading-text-fixed")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "#666")
        .text("Cargando mapa geográfico...");

    loadWorldMap().then(() => {
        createWorldMapView();
        vista3Initialized = true;
        console.log("Vista 3 inicializada - Mapa mundial cargado");
    }).catch(error => {
        loadingText.text("Error cargando el mapa geográfico");
        console.error("Error cargando mapa:", error);
    });
}

function createWorldMapView() {
    const svg3 = d3.select("#svg3");
    const width = parseInt(svg3.style("width"));
    const height = parseInt(svg3.style("height"));
    svg3.selectAll("*").remove();

    if (!worldData) {
        svg3.append("text")
            .attr("class", "error-text-fixed")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("fill", "#666")
            .text("Mapa no disponible");
        return;
    }

    const rankingData = createRankingPanel(svg3, width, height);
    vista3RankingContainer = rankingData.rankingContainer;

    const rankingWidth = 300;
    const margin = { top: 80, right: 50, bottom: 60, left: rankingWidth + 20 };
    const mapWidth = width - margin.left - margin.right;
    const mapHeight = height - margin.top - margin.bottom;

    setupProjection('World', mapWidth, mapHeight);

    vista3MapContainer = svg3.append("g")
        .attr("class", "map-zoom-container")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    vista3ZoomBehavior = d3.zoom()
        .scaleExtent([0.5, 8])
        .on("start", function () {
            vista3IsInteracting = true;
            svg3.style("cursor", "grabbing");
        })
        .on("zoom", function (event) {
            vista3MapContainer.attr("transform", `translate(${margin.left}, ${margin.top}) ${event.transform}`);
        })
        .on("end", function () {
            vista3IsInteracting = false;
            svg3.style("cursor", "default");
        });

    svg3.call(vista3ZoomBehavior);

    const titleText = svg3.append("text")
        .attr("class", "title-fixed")
        .attr("x", (margin.left + mapWidth / 2))
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text("Mapa Mundial COVID-19");

    const subtitleText = svg3.append("text")
        .attr("class", "subtitle-fixed")
        .attr("x", (margin.left + mapWidth / 2))
        .attr("y", 55)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#666")
        .text("Haga click en un continente para ver la evolución detallada");

    const worldCountries = vista3MapContainer.selectAll(".world-country")
        .data(worldData.features)
        .enter()
        .append("path")
        .attr("class", "world-country")
        .attr("d", path)
        .attr("fill", "#e8f4f8")
        .attr("stroke", "#2c3e50")
        .attr("stroke-width", 0.8)
        .style("cursor", "pointer");

    addContinentBorders();

    worldCountries
        .on("mouseover", function (event, d) {
            if (!vista3IsInteracting) {
                d3.select(this)
                    .attr("fill", "#74b9ff")
                    .attr("stroke", "#0984e3")
                    .attr("stroke-width", 2);
                showBasicTooltip(event, d.properties.NAME || d.properties.name || "País desconocido");
            }
        })
        .on("mouseout", function (event, d) {
            if (!vista3IsInteracting) {
                d3.select(this)
                    .attr("fill", "#e8f4f8")
                    .attr("stroke", "#2c3e50")
                    .attr("stroke-width", 0.8);
                d3.select("#map-tooltip").remove();
            }
        })
        .on("mousemove", function (event) {
            if (!vista3IsInteracting) {
                const tooltip = d3.select("#map-tooltip");
                if (!tooltip.empty()) {
                    tooltip
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                }
            }
        });

    console.log("Vista mundial creada con bordes de continentes y hover por continente");
}

function selectContinentFromMap(continent) {
    console.log(`Seleccionando continente desde mapa: ${continent}`);
    if (typeof window.getAvailableContinents === 'function') {
        const availableContinents = window.getAvailableContinents();
        if (!availableContinents.includes(continent)) {
            console.warn(`Continente ${continent} no disponible en los datos`);
            showContinentNotAvailableMessage(continent);
            return;
        }
    }
    if (typeof window.updateContinentFromView === 'function') {
        window.updateContinentFromView(continent);
    } else {
        console.error('Función updateContinentFromView no disponible');
    }
    createResetButton();
}

function createResetButton() {
    const svg3 = d3.select("#svg3");
    if (svg3.select("#resetButton").empty()) {
        const resetButton = svg3.append("g")
            .attr("id", "resetButton")
            .attr("transform", `translate(20, 20)`)
            .style("cursor", "pointer");
        resetButton.append("rect")
            .attr("width", 100)
            .attr("height", 30)
            .attr("rx", 5)
            .attr("ry", 5)
            .attr("fill", "red");
        resetButton.append("text")
            .attr("x", 50)
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text("Restablecer");
        resetButton.on("click", function () {
            location.reload();
        });
    }
}

function showContinentNotAvailableMessage(continent) {
    const notification = d3.select("body").append("div")
        .style("position", "fixed")
        .style("top", "20px")
        .style("right", "20px")
        .style("background", "#ff6b6b")
        .style("color", "white")
        .style("padding", "15px 20px")
        .style("border-radius", "8px")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("z-index", "10001")
        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
        .style("opacity", 0)
        .text(`${continent}: No hay datos disponibles para este continente`);

    notification.transition()
        .duration(300)
        .style("opacity", 1);

    setTimeout(() => {
        notification.transition()
            .duration(300)
            .style("opacity", 0)
            .remove();
    }, 3000);
}

function syncViewWithHTMLSelection() {
    if (typeof window.getCurrentContinent === 'function') {
        const currentHTMLContinent = window.getCurrentContinent();
        if (currentHTMLContinent && currentHTMLContinent !== vista3CurrentContinent) {
            console.log(`Sincronizando vista3 con HTML: ${currentHTMLContinent}`);
        }
    }
}

function getContinentInfo(continent) {
    const info = {
        "Europe": {
            name: "Europa",
            description: "Continente con alta densidad poblacional y sistemas de salud desarrollados",
            countries: continentCountriesMap["Europe"]?.length || 0
        },
        "Asia": {
            name: "Asia",
            description: "El continente más poblado del mundo con gran diversidad",
            countries: continentCountriesMap["Asia"]?.length || 0
        },
        "Africa": {
            name: "África",
            description: "Continente con sistemas de salud en desarrollo",
            countries: continentCountriesMap["Africa"]?.length || 0
        },
        "North America": {
            name: "América del Norte",
            description: "Incluye Estados Unidos, Canadá y México",
            countries: continentCountriesMap["North America"]?.length || 0
        },
        "South America": {
            name: "América del Sur",
            description: "Continente con economías emergentes",
            countries: continentCountriesMap["South America"]?.length || 0
        },
        "Oceania": {
            name: "Oceanía",
            description: "Continente insular con Australia y Nueva Zelanda",
            countries: continentCountriesMap["Oceania"]?.length || 0
        }
    };

    return info[continent] || {
        name: continent,
        description: "Información no disponible",
        countries: 0
    };
}

let continentCountriesMap = {};

function addContinentBorders() {
    continentCountriesMap = {
        "Asia": ['Afghanistan', 'Armenia', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Bhutan', 'Brunei', 'Cambodia', 'China', 'East Timor', 'Georgia', 'Hong Kong', 'India', 'Indonesia', 'Iran', 'Iraq', 'Israel', 'Japan', 'Jordan', 'Kazakhstan', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Lebanon', 'Macao', 'Malaysia', 'Maldives', 'Mongolia', 'Myanmar', 'Nepal', 'North Korea', 'Northern Cyprus', 'Oman', 'Pakistan', 'Palestine', 'Philippines', 'Qatar', 'Saudi Arabia', 'Singapore', 'South Korea', 'Sri Lanka', 'Syria', 'Taiwan', 'Tajikistan', 'Thailand', 'Turkey', 'Turkmenistan', 'United Arab Emirates', 'Uzbekistan', 'Vietnam', 'Yemen'],
        "Europe": ['Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Denmark', 'England', 'Estonia', 'Faroe Islands', 'Finland', 'France', 'Germany', 'Gibraltar', 'Greece', 'Guernsey', 'Hungary', 'Iceland', 'Ireland', 'Isle of Man', 'Italy', 'Jersey', 'Kosovo', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia', 'Northern Ireland', 'Norway', 'Poland', 'Portugal', 'Romania', 'Russia', 'San Marino', 'Scotland', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Ukraine', 'United Kingdom', 'Vatican', 'Wales'],
        "Africa": ['Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde', 'Central African Republic', 'Chad', 'Comoros', 'Congo', "Cote d'Ivoire", 'Democratic Republic of Congo', 'Djibouti', 'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius', 'Mayotte', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Reunion', 'Rwanda', 'Saint Helena', 'Sao Tome and Principe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Western Sahara', 'Zambia', 'Zimbabwe'],
        "Oceania": ['American Samoa', 'Australia', 'Cook Islands', 'Fiji', 'French Polynesia', 'Guam', 'Kiribati', 'Marshall Islands', 'Micronesia (country)', 'Nauru', 'New Caledonia', 'New Zealand', 'Niue', 'Northern Mariana Islands', 'Palau', 'Papua New Guinea', 'Pitcairn', 'Samoa', 'Solomon Islands', 'Tokelau', 'Tonga', 'Tuvalu', 'Vanuatu', 'Wallis and Futuna'],
        "North America": ['Anguilla', 'Antigua and Barbuda', 'Aruba', 'Bahamas', 'Barbados', 'Belize', 'Bermuda', 'Bonaire Sint Eustatius and Saba', 'British Virgin Islands', 'Canada', 'Cayman Islands', 'Costa Rica', 'Cuba', 'Curacao', 'Dominica', 'Dominican Republic', 'El Salvador', 'Greenland', 'Grenada', 'Guadeloupe', 'Guatemala', 'Haiti', 'Honduras', 'Jamaica', 'Martinique', 'Mexico', 'Montserrat', 'Nicaragua', 'Panama', 'Puerto Rico', 'Saint Barthelemy', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Martin (French part)', 'Saint Pierre and Miquelon', 'Saint Vincent and the Grenadines', 'Sint Maarten (Dutch part)', 'Trinidad and Tobago', 'Turks and Caicos Islands', 'United States', 'United States Virgin Islands'],
        "South America": ['Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Falkland Islands', 'French Guiana', 'Guyana', 'Paraguay', 'Peru', 'Suriname', 'Uruguay', 'Venezuela'],
    };

    const continentColors = {
        "Europe": "#ff7675",
        "Asia": "#74b9ff",
        "Africa": "#55a3ff",
        "North America": "#00b894",
        "South America": "#fdcb6e",
        "Oceania": "#fd79a8"
    };

    Object.entries(continentCountriesMap).forEach(([continent, countries]) => {
        const continentGroup = vista3MapContainer.append("g")
            .attr("class", `continent-border continent-${continent.replace(/\s+/g, '-').toLowerCase()}`)
            .style("cursor", "pointer");

        const continentPaths = continentGroup.selectAll(".continent-outline")
            .data(worldData.features.filter(d => {
                const countryName = d.properties.NAME || d.properties.name || d.properties.NAME_EN;
                return countries.some(c => matchCountryNames(countryName, c));
            }))
            .enter()
            .append("path")
            .attr("class", "continent-outline")
            .attr("d", path)
            .attr("fill", "rgba(0,0,0,0.01)")
            .attr("stroke", continentColors[continent])
            .attr("stroke-width", 2)
            .attr("stroke-opacity", 0.4)
            .attr("stroke-dasharray", "5,5")
            .style("filter", "drop-shadow(0px 0px 2px rgba(0,0,0,0.2))")
            .style("pointer-events", "all");

        continentPaths
            .on("mouseover", function (event, d) {
                if (!vista3IsInteracting) {
                    highlightContinent(continent, true);
                    showContinentTooltip(event, continent);
                }
            })
            .on("mouseout", function (event, d) {
                if (!vista3IsInteracting) {
                    highlightContinent(continent, false);
                    d3.select("#continent-tooltip").remove();
                }
            })
            .on("mousemove", function (event) {
                const tooltip = d3.select("#continent-tooltip");
                if (!tooltip.empty()) {
                    tooltip
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                }
            })
            .on("click", function (event, d) {
                if (!vista3IsInteracting) {
                    event.stopPropagation();
                    console.log(`Continente ${continent} seleccionado desde mapa`);
                    selectContinentFromMap(continent);
                    highlightContinent(continent, true);
                    setTimeout(() => {
                        highlightContinent(continent, false);
                        d3.select("#continent-tooltip").remove();
                    }, 1000);
                }
            });
    });

    addContinentLegend(continentColors);
}

function highlightContinent(continent, highlight) {
    const countries = continentCountriesMap[continent];
    if (!countries) return;

    const continentColors = {
        "Europe": "#ff7675",
        "Asia": "#74b9ff",
        "Africa": "#55a3ff",
        "North America": "#00b894",
        "South America": "#fdcb6e",
        "Oceania": "#fd79a8"
    };

    vista3MapContainer.selectAll(".world-country")
        .each(function (d) {
            const countryName = d.properties.NAME || d.properties.name || d.properties.NAME_EN;
            const isInContinent = countries.some(c => matchCountryNames(countryName, c));

            if (isInContinent) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("fill", highlight ? continentColors[continent] : "#e8f4f8")
                    .attr("stroke", highlight ? "#2c3e50" : "#2c3e50")
                    .attr("stroke-width", highlight ? 2 : 0.8)
                    .style("opacity", highlight ? 0.9 : 1);
            } else if (highlight) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style("opacity", 0.3);
            } else {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style("opacity", 1);
            }
        });

    const continentClass = continent.replace(/\s+/g, '-').toLowerCase();
    vista3MapContainer.select(`.continent-${continentClass} .continent-outline`)
        .transition()
        .duration(200)
        .attr("stroke-width", highlight ? 4 : 2)
        .attr("stroke-opacity", highlight ? 0.9 : 0.4);
}

function showContinentTooltip(event, continent) {
    d3.select("#continent-tooltip").remove();

    const countryCount = continentCountriesMap[continent] ? continentCountriesMap[continent].length : 0;

    const tooltip = d3.select("body").append("div")
        .attr("id", "continent-tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0,0,0,0.85)")
        .style("color", "white")
        .style("padding", "10px 15px")
        .style("border-radius", "8px")
        .style("font-size", "13px")
        .style("pointer-events", "none")
        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
        .style("z-index", "10000")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");

    tooltip.append("div")
        .style("font-weight", "bold")
        .style("font-size", "15px")
        .style("margin-bottom", "5px")
        .text(continent);

    tooltip.append("div")
        .style("font-size", "11px")
        .style("color", "#ccc")
        .text(`${countryCount} países resaltados`);

    tooltip.append("div")
        .style("font-size", "10px")
        .style("color", "#4CAF50")
        .style("margin-top", "5px")
        .style("border-top", "1px solid #555")
        .style("padding-top", "5px")
        .text("🖱️ Click para seleccionar este continente");
}

function addContinentLegend(continentColors) {
    const svg3 = d3.select("#svg3");
    const width = parseInt(svg3.style("width"));

    const legendGroup = svg3.append("g")
        .attr("class", "continent-legend-fixed")
        .attr("transform", `translate(${width - 200}, 100)`);

    legendGroup.append("rect")
        .attr("width", 180)
        .attr("height", 200)
        .attr("fill", "rgba(255,255,255,0.9)")
        .attr("stroke", "#ddd")
        .attr("stroke-width", 1)
        .attr("rx", 8);

    legendGroup.append("text")
        .attr("x", 90)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text("Continentes");

    Object.entries(continentColors).forEach(([continent, color], i) => {
        const legendItem = legendGroup.append("g")
            .attr("transform", `translate(10, ${35 + i * 25})`);

        legendItem.append("line")
            .attr("x1", 0)
            .attr("x2", 20)
            .attr("y1", 0)
            .attr("y2", 0)
            .attr("stroke", color)
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", "5,5");

        legendItem.append("text")
            .attr("x", 25)
            .attr("y", 4)
            .style("font-size", "12px")
            .style("fill", "#333")
            .text(continent);
    });
}

function animateToContinent(continent) {
    if (!vista3MapContainer || !vista3ZoomBehavior) return;

    const svg3 = d3.select("#svg3");
    const bounds = continentBounds[continent];

    if (!bounds) {
        console.warn(`Límites no definidos para el continente: ${continent}`);
        return;
    }

    const [[x0, y0], [x1, y1]] = bounds;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const x = (x0 + x1) / 2;
    const y = (y0 + y1) / 2;

    const mapRect = vista3MapContainer.node().getBoundingClientRect();
    const width = mapRect.width || 600;
    const height = mapRect.height || 400;

    const scale = continent === 'World' ? 1 : Math.min(8, 0.9 / Math.max(dx / width, dy / height));

    const translate = [width / 2 - scale * projection([x, y])[0], height / 2 - scale * projection([x, y])[1]];

    const transform = d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale);

    svg3.transition()
        .duration(1500)
        .ease(d3.easeCubicInOut)
        .call(vista3ZoomBehavior.transform, transform);

    console.log(`Animando zoom hacia: ${continent}`);
}

function showBasicTooltip(event, countryName) {
    d3.select("#map-tooltip").remove();

    const tooltip = d3.select("body").append("div")
        .attr("id", "map-tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0,0,0,0.8)")
        .style("color", "white")
        .style("padding", "8px 12px")
        .style("border-radius", "6px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("box-shadow", "0 2px 8px rgba(0,0,0,0.3)")
        .style("z-index", "10000")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px")
        .text(countryName);
}

async function loadWorldMap() {
    try {
        const urls = [
            'https://raw.githubusercontent.com/topojson/world-atlas/master/countries-110m.json',
            'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
            'https://unpkg.com/world-atlas@2/countries-110m.json'
        ];

        let world = null;
        for (const url of urls) {
            try {
                console.log(`Intentando cargar mapa desde: ${url}`);
                const response = await fetch(url);
                if (response.ok) {
                    world = await response.json();
                    console.log("Datos del mapa mundial cargados exitosamente desde:", url);
                    break;
                }
            } catch (e) {
                console.warn(`Falló carga desde ${url}:`, e.message);
            }
        }

        if (world && world.objects && world.objects.countries) {
            worldData = topojson.feature(world, world.objects.countries);
        } else {
            throw new Error('No se pudo obtener datos válidos del mapa');
        }
    } catch (error) {
        console.warn("No se pudo cargar el mapa desde CDN, usando mapa simplificado");
        worldData = createFallbackMap();
    }
}

function createFallbackMap() {
    const countries = {
        "Spain": [[-10, 36], [-10, 44], [4, 44], [4, 36]],
        "France": [[-5, 42], [-5, 51], [8, 51], [8, 42]],
        "Germany": [[6, 47], [6, 55], [15, 55], [15, 47]],
        "Italy": [[6, 36], [6, 47], [19, 47], [19, 36]],
        "United Kingdom": [[-8, 50], [-8, 60], [2, 60], [2, 50]],
        "Poland": [[14, 49], [14, 55], [24, 55], [24, 49]],
        "Netherlands": [[3, 50], [3, 54], [7, 54], [7, 50]],
        "Belgium": [[2, 49], [2, 52], [6, 52], [6, 49]],
        "Portugal": [[-10, 36], [-10, 42], [-6, 42], [-6, 36]],
        "Greece": [[19, 34], [19, 42], [29, 42], [29, 34]],
        "Austria": [[9, 46], [9, 49], [17, 49], [17, 46]],
        "Switzerland": [[5, 45], [5, 48], [11, 48], [11, 45]],
        "Czech Republic": [[12, 48], [12, 51], [19, 51], [19, 48]],
        "Hungary": [[16, 45], [16, 49], [23, 49], [23, 45]],
        "Romania": [[20, 43], [20, 48], [30, 48], [30, 43]],
        "Bulgaria": [[22, 41], [22, 44], [29, 44], [29, 41]],
        "Croatia": [[13, 42], [13, 47], [19, 47], [19, 42]],
        "Serbia": [[19, 42], [19, 46], [23, 46], [23, 42]],
        "Bosnia and Herzegovina": [[15, 42], [15, 45], [20, 45], [20, 42]],
        "Slovakia": [[16, 47], [16, 50], [22, 50], [22, 47]],
        "Slovenia": [[13, 45], [13, 47], [17, 47], [17, 45]],
        "Denmark": [[8, 54], [8, 58], [15, 58], [15, 54]],
        "Sweden": [[11, 55], [11, 69], [24, 69], [24, 55]],
        "Norway": [[4, 58], [4, 71], [31, 71], [31, 58]],
        "Finland": [[20, 59], [20, 70], [32, 70], [32, 59]],
        "Ireland": [[-11, 51], [-11, 56], [-5, 56], [-5, 51]],
        "Iceland": [[-25, 63], [-25, 67], [-13, 67], [-13, 63]],
        "Lithuania": [[20, 53], [20, 57], [27, 57], [27, 53]],
        "Latvia": [[20, 55], [20, 59], [28, 59], [28, 55]],
        "Estonia": [[21, 57], [21, 60], [28, 60], [28, 57]],
        "Belarus": [[23, 51], [23, 57], [33, 57], [33, 51]],
        "Ukraine": [[22, 44], [22, 53], [40, 53], [40, 44]],
        "Moldova": [[26, 45], [26, 49], [30, 49], [30, 45]],
        "Albania": [[19, 39], [19, 43], [21, 43], [21, 39]],
        "North Macedonia": [[20, 40], [20, 43], [23, 43], [23, 40]],
        "Montenegro": [[18, 41], [18, 44], [20, 44], [20, 41]],
        "Luxembourg": [[5, 49], [5, 51], [7, 51], [7, 49]],
        "Malta": [[14, 35], [14, 36], [15, 36], [15, 35]],
        "Cyprus": [[32, 34], [32, 36], [34, 36], [34, 34]],
        "Russia": [[19, 41], [19, 82], [180, 82], [180, 41]],
        "China": [[73, 15], [73, 53], [135, 53], [135, 15]],
        "India": [[68, 6], [68, 37], [97, 37], [97, 6]],
        "Japan": [[129, 30], [129, 46], [146, 46], [146, 30]],
        "South Korea": [[124, 33], [124, 39], [132, 39], [132, 33]],
        "Iran": [[44, 25], [44, 40], [63, 40], [63, 25]],
        "Turkey": [[26, 36], [26, 42], [45, 42], [45, 36]],
        "Indonesia": [[95, -11], [95, 6], [141, 6], [141, -11]],
        "Thailand": [[97, 5], [97, 21], [106, 21], [106, 5]],
        "Vietnam": [[102, 8], [102, 24], [110, 24], [110, 8]],
        "Philippines": [[116, 4], [116, 21], [127, 21], [127, 4]],
        "Malaysia": [[99, 0], [99, 7], [120, 7], [120, 0]],
        "Singapore": [[103, 1], [103, 2], [104, 2], [104, 1]],
        "Bangladesh": [[88, 20], [88, 27], [93, 27], [93, 20]],
        "Pakistan": [[60, 23], [60, 37], [77, 37], [77, 23]],
        "United States": [[-125, 25], [-125, 49], [-66, 49], [-66, 25]],
        "Canada": [[-141, 42], [-141, 84], [-52, 84], [-52, 42]],
        "Mexico": [[-118, 14], [-118, 33], [-86, 33], [-86, 14]],
        "Brazil": [[-74, -34], [-74, 5], [-34, 5], [-34, -34]],
        "Argentina": [[-74, -55], [-74, -21], [-53, -21], [-53, -55]],
        "Chile": [[-76, -56], [-76, -17], [-66, -17], [-66, -56]],
        "Colombia": [[-79, -4], [-79, 13], [-66, 13], [-66, -4]],
        "Peru": [[-82, -19], [-82, 0], [-68, 0], [-68, -19]],
        "Venezuela": [[-73, 0], [-73, 12], [-59, 12], [-59, 0]],
        "South Africa": [[16, -35], [16, -22], [33, -22], [33, -35]],
        "Egypt": [[24, 22], [24, 32], [37, 32], [37, 22]],
        "Nigeria": [[2, 4], [2, 14], [15, 14], [15, 4]],
        "Kenya": [[33, -5], [33, 5], [42, 5], [42, -5]],
        "Morocco": [[-13, 28], [-13, 36], [-1, 36], [-1, 28]],
        "Algeria": [[-9, 19], [-9, 37], [12, 37], [12, 19]],
        "Australia": [[113, -44], [113, -10], [154, -10], [154, -44]],
        "New Zealand": [[166, -47], [166, -34], [179, -34], [179, -47]]
    };

    const features = Object.entries(countries).map(([name, bounds]) => ({
        type: "Feature",
        properties: { NAME: name, name: name, NAME_EN: name },
        geometry: {
            type: "Polygon",
            coordinates: [[
                [bounds[0][0], bounds[0][1]],
                [bounds[0][0], bounds[1][1]],
                [bounds[1][0], bounds[1][1]],
                [bounds[1][0], bounds[0][1]],
                [bounds[0][0], bounds[0][1]]
            ]]
        }
    }));

    return {
        type: "FeatureCollection",
        features: features
    };
}

function updateVista3(data, continent) {
    if (vista3AnimationInterval) {
        clearInterval(vista3AnimationInterval);
        vista3AnimationInterval = null;
    }
    vista3IsPlaying = false;

    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    if (playBtn && pauseBtn) {
        playBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
    }

    const svg3 = d3.select("#svg3");
    const width = parseInt(svg3.style("width"));
    const height = parseInt(svg3.style("height"));

    if (!data || data.length === 0 || !worldData) {
        svg3.selectAll("*").remove();
        svg3.append("text")
            .attr("class", "error-text-fixed")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("fill", "#666")
            .text("No hay datos para mostrar o mapa no disponible");
        return;
    }

    console.log(`Transicionando de vista mundial a continental: ${continent}`);
    svg3.selectAll("*").remove();

    vista3MapData = data;
    vista3CurrentContinent = continent;

    vista3CountryData = {};
    data.forEach(d => {
        const country = d.location;
        const date = d.date;
        const cases = parseFloat(d.total_cases) || 0;
        const deaths = parseFloat(d.total_deaths) || 0;
        const population = parseFloat(d.population) || 1;

        if (!vista3CountryData[country]) {
            vista3CountryData[country] = {};
        }

        vista3CountryData[country][date] = {
            cases: cases,
            deaths: deaths,
            population: population,
            casesPerMillion: (cases / population) * 1000000
        };
    });

    const allDatesOriginal = [...new Set(data.map(d => d.date))].sort();
    vista3AllDates = getBiweeklyDates(allDatesOriginal);
    vista3CurrentDateIndex = 0;

    if (vista3AllDates.length === 0) {
        console.warn("No hay datos temporales válidos");
        return;
    }

    createContinentalView(continent, width, height);
}

function createContinentalView(continent, width, height) {
    const svg3 = d3.select("#svg3");
    const rankingData = createRankingPanel(svg3, width, height);
    vista3RankingContainer = rankingData.rankingContainer;

    const rankingWidth = 300;
    const margin = { top: 80, right: 50, bottom: 60, left: rankingWidth + 20 };
    const mapWidth = width - margin.left - margin.right;
    const mapHeight = height - margin.top - margin.bottom;

    setupProjection(continent, mapWidth, mapHeight);

    vista3MapContainer = svg3.append("g")
        .attr("class", "map-zoom-container")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    vista3ZoomBehavior = d3.zoom()
        .scaleExtent([0.5, 8])
        .on("start", function () {
            vista3IsInteracting = true;
            svg3.style("cursor", "grabbing");
        })
        .on("zoom", function (event) {
            vista3MapContainer.attr("transform", `translate(${margin.left}, ${margin.top}) ${event.transform}`);
        })
        .on("end", function () {
            vista3IsInteracting = false;
            svg3.style("cursor", "default");
        });

    svg3.call(vista3ZoomBehavior);

    const titleText = svg3.append("text")
        .attr("class", "title-fixed")
        .attr("x", (margin.left + mapWidth / 2))
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text(`Mapa COVID-19 - ${continent} (Períodos de 15 días)`);

    const timeIndex = getTimeIndexFromDate(vista3AllDates[0]);
    const rangoTexto = getDateRangeFromIndex(timeIndex);
    vista3DateDisplay = svg3.append("text")
        .attr("class", "date-display-fixed")
        .attr("x", (margin.left + mapWidth / 2))
        .attr("y", 55)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "#666");

    const maxCasesGlobal = d3.max(Object.values(vista3CountryData), countryDates =>
        d3.max(Object.values(countryDates), d => d.casesPerMillion)
    );
    vista3ColorScale = d3.scaleSequential(d3.interpolateReds)
        .domain([0, maxCasesGlobal]);

    const continentCountries = worldData.features.filter(d => {
        const countryName = d.properties.NAME || d.properties.name || d.properties.NAME_EN;
        return Object.keys(vista3CountryData).some(dataCountry =>
            matchCountryNames(countryName, dataCountry)
        );
    });

    const worldCountries = vista3MapContainer.selectAll(".world-country")
        .data(worldData.features)
        .enter()
        .append("path")
        .attr("class", "world-country")
        .attr("d", path)
        .attr("fill", "#f8f8f8")
        .attr("stroke", "#ddd")
        .attr("stroke-width", 0.3)
        .style("opacity", 0.3)
        .style("pointer-events", "none");

    vista3Countries = vista3MapContainer.selectAll(".country")
        .data(continentCountries)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", "#f0f0f0")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .style("cursor", "pointer");

    createColorLegend(svg3, width, height, vista3ColorScale, maxCasesGlobal, margin.left + mapWidth);

    updateVista3Map(vista3AllDates[0]);

    console.log(`Vista continental creada - ${continent} (${continentCountries.length} países, ${vista3AllDates.length} fechas)`);
}

function setupContinentView(continent, width, height) {
    const svg3 = d3.select("#svg3");
    svg3.selectAll(".continent-legend-fixed").remove();

    const rankingWidth = 300;
    const margin = { top: 80, right: 50, bottom: 60, left: rankingWidth + 20 };
    const mapWidth = width - margin.left - margin.right;
    const mapHeight = height - margin.top - margin.bottom;

    svg3.select(".title-fixed")
        .text(`Mapa COVID-19 - ${continent} (Períodos de 15 días)`);

    svg3.select(".subtitle-fixed")
        .text("Evolución temporal de casos por país");

    setupProjection(continent, mapWidth, mapHeight);

    const timeIndex = getTimeIndexFromDate(vista3AllDates[0]);
    const rangoTexto = getDateRangeFromIndex(timeIndex);

    vista3DateDisplay = svg3.select(".date-display-fixed");
    if (vista3DateDisplay.empty()) {
        vista3DateDisplay = svg3.append("text")
            .attr("class", "date-display-fixed")
            .attr("x", (margin.left + mapWidth / 2))
            .attr("y", 55)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("fill", "#666");
    }

    const maxCasesGlobal = d3.max(Object.values(vista3CountryData), countryDates =>
        d3.max(Object.values(countryDates), d => d.casesPerMillion)
    );
    vista3ColorScale = d3.scaleSequential(d3.interpolateReds)
        .domain([0, maxCasesGlobal]);

    const continentCountries = worldData.features.filter(d => {
        const countryName = d.properties.NAME || d.properties.name || d.properties.NAME_EN;
        return Object.keys(vista3CountryData).some(dataCountry =>
            matchCountryNames(countryName, dataCountry)
        );
    });

    vista3Countries = vista3MapContainer.selectAll(".country")
        .data(continentCountries, d => d.properties.NAME || d.properties.name);

    vista3Countries.exit().remove();

    const newCountries = vista3Countries.enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", "#f0f0f0")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .style("cursor", "pointer");

    vista3Countries = newCountries.merge(vista3Countries);

    svg3.selectAll(".color-legend-fixed").remove();
    createColorLegend(svg3, width, height, vista3ColorScale, maxCasesGlobal, margin.left + mapWidth);

    updateVista3Map(vista3AllDates[0]);

    console.log(`Vista continental configurada - ${continent} (${continentCountries.length} países, ${vista3AllDates.length} fechas)`);
}

function setupProjection(continent, width, height) {
    if (continent === "Europe") {
        projection = d3.geoMercator()
            .center([15, 50])
            .scale(600)
            .translate([width / 2, height / 2]);
    } else if (continent === "Asia") {
        projection = d3.geoMercator()
            .center([100, 30])
            .scale(400)
            .translate([width / 2, height / 2]);
    } else if (continent === "Africa") {
        projection = d3.geoMercator()
            .center([20, 0])
            .scale(400)
            .translate([width / 2, height / 2]);
    } else if (continent === "North America") {
        projection = d3.geoAlbersUsa()
            .scale(500)
            .translate([width / 2, height / 2]);
        if (!projection) {
            projection = d3.geoMercator()
                .center([-100, 45])
                .scale(300)
                .translate([width / 2, height / 2]);
        }
    } else if (continent === "South America") {
        projection = d3.geoMercator()
            .center([-60, -15])
            .scale(400)
            .translate([width / 2, height / 2]);
    } else if (continent === "Oceania") {
        projection = d3.geoMercator()
            .center([140, -25])
            .scale(400)
            .translate([width / 2, height / 2]);
    } else {
        projection = d3.geoNaturalEarth1()
            .scale(180)
            .translate([width / 2, height / 2]);
    }

    path = d3.geoPath().projection(projection);
}

function updateLateralRanking(countryData, currentDate, continent) {
    if (!vista3RankingContainer) return;
    vista3RankingContainer.selectAll("*").remove();
    d3.select(".ranking-title").text(`Top 10 - ${continent}`);

    const timeIndex = getTimeIndexFromDate(currentDate);
    const rangoTexto = getDateRangeFromIndex(timeIndex);
    d3.select(".ranking-date").text(`Período: ${rangoTexto}`);

    const currentData = [];
    Object.entries(countryData).forEach(([country, dates]) => {
        if (dates[currentDate]) {
            currentData.push({
                country: country,
                cases: dates[currentDate].cases,
                deaths: dates[currentDate].deaths,
                casesPerMillion: dates[currentDate].casesPerMillion
            });
        }
    });

    if (currentData.length === 0) {
        vista3RankingContainer.append("text")
            .attr("x", 130)
            .attr("y", 150)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "#999")
            .text("No hay datos disponibles");
        return;
    }

    currentData.sort((a, b) => b.cases - a.cases);
    const top10 = currentData.slice(0, 10);

    const maxCases = Math.max(...top10.map(d => d.cases));

    const itemHeight = 40;
    const itemMargin = 5;

    const rankingItems = vista3RankingContainer.selectAll(".ranking-item")
        .data(top10)
        .enter()
        .append("g")
        .attr("class", "ranking-item")
        .attr("transform", (d, i) => `translate(0, ${i * (itemHeight + itemMargin)})`);

    rankingItems.append("rect")
        .attr("width", 260)
        .attr("height", itemHeight)
        .attr("fill", "white")
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", 1)
        .attr("rx", 5)
        .style("opacity", 0.9);

    const rankCircles = rankingItems.append("g")
        .attr("transform", "translate(20, 20)");

    rankCircles.append("circle")
        .attr("r", 12)
        .attr("fill", (d, i) => {
            if (i < 3) return ["#FFD700", "#C0C0C0", "#CD7F32"][i];
            return "#4CAF50";
        })
        .attr("stroke", "white")
        .attr("stroke-width", 2);

    rankCircles.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.3em")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("fill", "white")
        .text((d, i) => i + 1);

    rankingItems.append("text")
        .attr("x", 40)
        .attr("y", 15)
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text(d => {
            return d.country.length > 15 ? d.country.substring(0, 12) + "..." : d.country;
        });

    rankingItems.append("text")
        .attr("x", 40)
        .attr("y", 28)
        .style("font-size", "10px")
        .style("fill", "#e74c3c")
        .style("font-weight", "bold")
        .text(d => `Casos: ${formatNumber(d.cases)}`);

    rankingItems.append("text")
        .attr("x", 40)
        .attr("y", 38)
        .style("font-size", "10px")
        .style("fill", "#8e44ad")
        .style("font-weight", "bold")
        .text(d => `Muertes: ${formatNumber(d.deaths)}`);

    const barWidth = 100;
    const progressBars = rankingItems.append("g")
        .attr("transform", "translate(150, 15)");

    progressBars.append("rect")
        .attr("width", barWidth)
        .attr("height", 10)
        .attr("fill", "#e0e0e0")
        .attr("rx", 5);

    progressBars.append("rect")
        .attr("width", 0)
        .attr("height", 10)
        .attr("fill", (d, i) => {
            const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57"];
            return colors[i % colors.length];
        })
        .attr("rx", 5)
        .transition()
        .duration(1000)
        .delay((d, i) => i * 100)
        .attr("width", d => {
            const percentage = maxCases > 0 ? (d.cases / maxCases) : 0;
            return percentage * barWidth;
        });
}

function updateVista3Map(currentDate) {
    if (!vista3Countries || !vista3CountryData || !vista3ColorScale) return;

    vista3Countries
        .transition()
        .duration(300)
        .attr("fill", function (d) {
            const countryName = d.properties.NAME || d.properties.name || d.properties.NAME_EN;
            const dataCountry = findMatchingCountry(countryName, vista3CountryData);
            if (dataCountry && vista3CountryData[dataCountry][currentDate]) {
                const casesPerMillion = vista3CountryData[dataCountry][currentDate].casesPerMillion;
                return vista3ColorScale(casesPerMillion);
            }
            return "#f0f0f0";
        });

    if (vista3DateDisplay) {
        const timeIndex = getTimeIndexFromDate(currentDate);
        const rangoTexto = getDateRangeFromIndex(timeIndex);
        vista3DateDisplay.text(`Período: ${rangoTexto}`);
    }

    updateLateralRanking(vista3CountryData, currentDate, vista3CurrentContinent);

    vista3Countries
        .on("mouseover", function (event, d) {
            if (!vista3IsInteracting) {
                d3.select(this)
                    .attr("stroke", "#333")
                    .attr("stroke-width", 3)
                    .style("cursor", "pointer");

                const countryName = d.properties.NAME || d.properties.name || d.properties.NAME_EN;
                const dataCountry = findMatchingCountry(countryName, vista3CountryData);

                if (dataCountry && vista3CountryData[dataCountry][currentDate]) {
                    showTooltip(event, countryName, vista3CountryData[dataCountry][currentDate], currentDate);
                }
            }
        })
        .on("mouseout", function () {
            if (!vista3IsInteracting) {
                d3.select(this)
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1.5)
                    .style("cursor", "default");
                d3.select("#map-tooltip").remove();
            }
        })
        .on("mousemove", function (event) {
            if (!vista3IsInteracting) {
                const tooltip = d3.select("#map-tooltip");
                if (!tooltip.empty()) {
                    tooltip
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                }
            }
        })
        .on("click", function (event, d) {
            if (!vista3IsInteracting) {
                event.stopPropagation();
                const countryName = d.properties.NAME || d.properties.name || d.properties.NAME_EN;
                const dataCountry = findMatchingCountry(countryName, vista3CountryData);
                if (dataCountry && vista3CountryData[dataCountry]) {
                    d3.select(this)
                        .attr("stroke", "#FF6B35")
                        .attr("stroke-width", 4);
                    setTimeout(() => {
                        d3.select(this)
                            .attr("stroke", "#fff")
                            .attr("stroke-width", 1.5);
                    }, 1000);
                    updateDetailsButton(countryName, vista3CountryData[dataCountry]);

                    // Publicar el evento de selección de país
                    if (typeof eventManager !== 'undefined') {
                        eventManager.publish('countrySelected', countryName);
                    } else {
                        console.error('EventManager is not defined');
                    }
                }
            }
        });
}

function showTooltip(event, countryName, data, currentDate) {
    d3.select("#map-tooltip").remove();

    const tooltip = d3.select("body").append("div")
        .attr("id", "map-tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0,0,0,0.9)")
        .style("color", "white")
        .style("padding", "12px")
        .style("border-radius", "8px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("box-shadow", "0 4px 8px rgba(0,0,0,0.3)")
        .style("z-index", "10000")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");

    tooltip.append("div")
        .style("font-weight", "bold")
        .style("font-size", "14px")
        .style("margin-bottom", "8px")
        .style("border-bottom", "1px solid #666")
        .style("padding-bottom", "4px")
        .text(countryName);

    if (currentDate) {
        const timeIndex = getTimeIndexFromDate(currentDate);
        const rangoTexto = getDateRangeFromIndex(timeIndex);
        tooltip.append("div")
            .style("font-size", "10px")
            .style("color", "#ccc")
            .style("margin-bottom", "6px")
            .text(`Período: ${rangoTexto}`);
    }

    tooltip.append("div")
        .style("margin-bottom", "3px")
        .html(`<span style="color: #ff6b6b;">●</span> Casos: <strong>${formatNumber(data.cases)}</strong>`);

    tooltip.append("div")
        .style("margin-bottom", "3px")
        .html(`<span style="color: #ff4757;">●</span> Muertes: <strong>${formatNumber(data.deaths)}</strong>`);

    tooltip.append("div")
        .html(`<span style="color: #ffa502;">●</span> Casos/millón: <strong>${formatNumber(data.casesPerMillion)}</strong>`);

    tooltip.append("div")
        .style("font-size", "10px")
        .style("color", "#aaa")
        .style("margin-top", "8px")
        .style("border-top", "1px solid #666")
        .style("padding-top", "4px")
        .text("🖱️ Click para seleccionar este país");
}

function updateDetailsButton(countryName, countryData) {
    d3.select("#detailsButton").remove();

    const svg3 = d3.select("#svg3");
    const width = parseInt(svg3.style("width"));
    const height = parseInt(svg3.style("height"));

    const detailsButton = svg3.append("g")
        .attr("id", "detailsButton")
        .attr("transform", `translate(${width - 180}, ${height - 50})`)
        .style("cursor", "pointer")
        .on("click", function () {
            showCountryDetails(countryName, prepareCountryDataForDetails(countryName, vista3MapData), vista3CurrentContinent);
        });

    detailsButton.append("rect")
        .attr("width", 160)
        .attr("height", 40)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("fill", "#000");

    detailsButton.append("text")
        .attr("x", 80)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text(`Ver detalles de ${countryName}`);

    detailsButton.datum({ countryName: countryName, countryData: countryData });
}

function prepareCountryDataForDetails(countryName, mapData) {
    const countryData = mapData.filter(d => d.location === countryName);

    if (countryData.length === 0) return null;

    const latestData = countryData[countryData.length - 1];

    const countryInfo = {
        name: countryName,
        continent: latestData.continent,
        population: parseFloat(latestData.population) || 0,
        medianAge: parseFloat(latestData.median_age) || 0,
        aged65Older: parseFloat(latestData.aged_65_older) || 0,
        aged70Older: parseFloat(latestData.aged_70_older) || 0,
        gdpPerCapita: parseFloat(latestData.gdp_per_capita) || 0,
        extremePoverty: parseFloat(latestData.extreme_poverty) || 0,
        cardiovascDeathRate: parseFloat(latestData.cardiovasc_death_rate) || 0,
        diabetesPrevalence: parseFloat(latestData.diabetes_prevalence) || 0
    };

    const timeSeriesData = countryData.map(d => ({
        date: d.date,
        totalCases: parseFloat(d.total_cases) || 0,
        newCases: parseFloat(d.new_cases) || 0,
        newCasesSmoothed: parseFloat(d.new_cases_smoothed) || 0,
        totalDeaths: parseFloat(d.total_deaths) || 0,
        newDeaths: parseFloat(d.new_deaths) || 0,
        newDeathsSmoothed: parseFloat(d.new_deaths_smoothed) || 0,
        totalVaccinations: parseFloat(d.total_vaccinations) || 0,
        peopleVaccinated: parseFloat(d.people_vaccinated) || 0,
        peopleFullyVaccinated: parseFloat(d.people_fully_vaccinated) || 0,
        stringencyIndex: parseFloat(d.stringency_index) || 0,
        totalCasesPerMillion: parseFloat(d.total_cases_per_million) || 0,
        totalDeathsPerMillion: parseFloat(d.total_deaths_per_million) || 0
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    const latestRecord = timeSeriesData[timeSeriesData.length - 1];
    const summary = {
        totalCases: latestRecord.totalCases,
        totalDeaths: latestRecord.totalDeaths,
        caseFatalityRate: latestRecord.totalCases > 0 ? (latestRecord.totalDeaths / latestRecord.totalCases * 100) : 0,
        casesPerMillion: latestRecord.totalCasesPerMillion,
        deathsPerMillion: latestRecord.totalDeathsPerMillion,
        fullyVaccinatedRate: countryInfo.population > 0 ? (latestRecord.peopleFullyVaccinated / countryInfo.population * 100) : 0,
        peakNewCases: Math.max(...timeSeriesData.map(d => d.newCasesSmoothed)),
        peakNewDeaths: Math.max(...timeSeriesData.map(d => d.newDeathsSmoothed))
    };

    return {
        info: countryInfo,
        timeSeries: timeSeriesData,
        summary: summary
    };
}

function matchCountryNames(mapName, dataName) {
    if (!mapName || !dataName) return false;

    const normalize = str => str.toLowerCase().replace(/[^a-z]/g, '');
    const normalizedMap = normalize(mapName);
    const normalizedData = normalize(dataName);

    return normalizedMap === normalizedData ||
        normalizedMap.includes(normalizedData) ||
        normalizedData.includes(normalizedMap);
}

function findMatchingCountry(mapName, countryData) {
    const countries = Object.keys(countryData);
    return countries.find(country => matchCountryNames(mapName, country));
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return Math.round(num).toString();
}

if (typeof topojson === 'undefined') {
    console.log("Cargando librería TopoJSON...");
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js';
    script.onload = () => console.log("TopoJSON cargado exitosamente");
    script.onerror = () => {
        console.warn("Error cargando TopoJSON, usando funcionalidad limitada");
        window.topojson = {
            feature: (topology, object) => {
                console.warn("Usando topojson simplificado");
                return object;
            }
        };
    };
    document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', function () {
    setInterval(syncViewWithHTMLSelection, 1000);
    console.log("Vista3: Sistema de sincronización con HTML inicializado");
});

window.vista3Debug = {
    selectContinent: selectContinentFromMap,
    getCurrentContinent: () => vista3CurrentContinent,
    getAvailableContinents: () => Object.keys(continentCountriesMap),
    getContinentInfo: getContinentInfo
};
