
/**
 * Sets the domain of the color scale
 *
 * @param {*} colorScale The color scale used in the heatmap
 * @param {object[]} data The data to be displayed
 */
export function setColorScaleDomain(colorScale, data) {
  console.log(data)
  // TODO : Set domain of color scale
  let max = Math.max.apply(Math, data.map(function (el) { return el.Comptes; }))
  colorScale.domain([0,max]);
}

/**
 * For each data element, appends a group 'g' to which an SVG rect is appended
 *
 * @param {object[]} data The data to use for binding
 */
export function appendRects(data) {
  // TODO : Append SVG rect elements
  d3.selectAll('.group').remove()
  
  d3.select('#graph-g')
    .selectAll('#group')
    .data(data)
    .join('g')
    .attr('class', 'group')
    .append("rect")
}

/**
 * Updates the domain and range of the scale for the x axis
 *
 * @param {*} xScale The scale for the x axis
 * @param {object[]} data The data to be used
 * @param {number} width The width of the diagram
 * @param {Function} range A utilitary funtion that could be useful to generate a list of numbers in a range
 */
export function updateXScale(xScale, data, width, range) {
  // TODO : Update X scale
  let min = Math.min.apply(Math, data.map(function (el) { return el.Plantation_Year; }))
  let max = Math.max.apply(Math, data.map(function (el) { return el.Plantation_Year; }))
  d3.selectAll('.x').select("g").remove()
  xScale
    .range([0, width])
    .domain(range(min, max));
}

/**
 * Updates the domain and range of the scale for the y axis
 *
 * @param {*} yScale The scale for the y axis
 * @param {string[]} neighborhoodNames The names of the neighborhoods
 * @param {number} height The height of the diagram
 */
export function updateYScale(yScale, neighborhoodNames, height) {
  // TODO : Update Y scale
  // Make sure to sort the neighborhood names alphabetically
  neighborhoodNames.sort()
  neighborhoodNames.reverse()
  d3.selectAll('.y').select("g").remove()
  yScale
    .range([height, 0])
    .domain(neighborhoodNames);
}

/**
 *  Draws the X axis at the top of the diagram.
 *
 *  @param {*} xScale The scale to use to draw the axis
 */
export function drawXAxis(xScale) {
  // TODO : Draw X axis
  d3.select('.x')
    .append("g")
    .call(d3.axisTop(xScale))
}

/**
 * Draws the Y axis to the right of the diagram.
 *
 * @param {*} yScale The scale to use to draw the axis
 * @param {number} width The width of the graphic
 */
export function drawYAxis(yScale, width) {
  // TODO : Draw Y axis

  d3.select('.y')
    .append("g")
    .call(d3.axisRight(yScale))

  d3.selectAll('.y > g')
    .attr("transform", "translate(" + width + ")")
}

/**
 * Rotates the ticks on the X axis 45 degrees towards the left.
 */
export function rotateXTicks() {
  // TODO : Rotate X axis' ticks

  d3.selectAll('.x text')
    .attr("transform", "rotate(-45)")
}

/**
 * After the rectangles have been appended, this function dictates
 * their position, size and fill color.
 *
 * @param {*} xScale The x scale used to position the rectangles
 * @param {*} yScale The y scale used to position the rectangles
 * @param {*} colorScale The color scale used to set the rectangles' colors
 */
export function updateRects(xScale, yScale, colorScale) {
  // TODO : Set position, size and fill of rectangles according to bound data
  d3.selectAll(".group > rect")
      .attr("x", function(d) { return xScale(d.Plantation_Year) })
      .attr("y", function(d) { return yScale(d.Arrond_Nom) })
      .attr("width", xScale.bandwidth() )
      .attr("height", yScale.bandwidth() )
      .style("fill", function(d) { console.log(colorScale(d.Comptes)); return colorScale(d.Comptes)} )
}
