class LossLineChart {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.svg = d3.select("#lossLineChart");
    this.margin = { top: 60, right: 60, bottom: 60, left: 130 };
    this.width = +this.svg.attr("width") - this.margin.left - this.margin.right;
    this.height = +this.svg.attr("height") - this.margin.top - this.margin.bottom;
    this.tooltip = d3.select("#tooltip5");

    this.svg.append("text")
      .attr("class", "chart-title")
      .attr("x", this.width / 2 + this.margin.left)
      .attr("y", this.margin.top - 20)
      .attr("text-anchor", "middle")
      .text("Annual Financial Loss");

    dataManager.subscribe(() => this.update());
    this.update();
  }

  update() {
    const data = this.dataManager.getLossLineChartData();
    const selectedYear = this.dataManager.selectedYear;

    // Extract unique years and sort them
    const uniqueYears = [...new Set(data.map(d => d.year))].sort((a, b) => a - b);

    const x = d3.scaleLinear()
      .domain(d3.extent(uniqueYears))
      .range([this.margin.left, this.width + this.margin.left]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.loss) || 1])
      .nice()
      .range([this.height + this.margin.top, this.margin.top]);

    this.svg.selectAll(".axis").remove();
    this.svg.selectAll(".line-path").remove();
    this.svg.selectAll(".year-circle").remove();
    this.svg.selectAll(".axis-label").remove();

    // Apply unique years to tickValues to avoid duplicates
    this.svg.append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${this.height + this.margin.top})`)
      .call(d3.axisBottom(x)
        .tickValues(uniqueYears)
        .tickFormat(d3.format("d")));

    this.svg.append("g")
      .attr("class", "axis y-axis")
      .attr("transform", `translate(${this.margin.left},0)`)
      .call(d3.axisLeft(y).tickFormat(d => `${d3.format(",.0f")(d)}`));

    this.svg.append("text")
      .attr("class", "axis-label y-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -this.height / 2 - this.margin.top)
      .attr("y", this.margin.left - 80)
      .attr("text-anchor", "middle")
      .text("Financial Loss (INR)");

    this.svg.append("text")
      .attr("class", "axis-label x-label")
      .attr("x", this.width / 2 + this.margin.left)
      .attr("y", this.height + this.margin.top + 40)
      .attr("text-anchor", "middle")
      .text("Year");

    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.loss));

    const path = this.svg.append("path")
      .datum(data)
      .attr("class", "line-path")
      .attr("fill", "none")
      .attr("stroke", "#6a5acd")
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

    const circles = this.svg.selectAll(".year-circle")
      .data(data)
      .enter().append("circle")
      .attr("class", d => `year-circle ${selectedYear !== "All" && d.year === selectedYear ? 'selected' : ''}`)
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d.loss))
      .attr("r", d => selectedYear !== "All" && d.year === selectedYear ? 8 : 4)
      .attr("fill", "#6a5acd")
      .attr("stroke", d => selectedYear !== "All" && d.year === selectedYear ? "#483d8b" : "none")
      .attr("stroke-width", 2)
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .attr("r", 8)
          .attr("fill", "#483d8b");

        this.tooltip.style("visibility", "visible")
          .html(`<strong>${d.year}</strong><br>Loss: ₹${d3.format(",.0f")(d.loss)}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", (event, d) => {
        const isSelected = this.dataManager.selectedYear === d.year;
        d3.select(event.currentTarget)
          .attr("r", isSelected ? 8 : 4)
          .attr("fill", "#6a5acd");

        this.tooltip.style("visibility", "hidden");
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        const newYear = this.dataManager.selectedYear === d.year ? "All" : d.year;
        this.dataManager.setYear(newYear);
      });
  }
}
