export function setStationPopupHandler(map) {

    var popup = L.popup();
    d3.selectAll("circle")
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