/**
 * Gets the names of the neighborhoods.
 *
 * @param {object[]} data The data to analyze
 * @returns {string[]} The names of the neighorhoods in the data set
 */
export function getRiverNames(data) {
  // TODO: Return the neihborhood names
  const listOfArrond = [...new Set(data.map(it => it["Lac/Cours d'eau (milieu récepteur)"]))];
  return listOfArrond
}

/**
 * Filters the data by the given years.
 *
 * @param {object[]} data The data to filter
 * @param {number} start The start year (inclusive)
 * @param {number} end The end year (inclusive)
 * @returns {object[]} The filtered data
 */
export function filterYears(data, start, end) {
  // TODO : Filter the data by years
  let res = data.filter(function (it) { return new Date(it.Date_Plantation).getFullYear() >= start && new Date(it.Date_Plantation).getFullYear() <= end });
  return res
}

/**
 * Summarizes how any trees were planted each year in each neighborhood.
 *
 * @param {object[]} data The data set to use
 * @returns {object[]} A table of objects with keys 'Arrond_Nom', 'Plantation_Year' and 'Counts', containing
 * the name of the neighborhood, the year and the number of trees that were planted
 */
export function summarizeYearlyCounts(data) {
  // TODO : Construct the required data table

  var series = d3.nest()
    .key(function (d) { return d["Lac/Cours d'eau (milieu récepteur)"]})
    .key(function (d) { return new Date(d["Date de début du débordement"]).getFullYear() })
    .entries(data)
  console.log(data)
  if (series !== null && Object.keys(series).length >= 1) {
    var res = []
    series.forEach(arr => {
      arr.values.forEach(year => {
        res.push({
          lac: arr.key,
          year: Number(year.key),
          Comptes: year.value.Count
        })
      })
    })
  }
  console.log(res)
  return res
}

/**
 * For the heat map, fills empty values with zeros where a year is missing for a neighborhood because
 * no trees were planted or the data was not entered that year.
 *
 * @param {object[]} data The datas set to process
 * @param {string[]} neighborhoods The names of the neighborhoods
 * @param {number} start The start year (inclusive)
 * @param {number} end The end year (inclusive)
 * @param {Function} range A utilitary function that could be useful to get the range of years
 * @returns {object[]} The data set with a new object for missing year and neighborhood combinations,
 * where the values for 'Counts' is 0
 */
export function fillMissingData(data, neighborhoods, start, end, range) {
  // TODO : Find missing data and fill with 0
  let res = []
  range(start,end).forEach(year => {
    neighborhoods.forEach(neighborhood => {
      let item = data.find(el => el.Arrond_Nom === neighborhood && el.Plantation_Year === year );
      if(item == undefined){
        res.push({
          Arrond_Nom: neighborhood,
          Plantation_Year: year,
          Comptes: 0
        })
      }
      else{
        res.push({
          Arrond_Nom: neighborhood,
          Plantation_Year: year,
          Comptes: item.Comptes
        })
      }
    }); 
  });
  return res
}
