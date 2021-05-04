import * as L from 'leaflet'
import d3Legend from 'd3-svg-legend'

var geojson;

export function initFilters(data) {
    var tmp = [...new Map(data.map((x) => [x.properties["municipalite"], { "mrc": x.properties["municipalite"], "region": x.properties["region"] }])).values()];
    var region = [...new Map(tmp.map((x) => [x.region, x.region])).values()].sort();
    var mrc = [...new Map(tmp.map((x) => [x.mrc, x.mrc])).values()].sort();

    d3.selectAll(".allOption").remove()
    d3.select("#region")
        .append("option")
        .attr("value", "all")
        .text("--all--")
        .attr("class", "allOption")

    d3.select("#region")
        .selectAll("option")
        .data(region)
        .enter()
        .append("option")
        .attr("value", function(d) { return d; })
        .text(function(d) { return d; });

    d3.select("#mrc")
        .append("option")
        .attr("value", "all")
        .text("--all--")
        .attr("class", "allOption")

    d3.select("#mrc")
        .selectAll("option")
        .data(mrc)
        .enter()
        .append("option")
        .attr("value", function(d) { return d; })
        .text(function(d) { return d; });

}

function getIntensite(region, groupByRegion) {
    var result = []
    groupByRegion.forEach((d) => {
        if (d.key.includes(region)) {
            result.push(d.value)
        }
    })
    if (result == []) { return NaN }
    return result[0]
}

export function initMap() {
    /* Add leaflet map */
    var map = new L.Map("map", { center: [53.0, -70.0], zoom: 5, minZoom: 4 });
    L.tileLayer("https://stamen-tiles.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}@2x.png").addTo(map);

    /* Add svg layer to the map */
    L.svg({ clickable: true }).addTo(map)

    return map
}

export function setColorScale() {
    var color = d3.scaleOrdinal()
        .domain(['Très petite', 'Petite', 'Moyenne', 'Grande', 'Très grande'])
        .range(["#d0efff", "#2a9df4", "#187bcd", "#1167ba", "#03254c"]);
    return color
}

export function addInfoPanel(map, groupByRegion) {
    var info = L.control();

    info.onAdd = function(map) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };

    info.update = function(props) {
        this._div.innerHTML = '<h5 style="margin:0px">Municipalité</h5>' + (props ?
            '<b>' + props.Municipalite + '</b><br /><b> Intensité des débordements: </b>' + Number(getIntensite(props.Municipalite, groupByRegion)).toFixed(2) :
            'Survolez une municipalité');
    };

    info.addTo(map);

    return info
}

export function drawCircles(map, color, data) {

    /* add the svg to leaflet map */
    var svg = d3.select("#map").select("svg"),
        g = svg.append("g");

    /* Remove old circles */
    d3.selectAll(".mycircle").remove();

    /* Adding the circles with data */
    g.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "mycircle")
        .style("stroke", "black")
        .attr("stroke-width", 1)
        .style("opacity", 1)
        .style("fill", function(d) { return color(d.properties["taille"]) })
        .attr("cx", function(d) { return map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).x })
        .attr("cy", function(d) { return map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).y })
        .attr("r", 5)
        .attr("pointer-events", "visible");
    map.on("zoomend", function() {
        update(map);
    });
    update(map);
}

function update(map) {
    d3.selectAll(".mycircle")
        .attr("cx", function(d) { return map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).x })
        .attr("cy", function(d) { return map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).y })
}

export function drawChoropleth(map, info, collection, groupByRegion) {
    geojson = L.geoJson(collection, {
        style: (feature) => { return style(feature, groupByRegion) },
        onEachFeature: (feature, layer) => { onEachFeature(layer, info, map) }
    })
    return geojson

}

export function getColor(d) {
    var color = d3.scaleSequential(d3.interpolateReds)
        .domain([0, 600000])
        .unknown("#ccc");
    return color(d)
}

