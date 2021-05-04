export function groupIntensiteByMunicipalite(data) {
    var values = []
    var groupByRegion = d3.nest()
        .key(function(d) { return d["MUNICIPALITÉ"]; })
        .rollup(function(v) { return d3.mean(v, function(d) { return d["intensité"]; }); })
        .entries(data);

    groupByRegion.forEach((d) => values.push(d.value))
    return groupByRegion
}

export function groupVolumeByYear(data) {
    data.forEach(function(d) {
        d.year_month = d["Date de début du débordement"].getFullYear() + "-" + d["Date de début du débordement"].getMonth().toString().padStart(2, "0");
    })
    var parseTime = d3.timeParse("%Y-%m");
    var groupByYear = d3.nest()
        .key(function(d) { return d.year_month; })
        .rollup(function(v) { return d3.mean(v, function(d) { return d["Volume de débordement (m³)"]; }); })
        .entries(data);

    var tmp = []
        // format month as a date
    groupByYear.forEach(function(d) {
        if (parseTime(d.key).getFullYear() > 2016) {
            tmp.push({ "key": parseTime(d.key), "value": d.value })
        }
    });
    return tmp
}

export function getRiverAndYears(data) {
    var rivers = d3.nest()
        .key(function(d) { return d.river; })
        .rollup(function(v) { return d3.mean(v, function(d) { return d["intensité"]; }); })
        .entries(data);

    rivers.sort(function(a, b) {
        return parseFloat(a.value) - parseFloat(b.value);
    });
    var river_names = []

    rivers.forEach(element => {
        river_names.push(element.key)
    });
    return river_names;

}