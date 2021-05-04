'use strict'
import * as preproc from './scripts/preprocess.js'
import * as viz from './scripts/viz.js'
import * as legend from './scripts/legend.js'
import * as hover from './scripts/hover.js'

(function(d3) {

    /* Initialiser La carte géographique */
    var map = viz.initMap()

    /* La carte géographique des stations d'épurations */
    var data, rawData;
    var colorStep = viz.setColorScale()
    var legendStep = legend.addStationMapLegend(map, colorStep)

    d3.json('./step.geojson', d3.autoType).then(function(collection) {
        rawData = data = collection.features;
        /* Initialiser les données des filtres de régions et municipalités */
        viz.initFilters(rawData)
        initCheckboxStep()
    });

    /* La carte choroplèthe des intensités des surverses par municipalité */
    var rawGroupByRegion, groupByRegion, info, rawMrcs, mrcs, geojson, legendmap;
    d3.csv("./region_dt_intensite.csv", d3.autoType).then(function(tmp) {
        groupByRegion = rawGroupByRegion = preproc.groupIntensiteByMunicipalite(tmp)
        d3.json("municipalite.geojson", d3.autoType).then(function(collection) {
            rawMrcs = mrcs = collection
            info = viz.addInfoPanel(map, groupByRegion)
            geojson = viz.drawChoropleth(map, info, rawMrcs, groupByRegion)
            legendmap = legend.addChoroplethMapLegend(map)
            geojson.addTo(map);
            legendmap.addTo(map);
            initCheckboxChoropleth()
            initSelectRegion()
            initSelectMrc()
        });

    });

    function initCheckboxStep() {
        d3.select("#cb_step").on("change",
            function(d) {
                if (d3.select("#cb_step").property("checked")) {
                    viz.drawCircles(map, colorStep, data)
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
                    mrcs = rawMrcs.features
                    d3.select("#region").selectAll("option").remove()
                    d3.select("#mrc").selectAll("option").remove()
                    viz.initFilters(rawData)
                } else {
                    data = rawData.filter(function(el) {
                        return el.properties.region == d3.select("#region").property("value")
                    });

                    var tmp = [...new Map(data.map((x) => [x.properties["municipalite"], { "mrc": x.properties["municipalite"], "region": x.properties["region"] }])).values()];
                    var mrc = [...new Map(tmp.map((x) => [x.mrc, x.mrc])).values()].sort();

                    mrcs = rawMrcs.features.filter(function(el) {
                        return mrc.includes(el.properties.Municipalite)
                    });

                    d3.select("#mrc").selectAll("option").remove()
                    viz.initFilters(data)
                }
                if (d3.select("#cb_step").property("checked")) {
                    viz.drawCircles(map, colorStep, data)
                    hover.setStationPopupHandler(map)
                }
                if (d3.select("#cb_choropleth").property("checked")) {
                    geojson.remove();
                    legendmap.remove();
                    geojson = viz.drawChoropleth(map, info, mrcs, rawGroupByRegion)
                    legendmap = legend.addChoroplethMapLegend(map)
                    geojson.addTo(map);
                    legendmap.addTo(map);
                }

            })
    }

    function initSelectMrc() {
        d3.select("#mrc").on("change",
            function() {
                if (d3.select("#mrc").property("value") == "all") {
                    data = rawData
                    mrcs = rawMrcs
                    d3.select("#region").selectAll("option").remove()
                    d3.select("#mrc").selectAll("option").remove()
                    viz.initFilters(rawData)
                } else {
                    data = rawData.filter(function(el) {
                        return el.properties.municipalite == d3.select("#mrc").property("value")
                    });
                    console.log(mrcs)
                    mrcs = rawMrcs.features.filter(function(el) {
                        return el.properties.Municipalite == d3.select("#mrc").property("value")
                    });
                    d3.select("#region").selectAll("option").remove()
                    viz.initFilters(data)
                }

                if (d3.select("#cb_step").property("checked")) {
                    viz.drawCircles(map, colorStep, data)
                    hover.setStationPopupHandler(map)
                }
                if (d3.select("#cb_choropleth").property("checked")) {
                    geojson.remove();
                    legendmap.remove();
                    geojson = viz.drawChoropleth(map, info, mrcs, rawGroupByRegion)
                    legendmap = legend.addChoroplethMapLegend(map)
                    geojson.addTo(map);
                    legendmap.addTo(map);
                }


            })
    }

    /* Création du line chart des volumes de débordements */
    d3.csv('./volume.csv', d3.autoType).then(function(data) {
        var tmp = preproc.groupVolumeByYear(data)
        viz.drawVolumeLineChart(tmp)
    })

    viz.setTooltip("map_myicon", "map_mypopup");

    /* Création de la heatmap des riviéres */
    d3.csv("./river_dt_intensite.csv").then(function(data) {
        var years = [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019]
        var river_names = preproc.getRiverAndYears(data)
        const svg = d3.select(".heatmap")
            .append("svg")
            .attr("height", "100%")
            .attr("width", "100%")
        var color = d3.scaleSequential(d3.interpolateReds)
            .domain([0, 600000])
            .unknown("#ccc");
        viz.drawRiversHeatmap(svg, color, river_names, years, data)
        hover.setHeatmapHandler()
        legend.addHeatmapLegend(svg, color)
    });

    viz.setTooltip("heat_myicon", "heat_mypopup");

    /* Création de la treemap des volumes par technique d'épuration*/
    d3.json("vol_par_technique.json").then(function(data) {
        var color = d3.scaleOrdinal()
            .domain(['Autres', 'Biofiltration', 'Boues activées', 'Dégrillage', 'Disques biologiques', 'Étangs aérés (EA.)', 'EA. à rétention réduite', 'Étangs non aérés', 'Fosse septique', 'Physico-chimique'])
            .range(d3.schemeTableau10);
        var canvas = d3.select("#canvasTreemap")
            .append("svg")
            .attr("width", "700px")
            .attr("height", "70%")
        viz.drawVolPerTechTreemap(data, color, canvas);
        legend.addTreemapLegend(canvas, color);
        hover.setTechTreemapHandler()
    })

    /* Création de la treemap des volumes par station d'épuration */
    d3.json("vol_par_step.json").then(function(data) {
        var color = d3.scaleOrdinal()
            .domain(['Très petite', 'Petite', 'Moyenne', 'Grande', 'Très grande'])
            .range(["#d0efff", "#2a9df4", "#187bcd", "#1167ba", "#03254c"]);

        var canvas = d3.select("#canvasTreemap2")
            .append("svg")
            .attr("width", "700px")
            .attr("height", "70%")

        viz.drawVolPerStepTreemap(data, color, canvas);
        legend.addTreemapLegend(canvas, color);
        hover.setStepTreemapHandler()
    })

    viz.setTooltip("tree_myicon", "tree_mypopup");

    /* Création du stacked bar chart des volumes par contexte de surverse */
    d3.csv("stacked.csv").then(
        function(data) {
            // List of subgroups = header of the csv files = soil condition here
            var subgroups = data.columns.slice(1)
            var color = d3.scaleOrdinal()
                .domain(subgroups)
                .range(d3.schemeTableau10)
            viz.drawStackedBarChart(data, color)
            hover.setStackedBarChartHandler(color)

            viz.setTooltip("stacked_bar_myicon", "stacked_bar_mypopup");
        })

    /* Création du bar chart des volumes par code de catégorie de suivi */
    d3.csv("suivi.csv").then(
        function(data) {
            viz.drawBarChart(data)
            hover.setBarChartHandler()
            viz.setTooltip("bar_myicon", "bar_mypopup");
        });

})(d3)