function highlightFeature(e, info) {
    var layer = e.target;

    layer.setStyle({
        weight: 1,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    info.update(layer.feature.properties);
}

function resetHighlight(e, info) {
    geojson.resetStyle(e.target);
    info.update();
}

function zoomToFeature(e, map) {
    map.fitBounds(e.target.getBounds());
}

function style(feature, groupByRegion) {
    return {
        weight: 0.5,
        opacity: 0.5,
        color: 'black',
        dashArray: '3',
        fillOpacity: 0.5,
        fillColor: getColor(getIntensite(feature.properties.Municipalite, groupByRegion))
    };
}

function onEachFeature(layer, info, map) {
    layer.on({
        mouseover: (e) => { highlightFeature(e, info) },
        mouseout: (e) => { resetHighlight(e, info) },
        click: (e) => { zoomToFeature(e, map) }
    });
}

/* Volume Line Chart */
export function drawVolumeLineChart(tmp) {

    var svg = d3.select("#metric-modal").append("svg")
        .attr("width", "100%")
        .attr("height", "80%")

    var width = parseInt(svg.style("width"));
    var height = parseInt(svg.style("height"));
    // sets margins for both charts
    var focusChartMargin = { top: 20, right: 20, bottom: 200, left: 70 };
    var contextChartMargin = { top: 360, right: 20, bottom: 90, left: 60 };

    // width of both charts
    var chartWidth = width - focusChartMargin.left - focusChartMargin.right;

    // height of either chart
    var focusChartHeight = height - focusChartMargin.top - focusChartMargin.bottom;
    var contextChartHeight = height - contextChartMargin.top - contextChartMargin.bottom;

    // bootstraps the d3 parent selection
    svg
        .append("svg")
        .attr("width", chartWidth + focusChartMargin.left + focusChartMargin.right)
        .attr("height", focusChartHeight + focusChartMargin.top + focusChartMargin.bottom)
        .append("g")
        .attr("transform", "translate(" + focusChartMargin.left + "," + focusChartMargin.top + ")");

    //group all dates to get range for x axis later
    var dates = [];
    for (let key of Object.keys(tmp)) {
        dates.push(tmp[key].key);
    }
    //get max Y axis value by searching for the highest conversion rate
    var maxYAxisValue = -Infinity;
    for (let key of Object.keys(tmp)) {
        maxYAxisValue = Math.max(tmp[key].value, maxYAxisValue);
    }

    // set the height of both y axis
    var yFocus = d3.scaleLinear().range([focusChartHeight, 0]);
    var yContext = d3.scaleLinear().range([contextChartHeight, 0]);

    // set the width of both x axis
    var xFocus = d3.scaleTime().range([0, chartWidth]);
    var xContext = d3.scaleTime().range([0, chartWidth]);

    // create both x axis to be rendered
    var xAxisFocus = d3
        .axisBottom(xFocus)
        .ticks(10)
        .tickFormat(d3.timeFormat("%Y-%m"));

    var xAxisContext = d3
        .axisBottom(xContext)
        .ticks(10)
        .tickFormat(d3.timeFormat("%Y-%m"));

    // create the one y axis to be rendered
    var yAxisFocus = d3.axisLeft(yFocus).tickFormat(d => d);

    // build brush
    var brush = d3
        .brushX()
        .extent([
            [0, -10],
            [chartWidth, contextChartHeight],
        ])
        .on("brush end", brushed);
    // build zoom for the focus chart
    // as specified in "filter" - zooming in/out can be done by pinching on the trackpad while mouse is over focus chart
    // zooming in can also be done by double clicking while mouse is over focus chart
    var zoom = d3
        .zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([
            [0, 0],
            [chartWidth, focusChartHeight],
        ])
        .extent([
            [0, 0],
            [chartWidth, focusChartHeight],
        ])
        .on("zoom", zoomed)
        .filter(() => d3.event.ctrlKey || d3.event.type === "dblclick" || d3.event.type === "mousedown");

    // create a line for focus chart
    var lineFocus = d3
        .line()
        .x(d => {
            return xFocus(d.key)
        })
        .y(d => {
            return yFocus(d.value)
        });

    // create line for context chart
    var lineContext = d3
        .line()
        .x(d => {
            return xContext(d.key)
        })
        .y(d => yContext(d.value));

    // es lint disabled here so react won't warn about not using variable "clip"
    /* eslint-disable */

    // clip is created so when the focus chart is zoomed in the data lines don't extend past the borders
    var clip = svg
        .append("defs")
        .append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", chartWidth)
        .attr("height", focusChartHeight)
        .attr("x", 0)
        .attr("y", 0);

    // append the clip
    var focusChartLines = svg
        .append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + focusChartMargin.left + "," + focusChartMargin.top + ")")
        .attr("clip-path", "url(#clip)");

    /* eslint-enable */

    // create focus chart
    var focus = svg
        .append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + focusChartMargin.left + "," + focusChartMargin.top + ")");

    // create context chart
    var context = svg
        .append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + contextChartMargin.left + "," + (contextChartMargin.top + 50) + ")");

    // add data info to axis
    xFocus.domain(d3.extent(dates));
    yFocus.domain([0, maxYAxisValue]);
    xContext.domain(d3.extent(dates));
    yContext.domain(yFocus.domain());

    // add axis to focus chart
    focus
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + focusChartHeight + ")")
        .call(xAxisFocus);
    focus
        .append("g")
        .attr("class", "y-axis")
        .call(yAxisFocus);

    focusChartLines
        .append("path")
        .datum(tmp)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "#0000FF")
        .attr("stroke-width", 1.5)
        .attr("d", lineFocus);
    context
        .append("path")
        .datum(tmp)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("d", lineContext);

    var tmpfocus = focus.append("g")
        .attr("class", "focus")
        .style("display", "none");

    tmpfocus.append("circle")
        .attr("r", 5);

    tmpfocus.append("rect")
        .attr("class", "tooltip")
        .attr("width", 100)
        .attr("height", 50)
        .attr("x", 10)
        .attr("y", -22)
        .attr("rx", 4)
        .attr("ry", 4);

    tmpfocus.append("text")
        .attr("class", "tooltip-date")
        .attr("x", 18)
        .attr("y", -2);

    focus.append("rect")
        .attr("class", "overlay")
        .on("mouseover", function() { tmpfocus.style("display", null); })
        .on("mouseout", function() { tmpfocus.style("display", "none"); })
        .on("mousemove", mousemove);

    function mousemove() {
        tmpfocus.select(".tooltip-date").text("test");
    }

    // add x axis to context chart (y axis is not needed)
    context
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + contextChartHeight + ")")
        .call(xAxisContext);

    // add bush to context chart
    var contextBrush = context
        .append("g")
        .attr("class", "brush")
        .call(brush);

    // style brush resize handle
    var brushHandlePath = d => {
        var e = +(d.type === "e"),
            x = e ? 1 : -1,
            y = contextChartHeight + 10;
        return (
            "M" +
            0.5 * x +
            "," +
            y +
            "A6,6 0 0 " +
            e +
            " " +
            6.5 * x +
            "," +
            (y + 6) +
            "V" +
            (2 * y - 6) +
            "A6,6 0 0 " +
            e +
            " " +
            0.5 * x +
            "," +
            2 * y +
            "Z" +
            "M" +
            2.5 * x +
            "," +
            (y + 8) +
            "V" +
            (2 * y - 8) +
            "M" +
            4.5 * x +
            "," +
            (y + 8) +
            "V" +
            (2 * y - 8)
        );
    };

    var brushHandle = contextBrush
        .selectAll(".handle--custom")
        .data([{ type: "w" }, { type: "e" }])
        .enter()
        .append("path")
        .attr("class", "handle--custom")
        .attr("stroke", "#000")
        .attr("cursor", "ew-resize")
        .attr("d", brushHandlePath);

    // overlay the zoom area rectangle on top of the focus chart
    svg
        .append("rect")
        .attr("cursor", "move")
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .attr("class", "zoom")
        .attr("width", chartWidth)
        .attr("height", focusChartHeight)
        .attr("transform", "translate(" + focusChartMargin.left + "," + focusChartMargin.top + ")")
        .call(zoom);

    contextBrush.call(brush.move, [0, chartWidth]);

    // focus chart x label
    focus
        .append("text")
        .attr("transform", "translate(" + chartWidth / 2 + " ," + (focusChartHeight + focusChartMargin.top + 25) + ")")
        .style("text-anchor", "middle")
        .style("font-size", "18px")
        .text("Date de débordement");

    // focus chart y label
    focus
        .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(" + (-focusChartMargin.left + 20) + "," + focusChartHeight / 2 + ")rotate(-90)")
        .style("font-size", "18px")
        .text("Volume de débordement");



    function brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
        var s = d3.event.selection || xContext.range();
        xFocus.domain(s.map(xContext.invert, xContext));
        focusChartLines.selectAll(".line").attr("d", lineFocus);
        focus.select(".x-axis").call(xAxisFocus);
        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity.scale(chartWidth / (s[1] - s[0])).translate(-s[0], 0));
        brushHandle
            .attr("display", null)
            .attr("transform", (d, i) => "translate(" + [s[i], -contextChartHeight - 20] + ")");
    }

    function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
        var t = d3.event.transform;
        xFocus.domain(t.rescaleX(xContext).domain());
        focusChartLines.selectAll(".line").attr("d", lineFocus);
        focus.select(".x-axis").call(xAxisFocus);
        var brushSelection = xFocus.range().map(t.invertX, t);
        context.select(".brush").call(brush.move, brushSelection);
        brushHandle
            .attr("display", null)
            .attr("transform", (d, i) => "translate(" + [brushSelection[i], -contextChartHeight - 20] + ")");
    }

}

