class DataManager {
  constructor() {
    this.allData = [];
    this.filteredData = [];
    this.selectedYear = "All";
    this.selectedBrand = "All";
    this.selectedMonth = "All";
    this.selectedLocation = "All";
    this.selectedSalesChannel = "All";
    this.subscribers = [];

    document.getElementById('resetYearBtn')?.addEventListener('click', () => {
      this.setYear("All");
    });

    document.getElementById('resetChannelBtn')?.addEventListener('click', () => {
      this.setSalesChannel("All");
    });
  }

  parseData(rawData) {
    const parseDate = d3.timeParse("%d/%m/%Y");
    this.allData = rawData.map(d => {
      const prodDate = parseDate(d["Production Date"]);
      const date = parseDate(d["Date"]);
      const expDate = parseDate(d["Expiration Date"]);

      const parsed = {
        date,
        prodDate,
        expDate,
        qtyStock: +d["Quantity in Stock (liters/kg)"] || 0,
        qtySold: +d["Quantity Sold (liters/kg)"] || 0,
        product: d["Product Name"],
        brand: d["Brand"],
        price: +d["Price per Unit"] || 0,
        minStock: +d["Minimum Stock Threshold (liters/kg)"] || 0,
        location: d["Location"],
        reorderQty: +d["Reorder Quantity (liters/kg)"] || 0,
        shelfLife: +d["Shelf Life (days)"] || 0,
        revenue: +d["Approx. Total Revenue(INR)"] || 0,
        salesChannel: d["Sales Channel"],
        mainDate: parseDate(d["Date"]),
        cows: +d["Number of Cows"] || 0,
        farmSize: d["Farm Size"],
        totalLand: +d["Total Land Area (acres)"] || 0
      };
      parsed.month = date ? date.getMonth() + 1 : null;
      parsed.year = date ? date.getFullYear() : null;
      return parsed;
    });
    this.updateFilteredData();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
  }

  notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }

  updateFilteredData() {
    this.filteredData = this.allData.filter(d => {
      const brandMatch = this.selectedBrand === "All" || d.brand === this.selectedBrand;
      const monthMatch = this.selectedMonth === "All" || d.month === this.selectedMonth;
      const locationMatch = this.selectedLocation === "All" || d.location === this.selectedLocation;
      const channelMatch = this.selectedSalesChannel === "All" || d.salesChannel === this.selectedSalesChannel;
      const yearMatch = this.selectedYear === "All" || d.year === this.selectedYear;
      return brandMatch && monthMatch && locationMatch && channelMatch && yearMatch;
    });
    this.notifySubscribers();
  }

  setYear(year) {
    this.selectedYear = year;
    this.updateFilteredData();
    this.updateYearDisplay();
  }

  updateYearDisplay() {
    const displayText = this.selectedYear === "All" ? "All Years" : this.selectedYear;
    document.getElementById('currentYear').textContent = displayText;
  }

  setBrand(brand) {
    this.selectedBrand = brand;
    this.updateFilteredData();
  }

  setMonth(month) {
    this.selectedMonth = month === "All" ? "All" : +month;
    this.updateFilteredData();
  }

  setLocation(location) {
    this.selectedLocation = location;
    this.updateFilteredData();
  }

  setSalesChannel(channel) {
    this.selectedSalesChannel = channel;
    this.updateFilteredData();
  }

  getSalesChannel() {
    return this.selectedSalesChannel;
  }

  getLossLineChartData() {
  const expirationData = this.getDetailedExpirationData(true); // Pass true to ignore year filter

  // Group by year and calculate financial loss
  const lossByYear = d3.rollup(
    expirationData,
    v => d3.sum(v, d => d.expired * d.price), // Multiply expired quantity by price
    d => d.year
  );

  return Array.from(lossByYear, ([year, loss]) => ({ year, loss }))
    .filter(d => d.year !== 2018) // exclude 2018
    .sort((a, b) => a.year - b.year);
}

  getFilteredDataWithoutYear() {
    return this.allData.filter(d => {
      const brandMatch = this.selectedBrand === "All" || d.brand === this.selectedBrand;
      const monthMatch = this.selectedMonth === "All" || d.month === this.selectedMonth;
      const locationMatch = this.selectedLocation === "All" || d.location === this.selectedLocation;
      const channelMatch = this.selectedSalesChannel === "All" || d.salesChannel === this.selectedSalesChannel;
      return brandMatch && monthMatch && locationMatch && channelMatch;
    });
  }

  // New helper method that replicates the lollipop chart's expiration detection
  getDetailedExpirationData(ignoreYearFilter = false) {
    const rawData = ignoreYearFilter
      ? this.getFilteredDataWithoutYear()
      : (this.selectedYear === "All"
          ? this.filteredData
          : this.filteredData.filter(d => d.year === this.selectedYear));


    const groupedByProduct = d3.group(rawData, d => d.product);
    const detailedData = [];

    groupedByProduct.forEach((records, product) => {
      const batches = d3.groups(records.filter(d => d.prodDate), d => +d.prodDate)
                        .map(([_, recs]) => recs.sort((a, b) => a.prodDate - b.prodDate))
                        .flat()
                        .sort((a, b) => a.prodDate - b.prodDate);

      let prevBatches = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        let expired = 0;
        let valid = 0;

        // Process previous batches
        prevBatches = prevBatches.map(b => ({...b}));
        const remaining = [];
        let qtyToSell = batch.qtySold;

        // FIFO inventory accounting
        for (let b of prevBatches) {
          const available = b.qty;
          const use = Math.min(qtyToSell, available);
          b.qty -= use;
          qtyToSell -= use;
          if (b.qty > 0) remaining.push(b);
        }

        // Check expiration
        for (let r of remaining) {
          if (r.expDate < batch.prodDate) {
            expired += r.qty;
          } else {
            valid += r.qty;
          }
        }

        // Add current batch to inventory
        if (batch.qtyStock > 0) {
          prevBatches.push({ 
            qty: batch.qtyStock, 
            expDate: batch.expDate,
            price: batch.price // Include price for loss calculation
          });
        }

        detailedData.push({
          product: batch.product,
          year: batch.prodDate.getFullYear(),
          expired,
          price: batch.price,
          valid: batch.qtySold + valid
        });
      }
    });

    return detailedData;
  }
  
  getBarChartData() {
    const data = this.selectedYear === "All" 
      ? this.filteredData 
      : this.filteredData.filter(d => d.year === this.selectedYear);
    
    const reorderData = d3.rollup(
      data,
      v => ({
        reorder: d3.sum(v, d => d.reorderQty),
        shelfLife: d3.mean(v, d => d.shelfLife)
      }),
      d => d.product
    );
    return Array.from(reorderData, ([product, values]) => ({
      product,
      reorder: values.reorder,
      shelfLife: values.shelfLife
    })).sort((a, b) => b.reorder - a.reorder);
  }

