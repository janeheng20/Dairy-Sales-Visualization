function updateMetrics() {
  const filteredData = dataManager.filteredData;
  const count = filteredData.length;

  // Total Number of Cows
  const totalCows = d3.sum(filteredData, d => d.cows || 0);
  d3.select("#cowCountValue").text(totalCows.toFixed(0));

  // Average Farm Size (convert Small/Medium/Large to numbers)
  const sizeMap = { "Small": 1, "Medium": 2, "Large": 3 };
  const sizeValues = filteredData
    .map(d => sizeMap[d.farmSize])
    .filter(v => v !== undefined);
  const avgSizeValue = sizeValues.length > 0 ? d3.mean(sizeValues) : null;
  let avgSizeLabel = 'N/A';
  if (avgSizeValue !== null) {
    const rounded = Math.round(avgSizeValue);
    avgSizeLabel = Object.keys(sizeMap).find(key => sizeMap[key] === rounded);
  }
  d3.select("#farmSize").text(avgSizeLabel);

  // Average Total Land Area
  const totalLand = d3.sum(filteredData, d => d.totalLand || 0);
  const avgLand = count > 0 ? totalLand / count : 0;
  d3.select("#totalLand").text(`${avgLand.toFixed(1)} km²`);

  // Total Revenue
  const totalRevenue = d3.sum(filteredData, d => d.revenue || 0);
  d3.select("#revenueValue").text(`₹${d3.format(",.0f")(totalRevenue)}`);

  // Best Selling Product (by average qtySold)
  const productStats = d3.rollups(
    filteredData,
    v => d3.mean(v, d => d.qtySold || 0),
    d => d.product
  );
  let bestProduct = 'N/A';
  if (productStats.length > 0) {
    bestProduct = productStats.sort((a, b) => b[1] - a[1])[0][0];
  }
  d3.select("#bestProductValue").text(bestProduct);
}
