import * as L from 'leaflet'

export function initMap() {
    /* Add leaflet map */
    var map = new L.Map("map", { center: [53.0, -60.0], zoom: 4 });
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    /* Add svg layer to the map */
    L.svg({ clickable: true }).addTo(map)

    return map
}

export function colorScale() {
    /* Scale */
    var color = d3.scaleOrdinal()
        .domain(['Très petite', 'Petite', 'Moyenne', 'Grande', 'Très grande'])
        .range(["#d0efff", "#2a9df4", "#187bcd", "#1167ba", "#03254c"]);
    return color
}

export function addLegend(map, color) {
    var legend = L.control({ position: 'bottomleft' });

    legend.onAdd = function(map) {

        var div = L.DomUtil.create('div', 'info legend'),
            grades = ['Très petite', 'Petite', 'Moyenne', 'Grande', 'Très grande'];
        div.innerHTML = "<h5> Taille des stations: </h5>"
            // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + color(grades[i]) + '"><div class="legend-text"> ' + grades[i] + '</div></i></br>'
        };
        return div;
    };

    legend.addTo(map);

}

export function addInfoPanel(map) {
    var info = L.control();

    info.onAdd = function(map) {
        this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
        this.update();
        return this._div;
    };

    // method that we will use to update the control based on feature properties passed
    info.update = function(props) {
        this._div.innerHTML = '<h4>US Population Density</h4>' + (props ?
            '<b>' + props.name + '</b><br />' + props.density + ' people / mi<sup>2</sup>' :
            'Hover over a state');
    };

    info.addTo(map);

}

export function drawCircles(data, map, color) {

    /* add the svg to leaflet map */
    var svg = d3.select("#map").select("svg"),
        g = svg.append("g");

    /* Remove old circles */
    g.selectAll("circle").remove();
    var popup = L.popup();
    /* Adding the circles with data */
    g.selectAll("circle")
        .data(data.features)
        .enter()
        .append("circle")
        .style("stroke", "black")
        .attr("stroke-width", 1)
        .style("opacity", 1)
        .style("fill", function(d) { return color(d.properties["taille"]) })
        .attr("cx", function(d) { return map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).x })
        .attr("cy", function(d) { return map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).y })
        .attr("r", 5)
        .attr("pointer-events", "visible")
        .on('mouseover', function(d) { //function to add mouseover event
            // Change the cursor style as a UI indicator.
            d3.select(this).style("cursor", "pointer");
            d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
                .duration('150') //how long we are transitioning between the two states (works like keyframes)
                .attr("fill", "red") //change the fill
                .attr('r', 10) //change radius
            var html = "<div style='width: 250px;'> <h3 class='data-label'> Station d'épuration </h3> <div class='step-label'>" + d.properties.name_step.replace("Station d'épuration de ", "").replace("Station d'épuration d'", "") +
                "</div> <div style='padding:0; margin-top:5px; margin-left:2px;'> <b> Lac principal: </b>" + d.properties.lac +
                "</div><div style='padding:0; margin-top:5px; margin-left:2px;'> <b> Bassin principal: </b>" + d.properties.nom_bassin + "</div><div class='line'> </div>" + "<div style='display: flex; flex-wrap: wrap;'>" +
                "<div class = 'popup33container'> <h3 class='data-label'> Débit de traitement </h3> <div class='label-popup-line2'>" +
                d.properties.débit + " m<sup>3</sup>/jour </div></div>" +
                "<div class = 'popup33container'> <h3 class='data-label'> Population conception </h3> <div class='label-popup-line2'>" +
                d.properties.population +
                "</div></div>" +
                "<div class = 'popup33container'> <h3 class='data-label'> DBO5C </h3> <div class='label-popup-line2'>" +
                d.properties.DBO5C +
                "</div></div>" +
                "<div class = 'popup33container'> <h3 class='data-label'> Type de traitement </h3> <div class='label-popup-line2'>" +
                d.properties.type_trait +
                "</div></div>" +
                "<div class = 'popup33container'> <h3 class='data-label'> Date mise en service </h3> <div class='label-popup-line2'>" +
                d.properties.dt_mise_service +
                "</div></div>" +
                "<div class = 'popup33container'> <h3 class='data-label'> Nombre d'ouvrages </h3> <div class='label-popup-line2'>" +
                d.properties.nb_os +
                "</div></div></div>"
            popup.setLatLng([d.geometry.coordinates[1], d.geometry.coordinates[0]]).setContent(html).openOn(map);

        })
        .on('mouseout', function() { //reverse the action based on when we mouse off the the circle
            d3.select(this).style("cursor", "default");

            d3.select(this).transition()
                .duration('150')
                .attr("fill", "steelblue")
                .attr('r', 5)

            popup.remove()
        });

    /* Function that update circle position if something change */
    function update() {
        /* Scale */

        d3.selectAll("circle")
            .attr("cx", function(d) { return map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).x })
            .attr("cy", function(d) { return map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).y })

    }
    // If the user change the map (zoom or drag), I update circle position:
    map.on("zoomend", update);
    update();

    function chart(d) {

        var feature = d;
        var data = feature.properties;

        var width = 300;
        var height = 80;
        var margin = { left: 20, right: 15, top: 40, bottom: 40 };
        var parse = d3.timeParse("%m");
        var format = d3.timeFormat("%b");

        var div = d3.create("div")
        var svg = div.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);
        var g = svg.append("g")
            .attr("transform", "translate(" + [margin.left, margin.top] + ")");

        var y = d3.scaleLinear()
            .domain([0, d3.max(data, function(d) { return d; })])
            .range([height, 0]);

        var yAxis = d3.axisLeft()
            .ticks(4)
            .scale(y);
        g.append("g").call(yAxis);

        var x = d3.scaleBand()
            .domain(d3.range(12))
            .range([0, width]);

        var xAxis = d3.axisBottom()
            .scale(x)
            .tickFormat(function(d) { return format(parse(d + 1)); });

        g.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)translate(-12,-15)")

        var rects = g.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("y", height)
            .attr("height", 0)
            .attr("width", x.bandwidth() - 2)
            .attr("x", function(d, i) { return x(i); })
            .attr("fill", "steelblue")
            .transition()
            .attr("height", function(d) { return height - y(d); })
            .attr("y", function(d) { return y(d); })
            .duration(1000);

        var title = svg.append("text")
            .style("font-size", "20px")
            .text(feature.properties.title)
            .attr("x", width / 2 + margin.left)
            .attr("y", 30)
            .attr("text-anchor", "middle");

        return div.node();

    }
}