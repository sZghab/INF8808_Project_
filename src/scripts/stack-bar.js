export function CreateBar() {
    var svg = d3.select("#svgID"),
        margin = { top: 80, right: 140, bottom: 100, left: 100 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var padding = -100;
    //set the ranges
    var x = d3.scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.20)
        .align(0.1);

    var y = d3.scaleLinear()
        .rangeRound([height, 0]);

    var z = d3.scaleOrdinal()
        .range(["#008000", "#C00000", "#404040", "#4d4d4d", "#383867", "#584c77"]);

    var data = d3.select("#svgID").data("values");

    var keys = ["Autre Contexte", "Fonte de Neiges", "Pluie", "Temps Sec", "Urgence", "R�alisation des Travaux Planifi�s"];

    var legendKeysbar = ["Autre Contexte", "Fonte de Neiges", "Pluie", "Temps Sec", "Urgence", "R�alisation des Travaux Planifi�s"];
    var legendColorsbar = d3.scaleOrdinal()
        .range(["#008000", "#C00000", "#404040", "#4d4d4d", "#383867", "#584c77"]);

    // Scale the range of the data
    x.domain(data.map(function(d) {
        return d.mois;
    }));
    y.domain([0, d3.max(data, function(d) {
        return d.volume_de_debordement;
    })]).nice();
    z.domain(keys);

    // add the Y gridlines
    g.append("g").selectAll(".hline").data(y.ticks(10)).enter()
        .append("svg:line")
        .attr("x1", 0)
        .attr("y1", function(d) { return y(d); })
        .attr("x2", width)
        .attr("y2", function(d) { return y(d); })
        .style("stroke", "white")
        .style("stroke-width", 1);

    // append the rectangles for the bar chart
    g.append("g")
        .selectAll("g")
        .data(d3.stack().keys(keys)(data))
        .enter().append("g")
        .attr("fill", function(d) {
            return z(d.key);
        })
        .selectAll("rect")
        .data(function(d) {
            return d;
        })
        .enter().append("rect")
        .attr("x", function(d) {
            return x(d.data.mois);
        })
        .attr("y", function(d) {
            return y(d[1]);
        })
        .attr("height", function(d) {
            return y(d[0]) - y(d[1]);
        })
}