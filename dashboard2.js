document.addEventListener('DOMContentLoaded', function() {
  // Initialize data manager and charts
  const lineChart = new LossLineChart(dataManager);
  const barChart = new ReorderBarChart(dataManager);
  const lollipopChart = new LollipopChart(dataManager);
  const bulletChart = new BulletChart(dataManager);

  // Load data and initialize dropdowns
  d3.csv("dairy_dataset.csv").then(rawData => {
    dataManager.parseData(rawData);
    
    // Get unique values for dropdowns
    const brands = ["All", ...new Set(rawData.map(d => d.Brand))].sort();
    const months = ["All", ...Array.from({length: 12}, (_, i) => i + 1)];
    const locations = ["All", ...new Set(rawData.map(d => d.Location))].sort();

    // Populate brand dropdown
    const brandSelect = d3.select("#brandSelect");
    brandSelect.selectAll("option")
      .data(brands)
      .enter()
      .append("option")
      .attr("value", d => d)
      .text(d => d === "All" ? "All Brands" : d);

    // Populate month dropdown
    const monthSelect = d3.select("#monthSelect");
    monthSelect.selectAll("option")
      .data(months)
      .enter()
      .append("option")
      .attr("value", d => d)
      .text(d => d === "All" ? "All Months" : `${d}`);

    // Populate location dropdown
    const locationSelect = d3.select("#locationSelect");
    locationSelect.selectAll("option")
      .data(locations)
      .enter()
      .append("option")
      .attr("value", d => d)
      .text(d => d === "All" ? "All Locations" : d);

    // Set up event listeners
    brandSelect.on("change", function() {
      dataManager.setBrand(this.value);
    });

    monthSelect.on("change", function() {
      dataManager.setMonth(this.value);
    });

    locationSelect.on("change", function() {
      dataManager.setLocation(this.value);
    });
  });
});