getLollipopChartData() {
    const rawData = this.selectedYear === "All" 
      ? this.filteredData 
      : this.filteredData.filter(d => d.year === this.selectedYear);

    // Group by product and process batches chronologically
    const groupedByProduct = d3.group(rawData, d => d.product);
    const summary = [];

    groupedByProduct.forEach((records, product) => {
      // Sort batches by production date
      const batches = d3.groups(records.filter(d => d.prodDate), d => +d.prodDate)
                        .map(([_, recs]) => recs.sort((a, b) => a.prodDate - b.prodDate))
                        .flat()
                        .sort((a, b) => a.prodDate - b.prodDate);

      let prevBatches = []; // Tracks inventory from previous batches

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        let expired = 0;
        let valid = 0;

        // Process previous batches against current sales
        prevBatches = prevBatches.map(b => ({...b}));
        const remaining = [];
        let qtyToSell = batch.qtySold;

        // First-in-first-out (FIFO) inventory accounting
        for (let b of prevBatches) {
          const available = b.qty;
          const use = Math.min(qtyToSell, available);
          b.qty -= use;
          qtyToSell -= use;
          if (b.qty > 0) remaining.push(b);
        }

        // Check what remains in inventory for expiration
        for (let r of remaining) {
          if (r.expDate < batch.prodDate) {
            expired += r.qty; // Expired if past expiration date
          } else {
            valid += r.qty; // Still valid
          }
        }

        // Add current batch to inventory tracking
        if (batch.qtyStock > 0) {
          prevBatches.push({ 
            qty: batch.qtyStock, 
            expDate: batch.expDate 
          });
        }

        summary.push({
          product,
          valid: batch.qtySold + valid, // Sold + remaining valid
          expired
        });
      }
    });

    // Aggregate by product
    const productData = d3.rollup(
      summary,
      v => ({
        valid: d3.sum(v, d => d.valid),
        expired: d3.sum(v, d => d.expired)
      }),
      d => d.product
    );

    return Array.from(productData, ([product, values]) => ({
      product,
      valid: values.valid,
      expired: values.expired
    }));
  }

  getStockThresholdData() {
    const data = this.selectedYear === "All" 
      ? this.filteredData 
      : this.filteredData.filter(d => d.year === this.selectedYear);
    
    const stockData = d3.rollup(
      data,
      v => ({
        stock: d3.sum(v, d => d.qtyStock),
        threshold: d3.mean(v, d => d.minStock)
      }),
      d => d.product
    );
    return Array.from(stockData, ([product, values]) => ({
      product,
      stock: values.stock,
      threshold: values.threshold
    })).sort((a, b) => b.stock - b.threshold - (a.stock - a.threshold));
  }

  getPieChartData() {
    const data = this.selectedYear === "All"
      ? this.filteredData
      : this.filteredData.filter(d => d.year === this.selectedYear);

    const revenueByChannel = d3.rollup(
      data,
      v => d3.sum(v, d => d.revenue),
      d => d.salesChannel
    );

    return Array.from(revenueByChannel, ([label, value]) => ({ label, value }));
  }

  getRevenueLineChartData() {
    const data = this.allData.filter(d => {
      const brandMatch =
        this.selectedBrand === "All" || d.brand === this.selectedBrand;

      const monthMatch =
        this.selectedMonth === "All" || d.month == this.selectedMonth; // use == to allow "01" == 1

      const locationMatch =
        this.selectedLocation === "All" || d.location === this.selectedLocation;

      const channelMatch =
        this.selectedSalesChannel === "All" || d.salesChannel === this.selectedSalesChannel;

      return brandMatch && monthMatch && locationMatch && channelMatch;
    });

    if (!data || data.length === 0) {
      console.warn("No matching data found for line chart filters.");
      return []; // return empty array to avoid crash
    }

    // Group and sum by year
    const revenueByYear = d3.rollup(
      data,
      v => d3.sum(v, d => d.revenue),
      d => +d.year // ensure year is a number
    );

    return Array.from(revenueByYear, ([year, revenue]) => ({
      year,
      revenue
    }))
      .filter(d => d.year && !isNaN(d.year))
      .sort((a, b) => a.year - b.year);
  }


  getQtySoldBarChartData() {
    const data = this.selectedYear === "All"
      ? this.filteredData
      : this.filteredData.filter(d => d.year === this.selectedYear);

    const qtySoldByProduct = d3.rollup(
      data,
      v => d3.sum(v, d => d.qtySold),
      d => d.product
    );

    return Array.from(qtySoldByProduct, ([product, qtySold]) => ({ product, qtySold }))
      .sort((a, b) => b.qtySold - a.qtySold);
  }

  getMapChartData() {
    const data = this.allData.filter(d => {
      const yearMatch = this.selectedYear === "All" || d.year === this.selectedYear;
      const brandMatch = this.selectedBrand === "All" || d.brand === this.selectedBrand;
      return yearMatch && brandMatch;  
    });

    const aggregated = d3.rollup(
      data,
      v => {
        const totalRevenue = d3.sum(v, d => d.revenue);
        const totalQuantity = d3.sum(v, d => d.qtySold);
        const bestProduct = d3.rollup(
          v,
          items => d3.sum(items, d => d.qtySold),
          d => d.product
        );

        const best = Array.from(bestProduct.entries())
          .sort((a, b) => b[1] - a[1])[0];

        return {
          totalRevenue,
          totalQuantity,
          bestProduct: best ? best[0] : "Unknown"
        };
      },
      d => d.location
    );

    return Array.from(aggregated, ([location, values]) => ({
      location,
      ...values,
      year: this.selectedYear === "All" ? "All" : this.selectedYear,
      brand: this.selectedBrand
    }));
  }
  
  getFullMapChartData() {
    return this.aggregatedMapData;
  }


}

const dataManager = new DataManager();