export function createBar() {
    var colorPalette = d3.scaleLinear().domain([0, Object.keys(data).length - 1]).range(["#5dc1ae", "#a03d7c", "#a2f9ce"]);
    d3.json("bar.json", function(data) {
        const svg = d3.select("#barchart")
            .append("svg")
            .attr("height", "100%")
            .attr("width", "100%")

        let bars = svg.append("g").attr("transform", "translate(0, 0)");

        createTooltip();

        let categories = bars.selectAll(".bar")
            .data(stackedData)
            .enter()
            .append("g")
            .attr("class", "day")
            .attr("fill", (d, i) => colorPalette(i));

        categories
            .selectAll("rect")
            .data(function(d) { return d; })
            .enter()
            .append("rect")
            .attr("x", function(d) { return x(["Categorie de suivi"]); })
            .attr("width", x.rangeBand())
            .attr("y", function(d) { return y(d["volume de debaordement"]); })
            .attr("height", function(d) { return height - y(d["volume de debaordement"]); })
            .on("mouseenter", (d, i, nodes) => {
                let tooltip = d3.select("#tooltip");
                tooltip.style("opacity", 1);

                let keys = Object.keys(data[0]);

                let legend = keys.map((k, i) => {
                    let color = colorPalette(i);
                    return `
              <div style="margin-top:7px;margin-bottom:7px;">
              <div style="border-radius:8px;display:inline;margin-top:2px;width:13px;height:13px;position:absolute;background:${color};"></div>
              <div style="margin-left:22px;font-size:15px;">${k}: ${d.data[k]}</div>
              </div>
              `
                }).reverse().join("\n");

                d3.select("#tooltip-text").html(`<div>` + legend + `</div>`);

                let barPos = nodes[i].getBoundingClientRect();
                let tooltipWidth = tooltip.node().getBoundingClientRect().width;
                tooltip
                    .style("left", ((barPos.x + (barPos.width / 2)) - (tooltipWidth / 2)) + "px")
                    .style("top", (d3.event.pageY - 160) + "px");

            })
            .on("mouseleave", () => {
                console.log("LEAVE");
                d3.select("#tooltip").style("opacity", 0);
            });
    })
}


function tmp() {
    var margin = { top: 20, right: 20, bottom: 70, left: 40 },
        width = 600 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;


    var x = d3.scaleOrdinal()
        .domain([0, width], .05);

    var y = d3.scaleLinear().range([height, 0]);

    var xAxis = d3.axisBottom(x).tickFormat(function(d) { return d.x; });

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(10);

    var svg = d3.select(".bar").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    d3.json("bar.json", function(data) {


        x.domain(data.map(function(d) { return d["Categorie de suivi"]; }));
        y.domain([0, d3.max(data, function(d) { return d["volume de debaordement"]; })]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", "-.55em")
            .attr("transform", "rotate(-90)");

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Value ($)");

        svg.selectAll("bar")
            .data(data)
            .enter().append("rect")
            .style("fill", "steelblue")
            .attr("x", function(d) { return x(["Categorie de suivi"]); })
            .attr("width", x.rangeBand())
            .attr("y", function(d) { return y(d["volume de debaordement"]); })
            .attr("height", function(d) { return height - y(d["volume de debaordement"]); });

    });
}