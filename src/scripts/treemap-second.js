import * as map from '../scripts/map'
import d3Legend from 'd3-svg-legend'

export function secondTreemap(data) {


    // var color = d3.scaleOrdinal(d3.schemeCategory10)
    // color(data['parent']['value'])

    var canvas = d3.select("#canvasTreemap2")
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
        .size([width - 120, height]).padding(2).round(true)
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
        .attr("transform", "translate(" + (width - 120) + ", 20 )");

    var color = d3.scaleOrdinal()
        .domain(['Très petite', 'Petite', 'Moyenne', 'Grande', 'Très grande'])
        .range(["#d0efff", "#2a9df4", "#187bcd", "#1167ba", "#03254c"]);

    var legendSequential = d3Legend.legendColor()
        .shapeWidth(30)
        .cells(10)
        .orient("vertical")
        .scale(color)
        .labelAlign('start')
        .title('Légende')

    canvas.select(".legendSequential")
        .call(legendSequential);

    var tooltip2 = d3.select("#canvasTreemap2")
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
        .attr("fill", d => color(d.parent.data.name))
        .attr("fill-opacity", 0.8)
        .attr('width', (data) => {
            return data['x1'] - data['x0']
        })
        .attr('height', (data) => {
            return data['y1'] - data['y0']
        })
        .attr('stroke', 'white')

    .on('mouseover', (data) => {
            tooltip2.style("visibility", "visible");
            tooltip2.transition()
                .style('visibility', 'visible')



            let revenue = data['data']['value'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")

            // d3.select('#tooltip2')
            //     .html(revenue + ' m³ ' + '<hr />' + data['data']['name'])
            //     .style('visibility', 'visible')
            //     .style('opacity',0.85)
            //     .style('left', (d3.event.pageX)+'px')
            //     .style('top', (d3.event.pageY)+'px')

            tooltip2.html(
                revenue + ' m³ ' + '<hr />' + data['data']['name']
            )

            tooltip2.attr('data-value', data['data']['value'])
        })
        .on("mousemove", function() { return tooltip2.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px"); })
        .on('mouseout', (data) => {
            tooltip2.style("visibility", "hidden")
            tooltip.transition()
                .style('visibility', 'hidden')
        })

    var format = d3.format(",d")
    var kx = width / root.dx,
        ky = height / 1;

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

}