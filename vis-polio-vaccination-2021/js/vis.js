const VIS_CASES_DATA_URL = "data/polio-cases.csv";
const VIS_VACCINATION_DATA_URL = "data/polio-vaccination.csv";
const VIS_COUNTRY_CODES_URL = "data/iso-3166-country-codes.csv";
const VIS_WORLD_TOPOJSON_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

Promise.all([
  d3.csv(VIS_CASES_DATA_URL),
  d3.csv(VIS_VACCINATION_DATA_URL),
  d3.csv(VIS_COUNTRY_CODES_URL),
  d3.json(VIS_WORLD_TOPOJSON_URL),
]).then(([casesCSV, vaccinationCSV, codes, world]) => {
  const years = [2019, 2021];

  const data = visProcessData(casesCSV, vaccinationCSV, codes, world, years);

  const map = new VisMap({
    data: data.vaccination,
    world: data.world,
    years,
  });

  const barcode = new VisBarcode({
    data: data.cases,
    years,
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
