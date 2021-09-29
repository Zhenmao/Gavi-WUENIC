const VIS_BAR_CHART_DATA_URL = "data/dtp3-data-total.csv";
const VIS_LINE_CHART_DATA_URL = "data/dtp3-data-by-region.csv";

Promise.all([
  d3.csv(VIS_BAR_CHART_DATA_URL),
  d3.csv(VIS_LINE_CHART_DATA_URL),
]).then(([totalCSV, regionsCSV]) => {
  const { total, regions } = visProcessData(totalCSV, regionsCSV);

  const tooltip = new VisTooltip();

  new VisBar({
    data: total,
    tooltip,
  });

  new VisBarKey();

  new VisLine({
    data: regions,
    tooltip,
  });
});
