'use strict'
import d3Legend from 'd3-svg-legend'

import * as quebec_map from './scripts/map'
import * as first_treemap from './scripts/treemap-first'
import * as heatmap from './scripts/heatmap'
import * as piechart from './scripts/PieChart'
import * as barchart from './scripts/bar1'
import * as second_treemap from './scripts/treemap-second'
import * as d3Chromatic from 'd3-scale-chromatic'

/**
 * @file This file is the entry-point for the the code for TP3 for the course INF8808.
 * @author Olivia Gélinas
 * @version v1.0.0
 */

(function(d3) {
    CreateMap()
    heatmap.CreateHeatmap()
        //barchart.createBar()
    CreateTreemap()
        //piechart.CreatePieChart()
        //CreateTreemap_v2()
    CreateBarchart()
})(d3)

function CreateTreemap() {

    d3.json("data_treemap1.json").then(function(data) {
        first_treemap.firstTreemap(data);
    })

    d3.json("data_treemap2.json").then(function(data) {
        second_treemap.secondTreemap(data);
    })
}

function CreateMap() {
    var map = quebec_map.initMap()
    var svg = d3.select(map.getPanes().overlayPane).append("svg"),
        g = svg.append("g").attr("class", "leaflet-zoom-hide");

    d3.csv("region_dt_intensite.csv").then(function(data) {
        var values = []
        var groupByRegion = d3.nest()
            .key(function(d) { return d["MUNICIPALITÉ"]; })
            .rollup(function(v) { return d3.mean(v, function(d) { return d["intensité"]; }); })
            .entries(data);
        groupByRegion.forEach((d) => values.push(d.value))

        var color = d3.scaleSequentialQuantile(d3.interpolateBlues)
            .domain([d3.min(values), d3.max(values)]);


        d3.json("municipalite.geojson").then(function(collection) {

            // control that shows state info on hover
            var info = L.control();

            info.onAdd = function(map) {
                this._div = L.DomUtil.create('div', 'info');
                this.update();
                return this._div;
            };

            info.update = function(props) {
                this._div.innerHTML = '<h5 style="margin:0px">Municipalité</h5>' + (props ?
                    '<b>' + props.Municipalite + '</b><br /><b> Intensité des débordements: </b>' + Number(getIntensite(props.Municipalite)).toFixed(2) :
                    'Survolez une municipalité');
            };

            info.addTo(map);

            function getColor(d) {
                return d >= 600000 ? '#7a0172' :
                    d > 450000 ? '# BD0026' :
                    d > 300000 ? '#E31A1C' :
                    d > 150000 ? '#FC4E2A' :
                    d > 10000 ? '#FD8D3C' :
                    d > 5000 ? '#FEB24C' :
                    d > 0 ? '#FED976' : '#ccc';
            }

            function getIntensite(region) {
                var result = []
                groupByRegion.forEach((d) => {
                    if (d.key.includes(region)) {
                        result.push(d.value)
                    }
                })
                if (result == []) { return NaN }
                return result[0]
            }

            function style(feature) {
                return {
                    weight: 0.5,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.5,
                    fillColor: getColor(getIntensite(feature.properties.Municipalite))
                };
            }

            function highlightFeature(e) {
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

            var geojson;

            function resetHighlight(e) {
                geojson.resetStyle(e.target);
                info.update();
            }

            function zoomToFeature(e) {
                map.fitBounds(e.target.getBounds());
            }

            function onEachFeature(feature, layer) {
                layer.on({
                    mouseover: highlightFeature,
                    mouseout: resetHighlight,
                    click: zoomToFeature
                });
            }

            geojson = L.geoJson(collection, {
                style: style,
                onEachFeature: onEachFeature
            }).addTo(map);

            map.attributionControl.addAttribution('Population data &copy; <a href="http://census.gov/">US Census Bureau</a>');

            var legend = L.control({ position: 'bottomleft' });

            legend.onAdd = function(map) {
                var div = L.DomUtil.create('div', 'info legend'),
                    grades = ["NaN or 0", 5000, 10000, 150000, 300000, 450000, 600000];
                div.innerHTML = "<h5> Intensité des surverses: </h5>"
                    // loop through our density intervals and generate a label with a colored square for each interval
                for (var i = 0; i < grades.length; i++) {
                    div.innerHTML +=
                        '<i style="background:' + getColor(grades[i]) + '"><div class="legend-text"> ' + grades[i] + '</div></i></br>'
                };
                return div;
            };

            legend.addTo(map);

        });
    });

    d3.json('./step.geojson', d3.autoType).then(function(data) {
        var color = quebec_map.colorScale()
        quebec_map.addLegend(map, color)
        quebec_map.drawCircles(data, map, color)
    });

    d3.csv('./volume.csv', d3.autoType).then(function(data) {

        data.forEach(function(d) {
            d.year_month = d["Date de début du débordement"].getFullYear() + "-" + d["Date de début du débordement"].getMonth().toString().padStart(2, "0");
        })
        var parseTime = d3.timeParse("%Y-%m");
        var groupByYear = d3.nest()
            .key(function(d) { return d.year_month; })
            .rollup(function(v) { return d3.mean(v, function(d) { return d["Volume de débordement (m³)"]; }); })
            .entries(data);

        var tmp = []
            // format month as a date
        groupByYear.forEach(function(d) {
            if (parseTime(d.key).getFullYear() > 2016) {
                tmp.push({ "key": parseTime(d.key), "value": d.value })
            }
        });

        var svg = d3.select("#metric-modal").append("svg")
            .attr("width", "100%")
            .attr("height", "70%")
        var width = parseInt(svg.style("width"));
        var height = parseInt(svg.style("height"));
        // sets margins for both charts
        var focusChartMargin = { top: 50, right: 20, bottom: 170, left: 60 };
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

        contextBrush.call(brush.move, [0, chartWidth / 2]);

        // focus chart x label
        focus
            .append("text")
            .attr("transform", "translate(" + chartWidth / 2 + " ," + (focusChartHeight + focusChartMargin.top + 5) + ")")
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

    })
}

function CreateTreemap_v2() {
    var color = d3.scaleOrdinal()
        .domain(['Très petite', 'Petite', 'Moyenne', 'Grande', 'Très grande'])
        .range(["#d0efff", "#2a9df4", "#187bcd", "#1167ba", "#03254c"]);

    var format = d3.format(",d")
    var height = 500
    var width = 500

    var treemap = data => d3.treemap()
        .tile(d3.treemapSquarify.ratio(1))
        .size([width / Math.pow(10, 30).toFixed(2), height])
        (d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value))

    function entity(character) {
        return `&#${character.charCodeAt(0).toString()};`;
    }

    d3.json("data_treemap2.json").then(function(data) {
        console.log(data)
        const root = treemap(data);
        const svg = d3.select("#canvasTreemap2").append("svg")
            .attr("viewBox", [0, 0, width, height])
            .style("font", "11px sans-serif");

        const leaf = svg.selectAll("g")
            .data(root.leaves())
            .join("g")
            .attr("transform", d => `translate(${Math.round(d.x0 *  Math.pow(10, 30).toFixed(2))},${Math.round(d.y0)})`);

        leaf.append("title")
            .text(d => `${d.ancestors().reverse().map(d => d.data.name.replace("Station d'épuration de", "")).join("/")}\n${format(d.value)}`);

        leaf.append("rect")
            .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
            .attr("fill-opacity", 0.6)
            .attr("width", d => Math.round(d.x1 * Math.pow(10, 30).toFixed(2)) - Math.round(d.x0 * Math.pow(10, 30).toFixed(2)) - 1)
            .attr("height", d => Math.round(d.y1) - Math.round(d.y0) - 1);

        leaf.append("clipPath")
            .append("use")

        leaf.append("text")
            .selectAll("tspan")
            .data(d => [d.data.name.replace("Station d'épuration de", "")].concat(format(d.value)))
            .join("tspan")
            .attr("x", 3)
            .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
            .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.9 : null)
            .text(d => d);
    })

}


