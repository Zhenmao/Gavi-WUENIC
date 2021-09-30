const VIS_BAR_CHART_DATA_URL = "data/dtp3-data-total.csv";

Promise.all([d3.csv(VIS_BAR_CHART_DATA_URL)]).then(([totalCSV]) => {
  const { total } = visProcessData(totalCSV);

  const tooltip = new VisTooltip();

  new VisBar({
    data: total,
    tooltip,
  });

  new VisBarKey();
});
