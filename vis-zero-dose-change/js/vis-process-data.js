function visProcessData(csv, codes) {
  const accessor = {
    numericId: (d) =>
      codes.find((e) => e["Alpha-3 code"] === d["Country Code"])["Numeric"],
    id: (d) => d["Country Code"],
    country: (d) => d.Country,
    region: (d) => d.gavi_region,
    pefTire: (d) => d.pef_type,
    fragility: (d) => d.fragility_2020,
    segment: (d) => d.segments_2020,
    incomeLevel: (d) => d.wb_short_2020,
    zdChange: (d) => +d.zd_change,
  };

  const data = csv.map((d) => {
    return Object.keys(accessor).reduce((o, key) => {
      o[key] = accessor[key](d);
      return o;
    }, {});
  });

  return data;
}
