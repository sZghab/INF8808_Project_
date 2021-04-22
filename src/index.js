'use strict'

import * as helper from './scripts/helper.js'
import * as preproc from './scripts/preprocess.js'
import * as viz from './scripts/viz.js'
import * as legend from './scripts/legend.js'
import * as hover from './scripts/hover.js'
import * as util from './scripts/util.js'

import * as quebec_map from './scripts/map'
import * as bar_chart from './scripts/stack-bar'

import * as d3Chromatic from 'd3-scale-chromatic'

/**
 * @file This file is the entry-point for the the code for TP3 for the course INF8808.
 * @author Olivia Gélinas
 * @version v1.0.0
 */

(function(d3) {
    CreateMap()
        // bar_chart.CreateBar()
        //CreateHeatmap()
})(d3)


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

        console.log(groupByRegion)

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


            // get color depending on population density value
            function getColor(d) {
                return d > 813296 ? '#800026' :
                    d > 609972 ? '#BD0026' :
                    d > 406648 ? '#E31A1C' :
                    d > 203324 ? '#FC4E2A' :
                    d > 0 ? '#FD8D3C' :
                    '#ccc';
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


            var legend = L.control({ position: 'topright' });

            legend.onAdd = function(map) {

                var div = L.DomUtil.create('div', 'info legend'),
                    grades = [Nan, 0, 203324, 406648, 609972, 813296];

                // loop through our density intervals and generate a label with a colored square for each interval
                for (var i = 0; i < grades.length; i++) {
                    div.innerHTML +=
                        '<i style="background:' + color(grades[i]) + '"><div class="legend-text"> ' + grades[i] + '</div></i></br>'
                };
            }

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
            .attr("height", "100%")
        var width = parseInt(svg.style("width"));
        var height = parseInt(svg.style("height"));
        // sets margins for both charts
        var focusChartMargin = { top: 20, right: 20, bottom: 170, left: 60 };
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
            .attr("stroke", "black")
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

    })
}

