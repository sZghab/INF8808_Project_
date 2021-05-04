export function setStationPopupHandler(map) {

    var popup = L.popup();
    d3.selectAll(".mycircle")
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
}
export function setHeatmapHandler() {
    // create a tooltip
    var Tooltip = d3.select(".heatmap")
        .append("div")
        .attr("class", "heatmaptooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position", "absolute")
        .style("visibility", "visible")

    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function(d) {
        Tooltip
            .style("opacity", 1)

        d3.select(this)
            .style("stroke", "black")
            .style("opacity", 1)

        d3.selectAll(".tick")
            .filter(function(datum) {
                return datum == d.year || datum == d.river
            })
            .style("font-weight", "bolder")
            .style("color", "red")
    }
    var mousemove = function(d) {
        Tooltip
            .html("<b> Lac d'eau: </b> " + d["river"] + " <br/><b>Année: </b>" + d["year"] + " <br/><b>Intensité: </b>" + d["intensité"])
            .style("top", (d3.event.pageY - 10) + "px")
            .style("left", (d3.event.pageX + 10) + "px");
    }
    var mouseleave = function(d) {
        Tooltip
            .style("opacity", 0)
        d3.select(this)
            .style("stroke", "none")
            .style("opacity", 0.8)

        d3.selectAll(".tick")
            .style("font-weight", "normal")
            .style("color", "black")
    }
    d3.select(".heatmap").selectAll("g >rect")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
}
export function setTechTreemapHandler() {
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

    d3.select("#canvasTreemap")
        .selectAll('.tile')
        .on('mouseover', (data) => {
            tooltip.transition()
                .style('visibility', 'visible')
            let revenue = Number(data['data']['value']).toFixed(2)
            tooltip.html(
                "<b> Type de traitement: </b>" + data['data']['name'] +
                "</br><b> Moyenne des volumes de débordements: </b>" + revenue + ' m³ '
            )
            tooltip.attr('data-value', Number(data['data']['value']).toFixed(2))

            d3.selectAll(".tile")
                .filter(function(datum) {
                    return datum['data']['name'] == data['data']['name']
                })
                .style("stroke", "black")

        })
        .on("mousemove", function() { return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px"); })
        .on('mouseout', (data) => {
            tooltip.transition()
                .style('visibility', 'hidden')

            d3.selectAll(".tile")
                .style("stroke", "none")

        })
}
export function setStepTreemapHandler() {
    var tooltip = d3.select("#canvasTreemap2")
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

    d3.select("#canvasTreemap2")
        .selectAll('.tile')
        .on('mouseover', (data) => {
            tooltip.transition()
                .style('visibility', 'visible')
            let revenue = Number(data['data']['value']).toFixed(2)
            tooltip.html(
                "<b> Station d'épuration: </b>" + data['data']['name'] +
                "</br><b> Volume des débordements: </b>" + revenue + ' m³ '
            )
            tooltip.attr('data-value', Number(data['data']['value']).toFixed(2))

            d3.selectAll(".tile")
                .filter(function(datum) {
                    return datum['data']['name'] == data['data']['name']
                })
                .style("stroke", "black")

        })
        .on("mousemove", function() { return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px"); })
        .on('mouseout', (data) => {
            tooltip.transition()
                .style('visibility', 'hidden')

            d3.selectAll(".tile")
                .style("stroke", "none")

        })
}
export function setStackedBarChartHandler(color) {
    // Prep the tooltip bits, initial display is hidden
    // create a tooltip
    var tooltip = d3.select("#stacked-bar-chart")
        .append("div")
        .attr("class", "heatmaptooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position", "absolute")
        .style("visibility", "visible")

    d3.select("#stacked-bar-chart")
        .selectAll("g>rect")
        .on("mouseover", function(d) {
            tooltip.style("display", null);
        })
        .on("mouseout", function() { tooltip.style("display", "none"); })
        .on("mousemove", function(d) {
            tooltip
                .html(
                    "<b> Date: </b> " + d.data["Group"] +
                    " <br/><span style='width: 15px; height: 15px; margin:0 5px; display: inline-block; border: 1px solid gray; vertical-align: middle; border-radius: 2px; background: " + color("Fonte des neiges") + "'></span><b>Fonte des neiges: </b>" + d.data["Fonte des neiges"] + " m<sup>3</sup>" +
                    " <br/><span style='width: 15px; height: 15px; margin:0 5px; display: inline-block; border: 1px solid gray; vertical-align: middle; border-radius: 2px; background: " + color("Pluie") + "'></span><b>Pluie: </b>" + d.data["Pluie"] + " m<sup>3</sup>" +
                    " <br/><span style='width: 15px; height: 15px; margin:0 5px; display: inline-block; border: 1px solid gray; vertical-align: middle; border-radius: 2px; background: " + color("Temps sec") + "'></span><b>Temps sec: </b>" + d.data["Temps sec"] + " m<sup>3</sup>" +
                    " <br/><span style='width: 15px; height: 15px; margin:0 5px; display: inline-block; border: 1px solid gray; vertical-align: middle; border-radius: 2px; background: " + color("Urgence") + "'></span><b>Urgence: </b>" + d.data["Urgence"] + " m<sup>3</sup>" +
                    " <br/><span style='width: 15px; height: 15px; margin:0 5px; display: inline-block; border: 1px solid gray; vertical-align: middle; border-radius: 2px; background: " + color("Réalisation de travaux planifiès") + "'></span><b>Réalisation de travaux planifiès: </b>" + d.data["Réalisation de travaux planifiès"] + " m<sup>3</sup>"
                )
                .style("top", (d3.event.pageY - 10) + "px")
                .style("left", (d3.event.pageX + 10) + "px");
        });


}
export function setBarChartHandler() {
    // Prep the tooltip bits, initial display is hidden
    // create a tooltip
    var tooltip = d3.select("#bar-chart")
        .append("div")
        .attr("class", "heatmaptooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position", "absolute")
        .style("visibility", "visible")

    d3.select("#bar-chart")
        .selectAll("g>rect")
        .on("mouseover", function(d) {
            tooltip.style("display", null);
        })
        .on("mouseout", function() { tooltip.style("display", "none"); })
        .on("mousemove", function(d) {
            tooltip
                .html(
                    "<b> Code catégorie de suivi: </b> " + d["code suivi"] +
                    " <br/> <b> Volume débordement: </b> " + d.value
                )
                .style("top", (d3.event.pageY - 10) + "px")
                .style("left", (d3.event.pageX + 10) + "px");
        });
}