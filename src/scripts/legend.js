import * as L from 'leaflet'
import * as viz from './viz.js'
import d3Legend from 'd3-svg-legend'

export function addStationMapLegend(map, color) {
    var legend = L.control({ position: 'bottomleft' });

    legend.onAdd = function(map) {
        var div = L.DomUtil.create('div', 'info legend'),
            grades = ['Très petite', 'Petite', 'Moyenne', 'Grande', 'Très grande'];
        div.innerHTML = "<h5> Les tailles des stations: </h5>"
            // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + color(grades[i]) + '"><div class="legend-text"> ' + grades[i] + '</div></i></br>'
        };
        return div;
    };

    return legend
}


export function addChoroplethMapLegend(map) {
    var legend = L.control({ position: 'bottomleft' });

    legend.onAdd = function(map) {
        var div = L.DomUtil.create('div', 'info legend'),
            grades = [NaN, 10000, 100000, 200000, 300000, 400000, 500000, 600000];
        div.innerHTML = "<h5> Intensité des surverses: </h5>"
            // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            if (grades[i] == NaN) {
                div.innerHTML +=
                    '<i style="background: #ccc"><div class="legend-text"> ' + grades[i] + '</div></i></br>'
            } else {

                div.innerHTML +=
                    '<i style="background:' + viz.getColor(grades[i]) + '"><div class="legend-text"> ' + grades[i] + '</div></i></br>'
            }
        };
        return div;
    };

    return legend
}

export function addHeatmapLegend(svg, color) {

    svg.append("g")
        .attr("class", "legendSequential")
        .attr("transform", "translate(1250,100)");

    var legendSequential = d3Legend.legendColor()
        .shapeWidth(30)
        .cells(10)
        .orient("vertical")
        .scale(color)
        .labelAlign('start')
        .title('Les intensités des débordements:')

    svg.select(".legendSequential")
        .call(legendSequential);
}

export function addTreemapLegend(canvas, color) {
    canvas.append("g")
        .attr("class", "legendSequential")
        .attr("transform", "translate(0,0)");

    var legendSequential = d3Legend.legendColor()
        .shapeWidth(30)
        .cells(10)
        .orient("vertical")
        .scale(color)
        .labelAlign('start')
        .title("Classe de traitement:")

    canvas.select(".legendSequential")
        .call(legendSequential);

}