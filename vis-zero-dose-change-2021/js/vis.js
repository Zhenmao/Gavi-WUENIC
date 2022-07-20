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

  const map = new VisMap({
    data,
    world,
  });

  const barcode = new VisBarcode({
    data,
  });

  d3.select("#vis").on("highlight", (event) => {
    const id = event.detail;
    map.highlight(id);
    barcode.highlight(id);
  });
});
