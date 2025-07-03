class MapChart {
  constructor(dataManager, containerId = "#mapChart") {
    this.dataManager = dataManager;
    this.containerId = containerId;
    this.svg = d3.select(containerId);
    this.width = +this.svg.attr("width");
    this.height = +this.svg.attr("height");
    this.selectedLocation = null;
    this.tooltip = d3.select("body").select("#tooltip1");
    console.log("Tooltip element:", this.tooltip.node());

    this.projection = d3.geoMercator()
      .scale(500)
      .center([82.5, 22])
      .translate([this.width / 2 - 150, this.height / 2]);

    this.path = d3.geoPath().projection(this.projection);

    this.svg.selectAll("*").remove();

    this.mainGroup = this.svg.append("g").attr("class", "main-group");
    this.countryGroup = this.mainGroup.append("g").attr("class", "countries");
    this.bubbleGroup = this.mainGroup.append("g").attr("class", "bubbles");

    // Fixed title
    this.svg.append("text")
      .attr("class", "map-title")
      .attr("x", this.width / 2 - 100)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Geographical Sales Distribution");

    // Fixed legend group
    this.legendGroup = this.svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${this.width - 350}, 50)`)

    // Click-to-clear background
    this.svg.append("rect")
      .attr("class", "background-rect")
      .attr("width", this.width)
      .attr("height", this.height)
      .style("fill", "transparent")
      .style("cursor", "default")
      .lower()
      .on("click", () => {
          this.dataManager.setLocation("All");
          this.resetZoom();
          d3.select("#locationSelect").property("value", "All");

      });

    // Add zoom behavior
    this.zoom = d3.zoom()
      .scaleExtent([1, 8])
      .translateExtent([[0, 0], [this.width, this.height]]) // Set pan boundaries
      .extent([[0, 0], [this.width, this.height]])          // Define viewport for zoom
      .on("zoom", (event) => {
        const { x, y, k } = event.transform;

        // Clamp x and y so it cannot drag map outside container
        const tX = Math.min(0, Math.max(this.width - this.width * k, x));
        const tY = Math.min(0, Math.max(this.height - this.height * k, y));

        this.mainGroup.attr("transform", `translate(${tX},${tY}) scale(${k})`);
      });

    this.svg.call(this.zoom);
    this.addZoomControls();

    this.dataManager.subscribe(() => this.update());

    d3.json("in.json").then(world => {
      this.world = world;
      this.update();
    });
  }

  addZoomControls() {
    const controlContainer = d3.select(this.containerId)
      .append("foreignObject")
      .attr("x", 10)
      .attr("y", 10)
      .attr("width", 30)
      .attr("height", 100)
      .append("xhtml:div")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("gap", "5px");

    controlContainer.append("button")
      .text("+")
      .style("width", "30px")
      .style("height", "30px")
      .style("font-size", "16px")
      .style("cursor", "pointer")
      .on("click", () => {
        this.svg.transition().call(this.zoom.scaleBy, 1.5);
      });

    controlContainer.append("button")
      .text("−")
      .style("width", "30px")
      .style("height", "30px")
      .style("font-size", "16px")
      .style("cursor", "pointer")
      .on("click", () => {
        this.svg.transition().call(this.zoom.scaleBy, 1 / 1.5);
      });

    controlContainer.append("button")
      .text("⟳")
      .style("width", "30px")
      .style("height", "30px")
      .style("font-size", "16px")
      .style("cursor", "pointer")
      .on("click", () => this.resetZoom());
  }

  resetZoom() {
    this.svg.transition()
      .duration(750)
      .call(this.zoom.transform, d3.zoomIdentity);
  }

  update() {
    if (!this.world) return;

    this.selectedLocation = this.dataManager.selectedLocation;
    const data = this.dataManager.getMapChartData();
    const products = [...new Set(data.map(d => d.bestProduct))];

    const revenueColor = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(data, d => d.totalRevenue)]);

    const productColor = d3.scaleOrdinal()
      .domain(products)
      .range([
        "#1f77b4",  // Blue
        "#ff7f0e",  // Orange
        "#2ca02c",  // Green
        "#d62728",  // Red
        "#9467bd",  // LightPurple
        "#8c564b",  // Brown
        "#e377c2",  // Pink
        "purple"   // Purple
      ])
      ;


    // Render countries
    const countries = this.countryGroup.selectAll("path")
      .data(this.world.features, d => d.properties.name);

    countries.enter()
      .append("path")
      .attr("class", "country")
      .attr("d", this.path)
      .style("stroke", "#000")
      .style("stroke-width", "0.5px")
      .style("cursor", "pointer")
      .merge(countries)
      .attr("fill", d => {
        const match = data.find(loc => loc.location === d.properties.name);
        let baseColor = match ? revenueColor(match.totalRevenue) : "#ccc";
        if (this.selectedLocation === d.properties.name) {
          return d3.color(baseColor).darker(2);
        }
        return baseColor;
      })
      .style("stroke", d => d.properties.name === this.selectedLocation ? "red" : "#000")
      .style("stroke-width", d => d.properties.name === this.selectedLocation ? "1.5px" : "0.5px")
      .on("click", (event, d) => {
        const location = d.properties.name;
        const isSame = this.selectedLocation === location;
        // When clicking the same location again, reset to "All"
      if (isSame) {
        this.dataManager.setLocation("All");
        this.resetZoom();
        d3.select("#locationSelect").property("value", "All");
      } else {
        // Zoom into the selected location and update dropdown
        const bounds = this.path.bounds(d);
        const dx = bounds[1][0] - bounds[0][0];
        const dy = bounds[1][1] - bounds[0][1];
        const x = (bounds[0][0] + bounds[1][0]) / 2;
        const y = (bounds[0][1] + bounds[1][1]) / 2;
        const scale = Math.max(1, Math.min(8, 0.4 / Math.max(dx / this.width, dy / this.height)));
        const translate = [this.width / 2 - scale * x, this.height / 2 - scale * y];
        
        this.svg.transition()
          .duration(750)
          .call(this.zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
        
        this.dataManager.setLocation(location);
        d3.select("#locationSelect").property("value", location);
      }

      });

    countries.exit().remove();

    // Render bubbles
    const getCentroid = location => {
      const feature = this.world.features.find(f => f.properties.name === location);
      return feature ? this.projection(d3.geoCentroid(feature)) : [0, 0];
    };

    const bubbles = this.bubbleGroup.selectAll("circle")
      .data(data.filter(d => this.world.features.find(f => f.properties.name === d.location)), d => d.location);

    bubbles.enter()
      .append("circle")
      .attr("class", "bubble")
      .attr("r", 0)
      .attr("fill", d => productColor(d.bestProduct))
      .style("cursor", "pointer")
      .attr("cx", d => getCentroid(d.location)[0])
      .attr("cy", d => getCentroid(d.location)[1])
      .on("mouseover", (event, d) => {
        this.tooltip
          .style("opacity", 1)
          .style("visibility", "visible")
          .html(`<strong>${d.location}</strong><br>Best Selling Product: ${d.bestProduct}<br>Total Revenue: ₹${d3.format(",")(d.totalRevenue)}<br>Items Sold: ${d.totalQuantity} units`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 10}px`);
      })
      .on("mouseout", () => {
        this.tooltip
          .style("opacity", 0)
          .style("visibility", "hidden");
      })
      .merge(bubbles)
      .transition()
      .duration(300)
      .attr("r", 6)
      .attr("fill", d => productColor(d.bestProduct))
      .style("opacity", 1);

    bubbles.exit().transition().duration(300).attr("r", 0).remove();

    // Update legend
    this.legendGroup.selectAll("*").remove();

    this.legendGroup.append("text")
      .attr("x", 0)
      .attr("y", -5)
      .attr("font-weight", "bold")
      .style("font-size", "12px")
      .text("Best Selling Product");

    const legendItems = this.legendGroup.selectAll(".legend-item")
      .data(products)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 20 + 10})`);

    legendItems.append("rect")
      .attr("width", 16)
      .attr("height", 16)
      .attr("fill", d => productColor(d));

    legendItems.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .style("font-size", "10px")
      .text(d => d);
  }
}