/* Heatmap */
export function drawRiversHeatmap(svg, color, river_names, years, data) {
    var margin = ({ top: 30, right: 1, bottom: 100, left: 300 })
    var height = 11
    var innerHeight = height * river_names.length
    var width = 100 * years.length + margin.left + margin.right

    var yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickSize(0))
        .call(g => g.select(".domain").remove())

    var xAxis = g => g
        .call(g => g.append("g")
            .attr("transform", `translate(0,${ margin.top + innerHeight })`)
            .call(d3.axisBottom(x).ticks(null, "d"))
            .call(g => g.select(".domain").remove()))

    var y = d3.scaleBand()
        .domain(river_names)
        .range([margin.top, margin.top + innerHeight])

    var x = d3.scaleBand()
        .range([margin.left, width - margin.right])
        .domain(years)
        .padding(0.05);

    svg.append("g")
        .call(yAxis);
    svg.append('g')
        .attr('class', 'x axis')
    d3.select('.x')
        .append("g")
        .call(xAxis)

    svg.append('g')
        .attr('class', 'y axis')

    svg.append("g")
        .selectAll("g")
        .data(data)
        .join("g")
        .attr("transform", (d, i) => { return `translate(0,${y(d.river)})` })
        .append("rect")
        .attr("x", (d, i) => { return x(d.year) + 1 })
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth() - 1)
        .attr("fill", d => isNaN(d["intensité"]) ? "#eee" : d["intensité"] == "" ? "#eee" : d["intensité"] === 0 ? "#fff" : color(d["intensité"]))
        .style("stroke-width", 4)
        .style("stroke", "none")
        .style("opacity", 0.8)
        .select(function() { return this.parentNode; })
        .append("text").text(function(d) { return d["intensité"] })
        .attr("x", (d, i) => { return x(d.year) + 1 })
        .attr("transform", "translate(" + x.bandwidth() / 2 + "," + y.bandwidth() / 2 + ")")
        .text(function(d) {
            if (d["intensité"] == "") {
                return "-";
            } else {
                return Number(d["intensité"]).toFixed(2)
            }
        })
        .style("font-weight", "bolder")
        .style("font-size", "8px")
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", "middle")
        .attr("fill", function(d) { if (d["intensité"] >= 300000) return "white" })

}
/* Treemap volume par technique d'épuration*/
export function drawVolPerTechTreemap(data, color, canvas) {
    var width = parseInt(canvas.style("width"));
    var height = parseInt(canvas.style("height"));

    let hierarchy = d3.hierarchy(data,
        (node) => {
            return node['children']
        }
    ).sum(
        (node) => {
            return node['value']
        }
    ).sort(
        (node1, node2) => {
            return node2['value'] - node1['value']
        }
    )

    d3.treemap()
        .size([width - 200, height]).padding(2).round(true)
        (hierarchy)
    let dataTiles = hierarchy.leaves()

    let block = canvas.selectAll('g')
        .data(dataTiles)
        .enter()
        .append('g')
        .attr('transform', (data) => {
            return 'translate (' + data['x0'] + ', ' + data['y0'] + ')'
        })

    canvas.append("g")
        .attr("class", "legendSequential")
        .attr("transform", "translate(" + (width - 200) + ", 20 )");

    block.append('rect')
        .attr('class', 'tile')
        .attr('fill', (d) => { return color(d.parent.data.name) })
        .attr('child-name', (data) => {
            return data['data']['name']
        })
        .attr('parent-name', (data) => {
            return data['parent']['data']['name']
        })
        .attr('child-value', (data) => {
            return data['data']['value']
        })
        .attr('width', (data) => {
            return data['x1'] - data['x0']
        })
        .attr('height', (data) => {
            return data['y1'] - data['y0']
        })

    var format = d3.format(",d")
    block.append("text")
        .selectAll("tspan")
        .data(d => {
            if (d.data.value > 300) {
                return d.data.name.split(/(?=[A-Z][a-z])|\s+/g).concat(format(d.value))
            } else {
                return "."
            }
        })
        .join("tspan")
        .attr("x", 3)
        .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
        .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
        .text(d => d);

}
/* Treemap volume par station d'épuration*/
export function drawVolPerStepTreemap(data, color, canvas) {

    var width = parseInt(canvas.style("width"));
    var height = parseInt(canvas.style("height"));

    let hierarchy = d3.hierarchy(data,
        (node) => {
            return node['children']
        }
    ).sum(
        (node) => {
            return node['value']
        }
    ).sort(
        (node1, node2) => {
            return node2['value'] - node1['value']
        }
    )

    d3.treemap()
        .size([width - 150, height]).padding(2).round(true)
        (hierarchy)

    let dataTiles = hierarchy.leaves()

    let block = canvas.selectAll('g')
        .data(dataTiles)
        .enter()
        .append('g')
        .attr('transform', (data) => {
            return 'translate (' + data['x0'] + ', ' + data['y0'] + ')'
        })

    canvas.append("g")
        .attr("class", "legendSequential")
        .attr("transform", "translate(" + (width - 150) + ", 20 )");



    block.append('rect')
        .attr('class', 'tile')
        .attr("fill", d => color(d.parent.data.name))
        .attr("fill-opacity", 0.8)
        .attr('width', (data) => {
            return data['x1'] - data['x0']
        })
        .attr('height', (data) => {
            return data['y1'] - data['y0']
        })
        .attr('stroke', 'white')


    var format = d3.format(",d")
    var ky = height / 1;

    block.append("text")
        .selectAll("tspan")
        .data(d => [d.data.name.replace("Station d'épuration de", "").split('(')[0]].concat(format(d.value)))
        .join("tspan")
        .attr("x", 5)
        .attr("y", (d, i, nodes) => {
            return `${(i === nodes.length - 1) * 0.5 + 1.1 + i * 0.5}em`
        })
        .attr("opacity", function(d) { return d.dx * ky > 10 ? 1 : 0; })
        .text((d, i, nodes) => d);

    block.append("text")
        .selectAll("tspan")
        .data(d => {
            if (d.data.value > 600000) {
                return d.data.name.split("(")[0].split(/(?=[A-Z][a-z])/g).concat(format(d.value))
            } else {
                return "."
            }
        })
        .join("tspan")
        .attr("font-size", "5px")
        .attr("x", 2)
        .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.5 + 1.1 + i * 0.8}em`)
        .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
        .text(d => d);

}

export function drawStackedBarChart(data, color) {
    // set the dimensions and margins of the graph
    var svg = d3.select("#stacked-bar-chart")
        .append("svg")
        .attr("width", "80%")
        .attr("height", "100%")

    var width = parseInt(svg.style("width"));
    var height = parseInt(svg.style("height"));

    var margin = { top: 10, right: 30, bottom: 60, left: 50 },
        width = width - margin.left - margin.right,
        height = height - margin.top - margin.bottom;

    // append the svg object to the body of the page
    svg.append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // List of subgroups = header of the csv files = soil condition here
    var subgroups = data.columns.slice(1)

    // List of groups = species here = value of the first column called group -> I show them on the X axis
    var groups = d3.map(data, function(d) { return (d.Group) }).keys()

    // Add X axis
    var x = d3.scaleBand()
        .domain(groups)
        .range([0, width - margin.left - margin.right])
        .padding([0.2])

    svg.append("g")
        .attr("transform", "translate(150," + (height - 20) + ")")
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .attr("class", "x")

    svg.selectAll(".tick text").attr("transform", "rotate(-45) translate(-20,0)")
        // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, 10000000])
        .range([height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y))
        .attr("transform", "translate(150,-20)")
        .attr("width", 100);

    //stack the data? --> stack per subgroup
    var stackedData = d3.stack()
        .keys(subgroups)
        (data)

    // Show the bars
    svg.append("g")
        .selectAll("g")
        // Enter in the stack data = loop key per key = group per group
        .data(stackedData)
        .enter().append("g")
        .attr("fill", function(d) { return color(d.key); })
        .selectAll("rect")
        // enter a second time = loop subgroup per subgroup to add all rectangles
        .data(function(d) { return d; })
        .enter().append("rect")
        .attr("x", function(d) { console.log(d.data); return x(d.data.Group); })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
        .attr("width", x.bandwidth())
        .attr("transform", "translate(150,-20)")

    var legendsvg = d3.select("#stacked-bar-chart")
        .append("svg")
        .attr("width", "15%")
        .attr("height", "100%")


    legendsvg.append("g")
        .attr("class", "legendSequential")
        .attr("transform", "translate(10,30)")

    var legendSequential = d3Legend.legendColor()
        .shapeWidth(30)
        .cells(10)
        .orient("vertical")
        .scale(color)
        .labelAlign('start')
        .title('Les contextes des surverses:')

    legendsvg.select(".legendSequential")
        .call(legendSequential);


    // focus chart x label
    svg
        .append("text")
        .attr("transform", "translate(" + ((width / 2) + 50) + " ," + (height + margin.top + 60) + ")")
        .style("text-anchor", "middle")
        .style("font-size", "18px")
        .text("Date de débordement");

    // focus chart y label
    svg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(" + (-margin.left + 100) + "," + height / 2 + ")rotate(-90)")
        .style("font-size", "18px")
        .text("Volume de débordement en m3");


}
export function drawBarChart(data) {
    var svg = d3.select("#bar-chart")
        .append("svg")
        .attr("width", "80%")
        .attr("height", "100%");

    var width = parseInt(svg.style("width"));
    var height = parseInt(svg.style("height"));

    var margin = { top: 10, right: 30, bottom: 60, left: 50 },
        width = width - margin.left - margin.right,
        height = height - margin.top - margin.bottom;

    var xScale = d3.scaleBand().range([0, width - margin.left - margin.right]).padding(0.4),
        yScale = d3.scaleLinear().range([height, 0]);

    var g = svg.append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    xScale.domain(data.map(function(d) { return d["code suivi"]; }));
    yScale.domain([0, d3.max(data, function(d) { return d.value; })]);

    g.append("g")
        .call(d3.axisBottom(xScale))
        .attr("transform", "translate(150," + (height - 20) + ")")

    g.append("g")
        .append("text")
        .attr("transform", "translate(" + ((width / 2) + 50) + " ," + (height + margin.top + 40) + ")")
        .style("text-anchor", "middle")
        .style("font-size", "18px")
        .text("Code de catégorie de suivi");

    g.append("g")
        .call(d3.axisLeft(yScale).tickFormat(function(d) { return d; })
            .ticks(10))
        .attr("transform", "translate(150,-20)")
        .attr("width", 100)

    g.append("g")
        .append("text")
        .style("font-size", "18px")
        .attr("text-anchor", "end")
        .text("Volume (m3)")
        .attr("transform", "translate(" + (-margin.left + 80) + "," + ((height / 2) - 80) + ")rotate(-90)");

    g.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("x", function(d) { return xScale(d["code suivi"]); })
        .attr("y", function(d) { return yScale(d.value); })
        .attr("width", xScale.bandwidth())
        .attr("height", function(d) { return height - yScale(d.value); })
        .attr("transform", "translate(150,-20)")
        .attr("fill", "#2a9df4")

}

export function setTooltip(myicon_id, mypopup_id) {
    var myicon = d3.select("#" + myicon_id);
    var mypopup = d3.select("#" + mypopup_id);
    mypopup.style("display", "none");

    myicon.on("mouseover", (evt) => {
        mypopup.style("top", (d3.event.pageY - 50) + "px")
            .style("left", (d3.event.pageX + 10) + "px")
            .style("display", "block");
    });
    myicon.on("mouseout", (evt) => {
        mypopup.style("display", "none");
    });


}