const VIS_BUBBLE_MAP_DATA_URL = "data/zero-dose-change.csv";
const VIS_COUNTRY_CODES_URL = "data/iso-3166-country-codes.csv";
const VIS_WORLD_TOPOJSON_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

Promise.all([
  d3.csv(VIS_BUBBLE_MAP_DATA_URL),
  d3.csv(VIS_COUNTRY_CODES_URL),
  d3.json(VIS_WORLD_TOPOJSON_URL),
]).then(([bubbleMapCSV, codes, world]) => {
  const data = visProcessData(bubbleMapCSV, codes);

  const tooltip = new VisTooltip();

  const filters = new VisFilters({
    data,
    onFiltered: (filtered) => {
      bubbleChart.updateData(filtered);
      butterflyChart.updateData(filtered);
    },
  });

  const bubbleChart = new VisBubbleMap({
    data,
    world,
    tooltip,
  });

  const butterflyChart = new VisButterfly({
    data,
    tooltip,
  });
  butterflyChart.resize();
});
