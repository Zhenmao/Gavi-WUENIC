const VIS_LINE_CHART_DATA_URL = "data/dtp3-data-by-region.csv";

Promise.all([d3.csv(VIS_LINE_CHART_DATA_URL)]).then(([regionsCSV]) => {
  const { regions } = visProcessData(regionsCSV);

  const tooltip = new VisTooltip();

  new VisLine({
    data: regions,
    tooltip,
  });
});
