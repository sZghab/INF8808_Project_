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
    // console.log(hierarchy)

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
        // .attr("fill",function(data) {
        //     console.log(data);
        //         console.log(data.parent.data.name);
        //         // for(var color in data.parent.data.name){console.log(color);}
        //         // console.log(data.parent.parent.children);
        //         // data.parent.parent.children.forEach( (child, i) => {
        //         //     console.log(i);
        //         // })
        //         // for(var child in data.parent.parent.children) {
        //         //     // console.log(indexOf(child));
        //         //     // console.log(child);
        //         // }
        //         // console.log(map.colorScale(data.parent.data.name));
        //         // return map.colorScale(data.parent.data.name)
        //     })
        .attr('fill', (data) => {
            let colorCategory = data.parent.data.name
            if(colorCategory === 'Très grande'){
                return '#bd0026'
            }else if(colorCategory === "Grande"){
                return '#f03b20'
            }else if(colorCategory === 'Moyenne'){
                return '#fd8d3c'
            }else if(colorCategory === 'Petite'){
                return '#fecc5c'
            }else if(colorCategory === 'Très petite'){
                return '#ffffb2'
            }
        })

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

            // d3.select('#tooltip2')
            //     .html(revenue + ' m³ ' + '<hr />' + data['data']['name'])
            //     .style('visibility', 'visible')
            //     .style('opacity',0.85)
            //     .style('left', (d3.event.pageX)+'px')
            //     .style('top', (d3.event.pageY)+'px')

            tooltip.html(
                revenue + ' m³ ' + '<hr />' + data['data']['name']
            )

            tooltip.attr('data-value', data['data']['value'])
        })
        .on('mouseout', (data) => {
            tooltip.transition()
                    .style('visibility', 'hidden')
                    // .style('left','-1000px')
                    // .style('opacity', 0)
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