'use strict'
import d3Legend from 'd3-svg-legend'

import * as helper from './scripts/helper.js'
import * as preproc from './scripts/preprocess_mine.js'
import * as viz from './scripts/viz.js'
import * as legend from './scripts/legend.js'
import * as hover from './scripts/hover.js'
import * as util from './scripts/util.js'

import * as first_treemap from './scripts/treemap-first'
import * as second_treemap from './scripts/treemap-second'

import * as d3Chromatic from 'd3-scale-chromatic'

(function(d3) {

    /**
     * Initialiser La carte géographique
     */
    var map;
    d3.json("quebec.geojson", d3.autoType).then(function(data) {
        map = viz.initMap()
    });

    /**
     * La carte géographique des stations d'épurations
     */
    var data, rawData;

    var colorStep = viz.setColorScale()

    var legendStep = legend.addStationMapLegend(map, colorStep)

    d3.json('./step.geojson', d3.autoType).then(function(collection) {

        /* Preprocess get municipalité et région */
        rawData = collection.features;
        data = rawData;

        /* Initialiser les données des filtres de régions et municipalités */
        viz.initFilters(rawData)
        console.log(rawData)

        legendStep.addTo(map);

        viz.drawCircles(map, colorStep, rawData)
        hover.setStationPopupHandler(map)
        initCheckboxStep(legendStep, map, colorStep, data)
    });

    /**
     * La carte choroplèthe des intensités des surverses par municipalité
     */
    var rawGroupByRegion, groupByRegion, info, mrcs, geojson, legendmap;
    d3.csv("./region_dt_intensite.csv", d3.autoType).then(function(tmp) {
        groupByRegion = rawGroupByRegion = preproc.groupIntensiteByMunicipalite(tmp)

        d3.json("municipalite.geojson", d3.autoType).then(function(collection) {
            mrcs = collection
            info = viz.addInfoPanel(map, groupByRegion)

            geojson = viz.drawChoropleth(map, info, collection, groupByRegion)
            legendmap = legend.addChoroplethMapLegend(map)

            geojson.addTo(map);
            legendmap.addTo(map);


            initCheckboxChoropleth(map, geojson, legendmap)
            initSelectRegion(rawData, data, map, colorStep)
            initSelectMrc(rawData, rawGroupByRegion, mrcs, map, colorStep, geojson, legendmap, info)
        });

    });

    function initCheckboxStep() {
        d3.select("#cb_step").on("change",
            function(d) {
                if (d3.select("#cb_step").property("checked")) {
                    viz.drawCircles(map, colorStep, rawData)
                    hover.setStationPopupHandler(map)
                    legendStep.addTo(map);

                } else {
                    d3.selectAll("circle").remove();
                    legendStep.remove();
                }
            });
    }

    function initCheckboxChoropleth() {
        d3.select("#cb_choropleth").on("change",
            function(d) {
                if (d3.select("#cb_choropleth").property("checked")) {
                    geojson.addTo(map);
                    legendmap.addTo(map);
                } else {
                    geojson.remove();
                    legendmap.remove();
                }
            });

    }

    function initSelectRegion() {
        return d3.select("#region").on("change",
            function() {
                if (d3.select("#region").property("value") == "all") {
                    data = rawData
                } else {
                    data = rawData.filter(function(el) {
                        return el.properties.region == d3.select("#region").property("value")
                    });

                }
                viz.drawCircles(map, colorStep, data)
                hover.setStationPopupHandler(map)
            })
    }

    function initSelectMrc() {
        d3.select("#mrc").on("change",
            function() {

                var data, collection;

                if (d3.select("#mrc").property("value") == "all") {
                    data = rawData
                    collection = mrcs
                } else {
                    data = rawData.filter(function(el) {
                        return el.properties.municipalite == d3.select("#mrc").property("value")
                    });

                    collection = mrcs.features.filter(function(el) {
                        return el.properties.Municipalite == d3.select("#mrc").property("value")
                    });
                }

                viz.drawCircles(map, colorStep, data)
                hover.setStationPopupHandler(map)
                geojson.remove();
                legendmap.remove();

                geojson = viz.drawChoropleth(map, info, collection, rawGroupByRegion)
                legendmap = legend.addChoroplethMapLegend(map)

                geojson.addTo(map);
                legendmap.addTo(map);

            })
    }


    /**
     * Création du line chart des volumes de débordements
     */
    d3.csv('./volume.csv', d3.autoType).then(function(data) {
        var tmp = preproc.groupVolumeByYear(data)
        viz.drawVolumeLineChart(tmp)
    })

    /**
     * Création de la heatmap des riviéres
     */
    d3.csv("./river_dt_intensite.csv").then(function(data) {
        viz.drawRiversHeatmap(data)
    });

    /**
     * 
     */
    d3.json("data_treemap1.json").then(function(data) {
        first_treemap.firstTreemap(data);
    })

    d3.json("data_treemap2.json").then(function(data) {
        second_treemap.secondTreemap(data);
    })

    d3.csv("stacked.csv").then(
        function(data) {
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

            // Prep the tooltip bits, initial display is hidden
            // create a tooltip
            var tooltip = d3.select("#stacked-bar-chart")
                .append("div")
                .attr("class", "heatmaptooltip")
                .style("background-color", "white")
                .style("border", "solid")
                .style("border-width", "2px")
                .style("border-radius", "5px")
                .style("padding", "5px")
                .style("position", "absolute")
                .style("visibility", "visible")


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
                .attr("transform", "translate(150,-20)")
                .on("mouseover", function(d) {
                    tooltip.style("display", null);
                })
                .on("mouseout", function() { tooltip.style("display", "none"); })
                .on("mousemove", function(d) {
                    tooltip
                        .html(
                            "<b> Date: </b> " + d.data["Group"] +
                            " <br/><span style='width: 15px; height: 15px; margin:0 5px; display: inline-block; border: 1px solid gray; vertical-align: middle; border-radius: 2px; background: " + color("Fonte des neiges") + "'></span><b>Fonte des neiges: </b>" + d.data["Fonte des neiges"] + " m<sup>3</sup>" +
                            " <br/><span style='width: 15px; height: 15px; margin:0 5px; display: inline-block; border: 1px solid gray; vertical-align: middle; border-radius: 2px; background: " + color("Pluie") + "'></span><b>Pluie: </b>" + d.data["Pluie"] + " m<sup>3</sup>" +
                            " <br/><span style='width: 15px; height: 15px; margin:0 5px; display: inline-block; border: 1px solid gray; vertical-align: middle; border-radius: 2px; background: " + color("Temps sec") + "'></span><b>Temps sec: </b>" + d.data["Temps sec"] + " m<sup>3</sup>" +
                            " <br/><span style='width: 15px; height: 15px; margin:0 5px; display: inline-block; border: 1px solid gray; vertical-align: middle; border-radius: 2px; background: " + color("Urgence") + "'></span><b>Urgence: </b>" + d.data["Urgence"] + " m<sup>3</sup>" +
                            " <br/><span style='width: 15px; height: 15px; margin:0 5px; display: inline-block; border: 1px solid gray; vertical-align: middle; border-radius: 2px; background: " + color("Réalisation de travaux planifiès") + "'></span><b>Réalisation de travaux planifiès: </b>" + d.data["Réalisation de travaux planifiès"] + " m<sup>3</sup>"
                        )
                        .style("top", (d3.event.pageY - 10) + "px")
                        .style("left", (d3.event.pageX + 10) + "px");
                });

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


        })

    d3.csv("suivi.csv").then(
        function(data) {
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
                .append("text")
                .style("text-anchor", "middle")
                .style("font-size", "18px")
                .text("Date de débordement")
                .attr("transform", "translate(-10,-10)")

            g.append("g")
                .call(d3.axisLeft(yScale).tickFormat(function(d) {
                        return d;
                    })
                    .ticks(10))
                .attr("transform", "translate(150,-20)")
                .attr("width", 100)
                .append("text")
                .attr("y", 6)
                .attr("dy", "-5.1em")
                .attr("text-anchor", "end")
                .attr("stroke", "black")
                .text("Volume (m3)")
                .attr("transform", "translate(" + (-margin.left + 5) + "," + height / 2 + ")rotate(-90)");
            // Prep the tooltip bits, initial display is hidden
            // create a tooltip
            var tooltip = d3.select("#bar-chart")
                .append("div")
                .attr("class", "heatmaptooltip")
                .style("background-color", "white")
                .style("border", "solid")
                .style("border-width", "2px")
                .style("border-radius", "5px")
                .style("padding", "5px")
                .style("position", "absolute")
                .style("visibility", "visible")

            g.selectAll(".bar")
                .data(data)
                .enter().append("rect")
                .attr("x", function(d) { return xScale(d["code suivi"]); })
                .attr("y", function(d) { return yScale(d.value); })
                .attr("width", xScale.bandwidth())
                .attr("height", function(d) { return height - yScale(d.value); })
                .attr("transform", "translate(150,-20)")
                .attr("fill", "#2a9df4")
                .on("mouseover", function(d) {
                    tooltip.style("display", null);
                })
                .on("mouseout", function() { tooltip.style("display", "none"); })
                .on("mousemove", function(d) {
                    tooltip
                        .html(
                            "<b> Code catégorie de suivi: </b> " + d["code suivi"] +
                            " <br/> <b> Volume débordement: </b> " + d.value
                        )
                        .style("top", (d3.event.pageY - 10) + "px")
                        .style("left", (d3.event.pageX + 10) + "px");
                });

            var legendsvg = d3.select("#bar-chart")
                .append("svg")
                .attr("width", "15%")
                .attr("height", "100%")


            legendsvg.append("g")
                .append("text")
                .text("les ")
        });



})(d3)