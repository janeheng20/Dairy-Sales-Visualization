# Dairy-Sales-Visualization

This repository contains the dataset and full source code to build and run two interactive dashboards for visualizing dairy sales trends, inventory metrics, and product performance across different regions in India. The dashboards are built using D3.js and feature interactive charts, tooltips, map filtering, and more.

## Folder Structure
```
Project Root
├── img/                       # Image assets used in dashboard1
│
├── dairy_dataset.csv          # Main dataset used for all dashboards
├── in.json                    # Pre-processed map input data 
│
├── dashboard1.html            # HTML file for Dashboard 1
├── dashboard1.css             # Stylesheet for Dashboard 1
├── dashboard1.js              # Entry point JS for Dashboard 1 (controls flow)
│
├── dashboard2.html            # HTML file for Dashboard 2
├── dashboard2.css             # Stylesheet for Dashboard 2
├── dashboard2.js              # Entry point JS for Dashboard 2 (controls flow)
│
├── dataManager.js             # Centralized data parsing, filtering, and chart update logic
│
├── bulletChart.js             # Chart for stock threshold visualization
├── lollipopChart.js          # Chart for visualizing expired vs. valid stock
├── lossLineChart.js          # Line chart showing financial loss due to expired stock
├── mapChart.js               # Interactive geographic map with zoom and pan
├── metrics.js                # Dashboard summary metrics (cow count, revenue, etc.)
├── pieChart.js               # Pie chart for sales channel distribution
├── qtySoldBarChart.js        # Bar chart for quantity sold per product
├── reorderBarChart.js        # Chart showing reorder quantity and shelf life
├── revenueLineChart.js       # Line chart for yearly revenue trends
│
├── README.md                 # Project documentation and usage instructions
```
## How To Run
1. Download or clone this repository to your local machine.

2. Ensure that all files and folders remain in the same directory (including the img folder, dataset, scripts, and HTML files).

3. Open Command Prompt (Windows) or Terminal (macOS/Linux).
    Navigate to the project folder using:
    cd path/to/your/project

    Start a local HTTP server by running:
    python -m http.server 8000

4. Open your web browser and go to: 'http://localhost:8000'
