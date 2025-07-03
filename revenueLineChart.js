class RevenueLineChart {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.svg = d3.select("#revenueLineChart");
    this.margin = { top: 40, right: 40, bottom: 60, left: 100 };
    this.width = +this.svg.attr("width") - this.margin.left - this.margin.right;
    this.height = +this.svg.attr("height") - this.margin.top - this.margin.bottom;
    this.tooltip = d3.select("body").select("#tooltip3");

    this.svg.append("text")
      .attr("class", "chart-title")
      .attr("x", this.width / 2 + this.margin.left)
      .attr("y", this.margin.top - 20)
      .attr("text-anchor", "middle")
      .text("Annual Revenue");

    dataManager.subscribe(() => this.update());
    this.update();
  }

  update() {
    const data = this.dataManager.getRevenueLineChartData();
    const selectedYear = this.dataManager.selectedYear;

    // Get unique years from data
    const uniqueYears = [...new Set(data.map(d => d.year))].sort((a, b) => a - b);

    const x = d3.scaleLinear()
      .domain(d3.extent(uniqueYears))
      .range([this.margin.left, this.width + this.margin.left]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.revenue) || 1])
      .nice()
      .range([this.height + this.margin.top, this.margin.top]);

    // Clear dynamic elements
    this.svg.selectAll(".axis").remove();
    this.svg.selectAll(".line-path").remove();
    this.svg.selectAll(".axis-label").remove();

    // Axes
    this.svg.append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${this.height + this.margin.top})`)
      .call(d3.axisBottom(x)
        .tickValues(uniqueYears) // Explicitly set tick values to unique years
        .tickFormat(d3.format("d")));

    this.svg.append("g")
      .attr("class", "axis y-axis")
      .attr("transform", `translate(${this.margin.left},0)`)
      .call(d3.axisLeft(y).tickFormat(d => `${d3.format(",.0f")(d)}`));

    // Axis labels
    this.svg.append("text")
      .attr("class", "axis-label x-label")
      .attr("x", this.margin.left + this.width / 2)
      .attr("y", this.height + this.margin.top + 40)
      .attr("text-anchor", "middle")
      .text("Year");

    this.svg.append("text")
      .attr("class", "axis-label y-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -this.margin.top - this.height / 2)
      .attr("y", this.margin.left - 80)
      .attr("text-anchor", "middle")
      .text("Revenue (INR)");

    // Line generator
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.revenue));

    const path = this.svg.append("path")
      .datum(data)
      .attr("class", "line-path")
      .attr("fill", "none")
      .attr("stroke", "#7d50c7")
      .attr("stroke-width", 3)
      .attr("d", line);

    const totalLength = path.node().getTotalLength();
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1500)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);

    // === CIRCLE JOIN (enter-update-exit) ===
    const circles = this.svg.selectAll(".year-circle")
      .data(data, d => d.year); // Key function to preserve identity

    // EXIT old
    circles.exit().remove();

    // UPDATE existing
    circles
      .attr("class", d => `year-circle ${selectedYear !== "All" && d.year === selectedYear ? 'selected' : ''}`)
      .transition()
      .duration(500)
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d.revenue))
      .attr("r", d => selectedYear !== "All" && d.year === selectedYear ? 8 : 4)
      .attr("fill", "#7d50c7")
      .attr("stroke", d => selectedYear !== "All" && d.year === selectedYear ? "#5C3317" : "none")
      .attr("stroke-width", 2);

    // ENTER new
    circles.enter().append("circle")
      .attr("class", d => `year-circle ${selectedYear !== "All" && d.year === selectedYear ? 'selected' : ''}`)
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d.revenue))
      .attr("r", 0)
      .attr("fill", "#7d50c7")
      .attr("stroke", d => selectedYear !== "All" && d.year === selectedYear ? "#5C3317" : "none")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .transition()
      .duration(600)
      .attr("r", d => selectedYear !== "All" && d.year === selectedYear ? 8 : 4);

    // === EVENTS (re-attach after join) ===
    this.svg.selectAll(".year-circle")
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .attr("r", 8)
          .attr("fill", "#5C3317");

        this.tooltip.style("visibility", "visible")
          .html(`<strong>${d.year}</strong><br>Revenue: ₹${d3.format(",.0f")(d.revenue)}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", (event, d) => {
        const isSelected = this.dataManager.selectedYear === d.year;
        d3.select(event.currentTarget)
          .attr("r", isSelected ? 8 : 4)
          .attr("fill", "#7d50c7");

        this.tooltip.style("visibility", "hidden");
      })
      .on("mousemove", (event) => {
        this.tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        const newYear = this.dataManager.selectedYear === d.year ? "All" : d.year;
        this.dataManager.setYear(newYear);
      });
  }
}