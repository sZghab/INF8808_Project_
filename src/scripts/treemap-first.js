

export function firstTreemap(data){

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
                //    .append("svg")
                //    .attr("width",2000)
                //    .attr("height",1700)
                .attr("width", "75%")
                .attr("height", "75%")

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
        .size([width*0.99,height*0.99]).padding(2).round(true)
        (hierarchy)
    
    let dataTiles = hierarchy.leaves()
    console.log(dataTiles)

    let block = canvas.selectAll('g')
                .data(dataTiles)
                .enter()
                .append('g')
                .attr('transform', (data) => {
                    return 'translate (' + data['x0'] + ', ' + data['y0'] +')'
                })

    let tooltip = d3.select('#tooltip')

    block.append('rect')
        .attr('class', 'tile')
        .attr('fill', (data) => {
            let category = data['parent']['data']['name']
            if(category === 'Autres'){
                return 'orange'
            }else if(category === "Biofiltration"){
                return 'lightgreen'
            }else if(category === 'Boues activées'){
                return 'crimson'
            }else if(category === 'Disques biologiques'){
                return 'steelblue'
            }else if(category === 'Dégrillage'){
                return 'pink'
            }else if(category === 'Fosse septique'){
                return 'khaki'
            }else if(category === 'Étangs aérés'){
                return 'green'
            }else if(category === 'Étangs aérés à rétention réduite'){
                return 'yellow'
            }else if(category === 'Étangs non aérés'){
                return 'grey'
            }else if(category === 'Physico-chimique'){
                return 'purple'
            }
        })
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
        .attr('stroke', 'black')

        .on('mouseover', (data) => {
            tooltip.transition()
                    .style('visibility', 'visible')

            let revenue = data['data']['value'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")


            tooltip.html(
                revenue + 'm³ ' + '<hr />' + data['data']['name']
            )

            tooltip.attr('data-value', data['data']['value'])
        })
        .on('mouseout', (data) => {
            tooltip.transition()
                    .style('visibility', 'hidden')
        })


    // block.append('text')
    //     .attr('x', 5)
    //     .attr('y', 20)
    //     // .attr("x", 3)
    //     // .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
    //     // .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
    //     .text((data) => {
    //         return data['data']['name']
    //    })
    //    .attr("text-anchor", "middle")
       
  }