function CreateHeatmap() {

    d3.csv('riviere_intensite.csv').then(function(data) {

        var lPatchWidth = 200;
        var itemSize = 22,
            cellSize = itemSize - 3,
            margin = { top: 50, right: 20, bottom: 120, left: 110 };

        var data;

        var width = 1000 - margin.right - margin.left,
            height = 900 - margin.top - margin.bottom;


        var colorScale;

        var colorHold = ["#781426", "#C76475", "#EF9FAE", "#ABDB92", "#77B75B", "#2E6E12"]
        var colorLText = ["< -66%", "-66% to -33%", "-33% to 0%", "0% to 33%", "33% to 66%", "> 66%"]

        function bandClassifier(val, multiplier) {
            if (val >= 0) {
                return (Math.floor((val * multiplier) / (.33 * multiplier)) + 1) > 3 ? 3 : Math.floor((val * multiplier) / (.33 * multiplier)) + 1
            } else {
                return (Math.floor((val * multiplier) / (.33 * multiplier))) < -3 ? -3 : Math.floor((val * multiplier) / (.33 * multiplier))
            }
        }

        var invertcolors = 0;
        // Inverting color scale
        if (invertcolors) {
            colorHold.reverse();
        }

        var x_elements = d3.set(data.map(function(item) { return item.year + "-" + item.month; })).values(),
            y_elements = d3.set(data.map(function(item) { return item.river; })).values();

        var xScale = d3.scaleBand()
            .domain(x_elements)
            .range([0, x_elements.length * itemSize])
            .paddingInner(20).paddingOuter(cellSize / 2)

        var xAxis = d3.axisBottom()
            .scale(xScale)
            .tickFormat(function(d) {
                return d;
            });

        var yScale = d3.scaleBand()
            .domain(y_elements)
            .range([0, y_elements.length * itemSize])
            .paddingInner(.2).paddingOuter(.2);

        var yAxis = d3.axisLeft()
            .scale(yScale)
            .tickFormat(function(d) {
                return d;
            });


        // // Finding the mean of the data
        // var mean_t = mean(data.map(function(d) { return +d.intensité }));

        // //setting percentage change for value w.r.t average
        // data.forEach(function(d) {
        //     d.perChange = (d.intensité - mean_t) / mean_t
        // })

        // function exportToJsonFile(jsonData) {
        //     let dataStr = JSON.stringify(jsonData);
        //     let dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        //     let exportFileDefaultName = 'data.json';

        //     let linkElement = document.createElement('a');
        //     linkElement.setAttribute('href', dataUri);
        //     linkElement.setAttribute('download', exportFileDefaultName);
        //     linkElement.click();
        // }

        // exportToJsonFile(data)

        colorScale = d3.scaleOrdinal()
            .domain([-3, -2, -1, 1, 2, 3])
            .range(colorHold);

        var rootsvg = d3.select('.heatmap')
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        var svg = rootsvg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // tooltip
        var tooltip = d3.select("body").append("div").style("width", "80px").style("height", "40px").style("background", "#C3B3E5")
            .style("opacity", "1").style("position", "absolute").style("visibility", "hidden").style("box-shadow", "0px 0px 6px #7861A5").style("padding", "10px");
        var toolval = tooltip.append("div");


        var cells = svg.selectAll('rect')
            .data(data)
            .enter().append('g').append('rect')
            .attr('class', 'cell')
            .attr('width', cellSize)
            .attr('height', cellSize)
            .attr('y', function(d) { return yScale(d.river); })
            .attr('x', function(d) { return xScale(d.dt) - cellSize / 2; })
            .attr('fill', function(d) { return colorScale(bandClassifier(d.perChange, 100)); })
            .attr("rx", 3)
            .attr("ry", 3)
            .on("mouseover", function(d) {
                //d3.select(this).attr("fill","#655091");
                d3.select(this).style("stroke", "orange").style("stroke-width", "3px")
                d3.select(".trianglepointer").transition().delay(100).attr("transform", "translate(" + (-((lPatchWidth / colorScale.range().length) / 2 + (colorScale.domain().indexOf(bandClassifier(d.perChange, 100)) * (lPatchWidth / colorScale.range().length)))) + ",0)");

                d3.select(".LegText").select("text").text(colorLText[colorScale.domain().indexOf(bandClassifier(d.perChange, 100))])


            })
            .on("mouseout", function() {
                //d3.select(this).attr('fill', function(d) { return colorScale(window.bandClassifier(d.perChange,100));});
                d3.select(this).style("stroke", "none");
                tooltip.style("visibility", "hidden");
            })
            .on("mousemove", function(d) {
                tooltip.style("visibility", "visible")
                    .style("top", (d3.event.pageY - 30) + "px").style("left", (d3.event.pageX + 20) + "px");

                console.log(d3.mouse(this)[0])
                tooltip.select("div").html("<strong>" + d.product + "</strong><br/> " + (+d.value).toFixed(2))

            })


        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .selectAll('text')
            .attr('font-weight', 'normal');

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (y_elements.length * itemSize + cellSize / 2) + ")")
            .call(xAxis)
            .selectAll('text')
            .attr('font-weight', 'normal')
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", "-.5em")
            .attr("transform", function(d) {
                return "rotate(-65)";
            });

        // Legends section


        legends = svg.append("g").attr("class", "legends")
            .attr("transform", "translate(" + ((width + margin.right) / 2 - lPatchWidth / 2 - margin.left / 2) + "," + (height + margin.bottom - 35 - 20) + ")");

        // Legend traingle pointer generator
        var symbolGenerator = d3.symbol()
            .type(d3.symbolTriangle)
            .size(64);

        legends.append("g").attr("transform", "rotate(180)").append("g").attr("class", "trianglepointer")
            .attr("transform", "translate(" + (-lPatchWidth / colorScale.range().length) / 2 + ")")
            .append("path").attr("d", symbolGenerator());
        //Legend Rectangels
        legends.append("g").attr("class", "LegRect")
            .attr("transform", "translate(0," + 15 + ")")
            .selectAll("rect").data(colorScale.range()).enter()
            .append("rect").attr("width", lPatchWidth / colorScale.range().length + "px").attr("height", "10px").attr("fill", function(d) { return d })
            .attr("x", function(d, i) { return i * (lPatchWidth / colorScale.range().length) })

        // legend text
        legends.append("g").attr("class", "LegText")
            .attr("transform", "translate(0,45)")
            .append("text")
            .attr("x", lPatchWidth / 2)
            .attr('font-weight', 'normal')
            .style("text-anchor", "middle")
            .text(colorLText[0])

        // Heading 
        rootsvg.append("g")
            .attr("transform", "translate(0,30)")
            .append("text")
            .attr("x", (width + margin.right + margin.left) / 2)
            .attr('font-weight', 'bold')
            .attr('font-size', '22px')
            .attr('font-family', 'Segoe UI bold')
            .style("text-anchor", "middle")
            .text("Sales Heatmap")


    });
}