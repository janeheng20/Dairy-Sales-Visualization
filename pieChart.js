class PieChart {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.svg = d3.select("#salesPieChart");
    this.margin = { top: 40, right: 50, bottom: 20, left: 40 };
    this.width = +this.svg.attr("width") - this.margin.left - this.margin.right;
    this.height = +this.svg.attr("height") - this.margin.top - this.margin.bottom;
    this.radius = Math.min(this.width, this.height) / 2;
    this.color = d3.scaleOrdinal(d3.schemeCategory10);
    this.tooltip = d3.select("body").select("#tooltip2");
    this.selectedChannel = null;

    this.dataManager.subscribe(() => this.update());
    this.init();
  }

  init() {
    this.svg.selectAll("*").remove();

    this.svg.append("rect")
  .attr("class", "background-catcher")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", this.width + this.margin.left + this.margin.right)
  .attr("height", this.height + this.margin.top + this.margin.bottom)
  .attr("fill", "transparent")
  .on("click", () => {
    this.selectedChannel = null;
    this.dataManager.setSalesChannel("All");
    this.update();
  })
  .lower(); 

    this.chartGroup = this.svg
      .append("g")
      .attr("transform", `translate(${this.margin.left + this.width / 2}, ${this.margin.top + this.height / 2})`);

    this.legendGroup = this.svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${this.width + this.margin.left - 40}, ${this.margin.top})`);

    this.svg.append("text")
      .attr("class", "chart-title")
      .attr("x", this.width / 2 + this.margin.left)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .text("Sales Channel by Revenue");

    this.update();
  }

  update() {
    const raw = this.dataManager.allData; // Use all data, not already-filtered
    const selectedYear = this.dataManager.selectedYear;
    const selectedBrand = this.dataManager.selectedBrand;
    const selectedMonth = this.dataManager.selectedMonth;
    const selectedLocation = this.dataManager.selectedLocation;
    const selectedChannel = this.dataManager.selectedSalesChannel;

    // Apply all filters EXCEPT for salesChannel
    const filtered = raw.filter(d => {
      const yearMatch = selectedYear === "All" || d.year === selectedYear;
      const brandMatch = selectedBrand === "All" || d.brand === selectedBrand;
      const monthMatch = selectedMonth === "All" || d.month === selectedMonth;
      const locationMatch = selectedLocation === "All" || d.location === selectedLocation;
      return yearMatch && brandMatch && monthMatch && locationMatch;
    });

    const data = d3.rollups(
      filtered,
      v => d3.sum(v, d => d.revenue),
      d => d.salesChannel
    ).map(([label, value]) => ({ label, value }));

    const totalRevenue = d3.sum(data, d => d.value);

    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(this.radius);

    const pieData = pie(data);

    this.chartGroup.selectAll(".arc").remove();
    this.legendGroup.selectAll("*").remove();

    const arcs = this.chartGroup.selectAll(".arc")
      .data(pieData)
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => this.color(d.data.label))
      .attr("stroke", d => d.data.label === this.selectedChannel ? "#000" : "none")
      .attr("stroke-width", d => d.data.label === this.selectedChannel ? 2 : 0)
      .attr("opacity", d => 
        this.selectedChannel === null || d.data.label === this.selectedChannel ? 1 : 0.3
      )
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        const revenue = d.data.value.toLocaleString();
        this.tooltip
          .style("visibility", "visible")
          .style("opacity", 1)
          .html(`<strong>${d.data.label}</strong><br><strong>Revenue:</strong> ₹${revenue}`);
      })
      .on("mousemove", (event) => {
        this.tooltip
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", () => {
        this.tooltip
          .style("opacity", 0)
          .style("visibility", "hidden");
      })
      .on("click", (event, d) => {
        const selected = d.data.label;
        this.selectedChannel = this.selectedChannel === selected ? null : selected;
        this.dataManager.setSalesChannel(this.selectedChannel || "All");
        this.update(); // Refresh with new selection
      });

    arcs.append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .style("text-anchor", "middle")
      .text(d => `${((d.data.value / totalRevenue) * 100).toFixed(1)}%`);

    const legend = this.legendGroup.selectAll(".legend-item")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 20})`);

    legend.append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", d => this.color(d.label));

    legend.append("text")
      .attr("x", 24)
      .attr("y", 14)
      .text(d => d.label);
  }

}
