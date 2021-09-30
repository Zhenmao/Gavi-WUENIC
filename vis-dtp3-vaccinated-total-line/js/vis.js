const VIS_LINE_CHART_DATA_URL = "data/dtp3-data-total.csv";

Promise.all([d3.csv(VIS_LINE_CHART_DATA_URL)]).then(([totalCSV]) => {
  const { total } = visProcessData(totalCSV);

  const tooltip = new VisTooltip();

  new VisLineKey();

  new VisLine({
    data: total,
    tooltip,
  });
});
