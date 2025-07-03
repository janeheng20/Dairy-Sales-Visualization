class ReorderBarChart {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.svg = d3.select("#barChart");
    this.margin = { top: 60, right: 40, bottom: 60, left: 120 };
    this.width = +this.svg.attr("width") - this.margin.left - this.margin.right;
    this.height = +this.svg.attr("height") - this.margin.top - this.margin.bottom;
    this.tooltip = d3.select("#tooltip6");
    
    dataManager.subscribe(() => this.update());
    this.init();
  }

  init() {
    this.cleanup();
    
    this.svg.append("text")
      .attr("class", "chart-title")
      .attr("x", this.width / 2 + this.margin.left -50)
      .attr("y", this.margin.top - 20)
      .attr("text-anchor", "middle")
      .text("Suggested Reorder Quantity by Product");
    
    this.update();
  }

  cleanup() {
    this.svg.selectAll(".bar-chart-group").remove();
    this.svg.selectAll(".legend-group").remove();
    this.svg.selectAll("defs").remove();
    this.svg.selectAll(".bar-label").remove(); // Clean up previous labels
  }

  update() {
    this.cleanup();
    
    const data = this.dataManager.getBarChartData();
    const shelfLifeValues = data.map(d => d.shelfLife);
    
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(shelfLifeValues) * 1.2]);

    const chart = this.svg.append("g")
      .attr("class", "bar-chart-group")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    const y = d3.scaleBand()
      .domain(data.map(d => d.product))
      .range([0, this.height])
      .padding(0.2);

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.reorder)])
      .range([0, this.width]);

    // Y Axis
    chart.append("g")
      .attr("class", "axis y-axis")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", "10px");

    // X Axis
    chart.append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${this.height})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll("text")
      .attr("transform", "translate(0,5)");

    // Bars
    const bars = chart.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar-chart-bar")
      .attr("x", 0)
      .attr("y", d => y(d.product))
      .attr("height", y.bandwidth())
      .attr("width", d => x(d.reorder))
      .attr("fill", d => colorScale(d.shelfLife))
      .attr("rx", 2)
      .attr("ry", 2)
      .on("mouseover", (event, d) => {
        this.tooltip.style("visibility", "visible")
          .html(`<strong>${d.product}</strong><br>
                 Reorder Quantity: ${Math.round(d.reorder)}<br>
                 Shelf Life: ${d.shelfLife.toFixed(1)} days`);
      })
      .on("mousemove", event => {
        this.tooltip.style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", () => this.tooltip.style("visibility", "hidden"));

    // Add value labels to bars
    bars.each(function(d) {
      const bar = d3.select(this);
      chart.append("text")
        .attr("class", "bar-label")
        .attr("x", x(d.reorder) + 5) // Position right of bar with padding
        .attr("y", y(d.product) + y.bandwidth() / 2)
        .attr("dy", "0.35em") // Vertical alignment
        .text(Math.round(d.reorder)) // Round the value
        .style("font-size", "10px")
        .style("fill", "#333")
    });

    // X Axis Label
    chart.append("text")
      .attr("class", "axis-label")
      .attr("transform", `translate(${this.width / 2}, ${this.height + 35})`)
      .style("text-anchor", "middle")
      .text("Suggested Reorder Quantity (liters/kg)");

    // Y Axis Label
    chart.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", -60)
      .attr("x", -this.height / 2)
      .style("text-anchor", "middle")
      .text("Product");

    // Add legend
    this.addLegend(colorScale, 0, d3.max(shelfLifeValues) * 1.2);
  }

  addLegend(colorScale, minVal, maxVal) {
    const legendWidth = 180;
    const legendHeight = 15;
    const legendX = this.margin.left + 450;
    const legendY = this.margin.top - 35;

    this.svg.selectAll(".legend-group").remove();
    this.svg.select("defs").remove();

    const defs = this.svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "bar-legend-gradient")
      .attr("x1", "0%").attr("x2", "100%")
      .attr("y1", "0%").attr("y2", "0%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", colorScale(minVal));
    
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", colorScale(maxVal));

    const legendGroup = this.svg.append("g")
      .attr("class", "legend-group");

    legendGroup.append("rect")
      .attr("x", legendX)
      .attr("y", legendY)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#bar-legend-gradient)")
      .style("stroke", "#ccc")
      .style("stroke-width", 0.2);

    const legendScale = d3.scaleLinear()
      .domain([minVal, maxVal])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d => `${Math.round(d)}`);

    legendGroup.append("g")
      .attr("class", "legend-axis")
      .attr("transform", `translate(${legendX}, ${legendY + legendHeight})`)
      .call(legendAxis);

    legendGroup.append("text")
      .attr("class", "legend-title")
      .attr("x", legendX + legendWidth / 2)
      .attr("y", legendY - 8)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Shelf Life (days)");
  }
}