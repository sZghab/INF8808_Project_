import * as map from '../scripts/map'

export function secondTreemap(data){


    // var color = d3.scaleOrdinal(d3.schemeCategory10)
    // color(data['parent']['value'])

    var canvas = d3.select("#canvasTreemap2")
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
        .size([width,height]).padding(2).round(true)
        (hierarchy)
    
    let dataTiles = hierarchy.leaves()
    console.log(hierarchy)

    let block = canvas.selectAll('g')
                .data(dataTiles)
                .enter()
                .append('g')
                .attr('transform', (data) => {
                    return 'translate (' + data['x0'] + ', ' + data['y0'] +')'
                })

    let tooltip = d3.select('#tooltip2')

    block.append('rect')
        .attr('class', 'tile')
        // .attr("fill",function(data) { var i=0; for(i=0;i<=4;i++) { return map.color(data.data.children[i].name) } })
        // .attr('fill', (data) => {
        //     let category = data['parent']['data']['name']
        //     if(category === 'Autres'){
        //         return 'orange'
        //     }else if(category === "Biofiltration"){
        //         return 'lightgreen'
        //     }else if(category === 'Boues activées'){
        //         return 'crimson'
        //     }else if(category === 'Disques biologiques'){
        //         return 'steelblue'
        //     }else if(category === 'Dégrillage'){
        //         return 'pink'
        //     }else if(category === 'Fosse septique'){
        //         return 'khaki'
        //     }else if(category === 'Étangs aérés'){
        //         return 'green'
        //     }else if(category === 'Étangs aérés à rétention réduite'){
        //         return 'yellow'
        //     }else if(category === 'Étangs non aérés'){
        //         return 'grey'
        //     }else if(category === 'Physico-chimique'){
        //         return 'purple'
        //     }
        // })

        // .attr('child-name', (data) => {
        //     return data['data']['name']
        // })
        // .attr('parent-name', (data) => {
        //     return data['parent']['data']['name']
        // })
        // .attr('child-value', (data) => {
        //     return data['data']['value']
        // })
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
                revenue + ' m³ ' + '<hr />' + data['data']['name']
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