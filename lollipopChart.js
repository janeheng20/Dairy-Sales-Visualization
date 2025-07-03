class LollipopChart {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.svg = d3.select("#lollipopPlot");
    this.margin = {top: 40, right: 40, bottom: 40, left: 160};
    this.width = +this.svg.attr("width") - this.margin.left - this.margin.right;
    this.height = +this.svg.attr("height") - this.margin.top - this.margin.bottom;
    this.g = null;
    this.tooltip = d3.select("#tooltip7");
    
    dataManager.subscribe(() => this.update());
    this.init();
  }

  init() {
    this.svg.selectAll("*").remove();
    
    // Create title with colored text
    const title = this.svg.append("text")
      .attr("class", "chart-title")
      .attr("x", this.width / 2 + this.margin.left)
      .attr("y", this.margin.top - 20) 
      .attr("text-anchor", "middle")
      .text("Sum of ");
    
    // Add "Valid" in green
    title.append("tspan")
      .attr("fill", "#4CAF50")
      .text("Valid");
    
    // Add middle text
    title.append("tspan")
      .attr("fill", "#000")
      .text(" vs ");
    
    // Add "Expired" in red
    title.append("tspan")
      .attr("fill", "#F44336")
      .text("Expired");
    
    // Add remaining text
    title.append("tspan")
      .attr("fill", "#000")
      .text(" Stock by Product");
    
    // Create main chart group
    this.g = this.svg.append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    
    this.update();
  }

  update() {
    const data = this.dataManager.getLollipopChartData();
    const centerX = this.width / 2;

    // Clear existing elements
    this.g.selectAll("*").remove();

    const y = d3.scaleBand()
      .domain(data.map(d => d.product))
      .range([0, this.height])
      .padding(0.4);

    const maxVal = d3.max(data, d => Math.max(d.valid, d.expired)) || 10;
    const x = d3.scaleLinear()
      .domain([0, maxVal])
      .range([0, this.width / 2]);

    // Add y-axis with adjusted label positioning
    const yAxis = this.g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${centerX}, 0)`)
      .call(d3.axisLeft(y).tickSize(0));
    
    // Move y-axis labels down by half of band width
    yAxis.selectAll("text")
      .style("text-anchor", "middle")
      .attr("dy", y.bandwidth()/2 + 4);

    // Add x-axes
    this.g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${centerX}, ${this.height})`)
      .call(d3.axisBottom(x.copy().range([0, -this.width / 2])).ticks(5));

    this.g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${centerX}, ${this.height})`)
      .call(d3.axisBottom(x).ticks(5));

    // Create a shared mouseover handler
    const handleMouseover = (event, d, type) => {
      const isExpired = type === 'expired';
      const color = isExpired ? '#d62728' : '#2c7bb6';
      const label = isExpired ? 'Expired' : 'Valid';
      const value = isExpired ? d.expired : d.valid;

      this.tooltip.style("visibility", "visible")
        .html(`<strong>${d.product}</strong><br>
               ${label} Stock: ${value} units`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");

      // Highlight both line and circle
      d3.select(event.currentTarget)
        .attr("stroke-width", isExpired ? 3 : 3)
        .attr("stroke", color);

      this.g.selectAll(`.circle-${type}-${d.product.replace(/\s+/g, '-')}`)
        .attr("r", 8)
        .attr("fill", color);
    };

    const handleMouseout = (event, d, type) => {
      const defaultColor = type === 'expired' ? '#e15759' : '#4e79a7';
      
      this.tooltip.style("visibility", "hidden");

      d3.select(event.currentTarget)
        .attr("stroke-width", 2)
        .attr("stroke", defaultColor);

      this.g.selectAll(`.circle-${type}-${d.product.replace(/\s+/g, '-')}`)
        .attr("r", 6)
        .attr("fill", defaultColor);
    };

    // Valid lollipops (left side)
    this.g.selectAll(".line-valid")
      .data(data)
      .enter().append("line")
      .attr("class", "line-valid")
      .attr("x1", centerX)
      .attr("x2", d => centerX - x(d.valid))
      .attr("y1", d => y(d.product) + y.bandwidth()/2)
      .attr("y2", d => y(d.product) + y.bandwidth()/2)
      .attr("stroke", "#4e79a7")
      .attr("stroke-width", 2)
      .on("mouseover", (event, d) => handleMouseover(event, d, 'valid'))
      .on("mouseout", (event, d) => handleMouseout(event, d, 'valid'))
      .on("mousemove", (event) => {
        this.tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 10) + "px");
      });

    // Valid circles
    this.g.selectAll(".circle-valid")
      .data(data)
      .enter().append("circle")
      .attr("class", d => `circle-valid circle-valid-${d.product.replace(/\s+/g, '-')}`)
      .attr("cx", d => centerX - x(d.valid))
      .attr("cy", d => y(d.product) + y.bandwidth()/2)
      .attr("r", 6)
      .attr("fill", "#4e79a7")
      .on("mouseover", (event, d) => handleMouseover(event, d, 'valid'))
      .on("mouseout", (event, d) => handleMouseout(event, d, 'valid'))
      .on("mousemove", (event) => {
        this.tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 10) + "px");
      });

    // Expired lollipops (right side)
    this.g.selectAll(".line-expired")
      .data(data)
      .enter().append("line")
      .attr("class", "line-expired")
      .attr("x1", centerX)
      .attr("x2", d => centerX + x(d.expired))
      .attr("y1", d => y(d.product) + y.bandwidth()/2)
      .attr("y2", d => y(d.product) + y.bandwidth()/2)
      .attr("stroke", "#e15759")
      .attr("stroke-width", 2)
      .on("mouseover", (event, d) => handleMouseover(event, d, 'expired'))
      .on("mouseout", (event, d) => handleMouseout(event, d, 'expired'))
      .on("mousemove", (event) => {
        this.tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 10) + "px");
      });

    // Expired circles
    this.g.selectAll(".circle-expired")
      .data(data)
      .enter().append("circle")
      .attr("class", d => `circle-expired circle-expired-${d.product.replace(/\s+/g, '-')}`)
      .attr("cx", d => centerX + x(d.expired))
      .attr("cy", d => y(d.product) + y.bandwidth()/2)
      .attr("r", 6)
      .attr("fill", "#e15759")
      .on("mouseover", (event, d) => handleMouseover(event, d, 'expired'))
      .on("mouseout", (event, d) => handleMouseout(event, d, 'expired'))
      .on("mousemove", (event) => {
        this.tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 10) + "px");
      });
  }
}