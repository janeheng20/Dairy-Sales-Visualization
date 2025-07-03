class QtySoldBarChart {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.svg = d3.select("#qtySoldBarChart");
    this.margin = { top: 30, right: 80, bottom: 50, left: 100 };
    this.width = +this.svg.attr("width") - this.margin.left - this.margin.right;
    this.height = +this.svg.attr("height") - this.margin.top - this.margin.bottom;
    this.tooltip = d3.select("body").select("#tooltip4");

    this.chart = this.svg.append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    
    this.svg.append("text")
      .attr("class", "chart-title")
      .attr("x", this.width / 2 + this.margin.left)
      .attr("y", this.margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text("Total Quantity Sold by Product");

    this.dataManager.subscribe(() => this.update());
    this.update();
  }

  update() {
    const data = this.dataManager.getQtySoldBarChartData();

    this.chart.selectAll("*").remove();

    const y = d3.scaleBand()
      .domain(data.map(d => d.product))
      .range([0, this.height])
      .padding(0.2);

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.qtySold)])
      .range([0, this.width]);

    const color = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range(["#b17352", "#e1c9bc"]);

    // X Axis
    this.chart.append("g")
      .attr("transform", `translate(0,${this.height})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll("text")
      .style("font-size", "10px");

    // Y Axis
    this.chart.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", "10px");

    // X Axis Label
    this.chart.append("text")
      .attr("x", this.width / 2)
      .attr("y", this.height + 40)
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .attr("class", "axis-label")
      .text("Quantity Sold (liters/kg)");

    // Y Axis Label
    this.chart.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -this.height / 2)
      .attr("y", -this.margin.left + 20)
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .attr("class", "axis-label")
      .text("Product");

    // Bars
    this.chart.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", d => y(d.product))
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", d => x(d.qtySold))
      .attr("fill", "rgb(240, 170, 57)")
        .on("mouseover", (event, d) => {
        this.tooltip
            .style("visibility", "visible")
            .html(`<strong>${d.product}</strong><br>Qty Sold: ${d.qtySold}`);
        })
      .on("mousemove", (event) => {
        this.tooltip
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", () => {
        this.tooltip.style("visibility", "hidden");
      });
  }
}