function CreateBarchart() {
    d3.csv("stacked.csv").then(
        function(data) {
            // set the dimensions and margins of the graph
            var margin = { top: 10, right: 30, bottom: 20, left: 50 },
                width = 1500 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;

            // append the svg object to the body of the page
            var svg = d3.select("#bar-chart")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");
            // List of subgroups = header of the csv files = soil condition here
            var subgroups = data.columns.slice(1)

            // List of groups = species here = value of the first column called group -> I show them on the X axis
            var groups = d3.map(data, function(d) { return (d.Group) }).keys()

            // Add X axis
            var x = d3.scaleBand()
                .domain(groups)
                .range([0, 1300])
                .padding([0.2])

            svg.append("g")
                .attr("transform", "translate(20," + (height - 20) + ")")
                .call(d3.axisBottom(x).tickSizeOuter(0))
                .attr("class", "x")
            svg.selectAll(".tick text").attr("transform", "rotate(-45) translate(-20,0)")
                // Add Y axis
            var y = d3.scaleLinear()
                .domain([0, 10000000])
                .range([height, 0]);

            svg.append("g")
                .call(d3.axisLeft(y))
                .attr("transform", "translate(20,-20)")
                .attr("width", 100);

            // color palette = one color per subgroup
            var color = d3.scaleOrdinal()
                .domain(subgroups)
                .range(d3.schemeTableau10)

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
                .attr("x", function(d) { return x(d.data.Group); })
                .attr("y", function(d) { return y(d[1]); })
                .attr("height", function(d) { return y(d[0]) - y(d[1]); })
                .attr("width", x.bandwidth())
                .attr("transform", "translate(20,-20)")

            svg.append("g")
                .attr("class", "legendSequential")
                .attr("transform", "translate(1200,5)");

            var legendSequential = d3Legend.legendColor()
                .shapeWidth(30)
                .cells(10)
                .orient("vertical")
                .scale(color)
                .labelAlign('start')
                .title('Légende')

            svg.select(".legendSequential")
                .call(legendSequential);

        })

}