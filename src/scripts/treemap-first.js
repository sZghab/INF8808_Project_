import d3Legend from 'd3-svg-legend'

export function firstTreemap(data) {

    // var height = 500
    // var width = 500
    // var color = d3.scaleOrdinal(d3.schemeCategory10)
    // var canvas = d3.select("#section3").append("svg")
    //                .attr("width",750)
    //                .attr("height",500)

    // //** d3.json("../assets/data/data_treemap1.json").then(function(data) {
    //     console.log(data);
    //     var treemapp = d3.treemap()
    //                            .size([width,height])
    //                            .paddingOuter(10)
    //                         //    .padding(2)
    //                         //    .nodes(data)
    //     d3.root.sum(function(d) { console.log(d.value); })
    //     treemapp((root))
    //         console.log(treemapp)

    //     var cells = canvas.selectAll(".cell")
    //                       .data(root.descendants())
    //                     //   .data(treemapp)
    //                       .enter()
    //                       .append("g")
    //                       .attr("class","cell")

    //     //**  return cells
    //     cells.append("rect")
    //         // .attr("x", function(d){return d.x})
    //         .attr('x', function(d) { return d.x0; })
    //         // .attr("y", function(d){return d.y})
    //         .attr('y', function(d) { return d.y0; })
    //         // .attr("width", function(d){return d.dx})
    //         .attr('width', function(d) { return d.x1 - d.x0; })
    //         // .attr("height", function(d){return d.dy})
    //         .attr('height', function(d) { return d.y1 - d.y0; })
    //         .attr("fill", function(d){return d.children ? null : color(d.parent.name) })
    //         .attr("stroke","#fff")

    //     // cells.append("text")
    //     //     .attr("x", function(d){return d.x + d.dx / 2 })
    //     //     .attr("y", function(d){return d.y + d.dy / 2 })
    //     //     .attr("text-anchor", "middle")
    //     //     .text(function (d) {return d.children ? null : d.name})

    // //**   })


    // var color = d3.scaleOrdinal(d3.schemeCategory10)
    // color(data['parent']['value'])

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
        .size([width - 120, height]).padding(2).round(true)
        (hierarchy)

    let dataTiles = hierarchy.leaves()
        // console.log(dataTiles)

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
        .domain(['Biofiltration', 'Boues activées', 'Disques biologiques', 'Dégrillage', 'Fosse septique', 'Étangs aérés', 'Étangs aérés à rétention réduite', 'Étangs non aérés', 'Physico-chimique'])
        .range(d3.schemeSet2);

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
        .attr('fill', (d) => color(d.parent.data.name))
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

            let revenue = data['data']['value'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")


            tooltip.html(
                revenue + 'm³ ' + '<hr />' + data['data']['name']
            )

            tooltip.attr('data-value', data['data']['value'])
        })
        .on("mousemove", function() { return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px"); })

    .on('mouseout', (data) => {
        tooltip.transition()
            .style('visibility', 'hidden')
    })


    canvas.append("g")
        .attr("class", "legendSequential")
        .attr("transform", "translate(0,0)");

    var legendSequential = d3Legend.legendColor()
        .shapeWidth(30)
        .cells(10)
        .orient("vertical")
        .scale(color)
        .labelAlign('start')
        .title('Légende')

    canvas.select(".legendSequential")
        .call(legendSequential);

}