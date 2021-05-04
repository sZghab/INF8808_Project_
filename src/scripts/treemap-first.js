import d3Legend from 'd3-svg-legend'

export function firstTreemap(data) {
    var canvas = d3.select("#canvasTreemap")
        .append("svg")
        .attr("width", "700px")
        .attr("height", "70%")

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

    var color = d3.scaleOrdinal()
        .domain(['Autres', 'Biofiltration', 'Boues activées', 'Dégrillage', 'Disques biologiques', 'Étangs aérés (EA.)', 'EA. à rétention réduite', 'Étangs non aérés', 'Fosse septique', 'Physico-chimique'])
        .range(d3.schemeTableau10);

    var legendSequential = d3Legend.legendColor()
        .shapeWidth(30)
        .cells(10)
        .orient("vertical")
        .scale(color)
        .labelAlign('start')
        .title('Légende')

    canvas.select(".legendSequential")
        .call(legendSequential);

    var tooltip = d3.select("#canvasTreemap")
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("font-size", "15px")
        .html("<p>I'm a tooltip written in HTML</p>");

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
        .attr('stroke', 'white')
        .on('mouseover', (data) => {
            tooltip.transition()
                .style('visibility', 'visible')

            let revenue = Number(data['data']['value']).toFixed(2)


            tooltip.html(
                "<b> Type de traitement: </b>" + data['data']['name'] +
                "</br><b> Moyenne des volumes de débordements: </b>" + revenue + ' m³ '
            )

            tooltip.attr('data-value', Number(data['data']['value']).toFixed(2))
        })
        .on("mousemove", function() { return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px"); })
        .on('mouseout', (data) => {
            tooltip.transition()
                .style('visibility', 'hidden')
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