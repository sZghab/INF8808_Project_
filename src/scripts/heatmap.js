import d3Legend from 'd3-svg-legend'

export function CreateHeatmap() {
    d3.csv("region_dt_intensite.csv").then(function(data) {

        var rivers = d3.nest()
            .key(function(d) { return d.river; })
            .entries(data);

        var river_names = []
        var years = [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019]
        rivers.forEach(element => {
            river_names.push(element.key)
        });

        var margin = ({ top: 30, right: 1, bottom: 100, left: 300 })
        var height = 11
        var innerHeight = height * rivers.length
        var width = 100 * years.length + margin.left + margin.right

        var yAxis = g => g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).tickSize(0))
            .call(g => g.select(".domain").remove())

        var xAxis = g => g
            .call(g => g.append("g")
                .attr("transform", `translate(0,${margin.top})`)
                .call(d3.axisTop(x).ticks(null, "d"))
                .call(g => g.select(".domain").remove()))

        var color = d3.scaleSequential(d3.interpolateYlGnBu).domain([0, d3.max(data, d => d["intensité"])])


        var y = d3.scaleBand()
            .domain(river_names)
            .range([margin.top, margin.top + innerHeight])

        var x = d3.scaleBand()
            .range([margin.left, width - margin.right])
            .domain(years)
            .padding(0.05);

        const svg = d3.select(".heatmap")
            .append("svg")
            .attr("height", "100%")
            .attr("width", "100%")

        svg.append("g")
            .call(yAxis);
        svg.append('g')
            .attr('class', 'x axis')

        d3.select('.x')
            .append("g")
            .call(xAxis)

        svg.append('g')
            .attr('class', 'y axis')

        svg.append("text") // text label for the x axis
            .attr("x", 265)
            .attr("y", 240)
            .style("text-anchor", "middle")
            .text("Date");
        // create a tooltip
        var Tooltip = svg.append("div")
            .attr("class", "heatmaptooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "visible")

        // Three function that change the tooltip when user hover / move / leave a cell
        var mouseover = function(d) {
            console.log(d)
            Tooltip
                .style("opacity", 1)
            d3.select(this)
                .style("stroke", "black")
                .style("opacity", 1)
        }
        var mousemove = function(d) {
            Tooltip
                .html("The exact value of<br>this cell is: " + d["intensité"])
                .style("left", (d3.mouse(this)[0] + 70) + "px")
                .style("top", (d3.mouse(this)[1]) + "px")
        }
        var mouseleave = function(d) {
            Tooltip
                .style("opacity", 0)
            d3.select(this)
                .style("stroke", "none")
                .style("opacity", 0.8)
        }

        svg.append("g")
            .selectAll("g")
            .data(data)
            .join("g")
            .attr("transform", (d, i) => { return `translate(0,${y(d.river)})` })
            .append("rect")
            .attr("x", (d, i) => { return x(d.year) + 1 })
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth() - 1)
            .attr("fill", d => isNaN(d["intensité"]) ? "#eee" : d["intensité"] === 0 ? "#fff" : color(d["intensité"]))
            .style("stroke-width", 4)
            .style("stroke", "none")
            .style("opacity", 0.8)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)

        svg.append("g")
            .attr("class", "legendSequential")
            .attr("transform", "translate(1250,100)");

        var legendSequential = d3Legend.legendColor()
            .shapeWidth(30)
            .cells(10)
            .orient("vertical")
            .scale(color)
            .labelAlign('start')
            .title('Légende')

        svg.select(".legendSequential")
            .call(legendSequential);

    });
}