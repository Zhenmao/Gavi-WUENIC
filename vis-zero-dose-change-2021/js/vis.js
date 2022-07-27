const VIS_MAP_DATA_URL = "data/zero-dose-change.csv";
const VIS_COUNTRY_CODES_URL = "data/iso-3166-country-codes.csv";
const VIS_WORLD_TOPOJSON_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

Promise.all([
  d3.csv(VIS_MAP_DATA_URL),
  d3.csv(VIS_COUNTRY_CODES_URL),
  d3.json(VIS_WORLD_TOPOJSON_URL),
]).then(([mapCSV, codes, world]) => {
  const data = visProcessData(mapCSV, codes);

  let selectedYear = +d3.select("input[name='year']:checked").attr("value");

  const map = new VisMap({
    data,
    world,
    selectedYear,
  });

  const barcode = new VisBarcode({
    data,
    selectedYear,
  });

  d3.selectAll("input[name='year']").on("change", (event) => {
    selectedYear = +event.target.value;
    map.updateSelectedYear(selectedYear);
    barcode.updateSelectedYear(selectedYear);
  });

  d3.select("#vis")
    .on("highlight", (event) => {
      const id = event.detail;
      map.highlight(id);
      barcode.highlight(id);
    })
    .on("activelegenditemchange", (event) => {
      const activeLegendItemColor = event.detail;
      map.filter(activeLegendItemColor);
    });
});
