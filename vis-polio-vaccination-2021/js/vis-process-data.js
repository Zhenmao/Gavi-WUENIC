function visProcessData(casesCSV, vaccinationCSV, codes, world, years) {
  // Year ,Country / Territory / Region,Wild poliovirus Cases,cVDPV Cases
  // Indicator,SpatialDimValueCode,Location,Period,Value

  const accessor = {
    codeAlpha: (d) => d["Alpha-3 code"],
    codeNumeric: (d) => d["Numeric"],
    codeCountry: (d) => d["English short name"],
    casesYear: (d) => +d["Year"],
    casesCountry: (d) => d["Country / Territory / Region"],
    casesWild: (d) => +d["Wild poliovirus Cases"],
    casescVDPV: (d) => +d["cVDPV Cases"],
    casesTotal: (d) => +d["Wild poliovirus Cases"] + +d["cVDPV Cases"],
    vaccinationAlpha: (d) => d["SpatialDimValueCode"],
    vaccinationYear: (d) => +d["Period"],
    vaccinationCountry: (d) => d["Location"],
    vaccinationCoverage: (d) => +d["Value"],
  };

  const codeByCountry = new Map(codes.map((d) => [accessor.codeCountry(d), d]));
  const codeByAlpha = new Map(codes.map((d) => [accessor.codeAlpha(d), d]));
  const codeByNumeric = new Map(codes.map((d) => [accessor.codeNumeric(d), d]));

  let cases = d3.rollup(
    casesCSV.filter(
      (d) => accessor.casesTotal(d) > 0 && years.includes(accessor.casesYear(d))
    ),
    (v) => {
      const values = new Map();
      years.forEach((year) => {
        const d = v.find((e) => accessor.casesYear(e) === year);
        values.set(year, {
          total: d ? accessor.casesTotal(d) : 0,
          wild: d ? accessor.casesWild(d) : 0,
          cVDPV: d ? accessor.casescVDPV(d) : 0,
        });
      });
      const change = new Map();
      change.set(
        years.join(""),
        values.get(years[1]).total - values.get(years[0]).total
      );
      const c = codeByCountry.get(accessor.casesCountry(v[0]));
      const id = accessor.codeAlpha(c);
      const country = accessor.codeCountry(c);
      return {
        country,
        id,
        values,
        change,
      };
    },
    accessor.casesCountry
  );
  cases = new Map([...cases.values()].map((d) => [d.id, d]));

  let vaccination = d3.rollup(
    vaccinationCSV.filter(
      (d) =>
        accessor.vaccinationCoverage(d) > 0 &&
        years.includes(accessor.vaccinationYear(d))
    ),
    (v) => {
      const values = new Map();
      years.forEach((year) => {
        const d = v.find((e) => accessor.vaccinationYear(e) === year);
        values.set(year, d ? accessor.vaccinationCoverage(d) : 0);
      });
      const change = new Map();
      change.set(years.join(""), values.get(years[1]) - values.get(years[0]));
      const id = accessor.vaccinationAlpha(v[0]);
      const c = codeByAlpha.get(id);
      const country = accessor.codeCountry(c);
      const numericId = accessor.codeNumeric(c);
      return {
        country,
        id,
        numericId,
        values,
        change,
      };
    },
    accessor.vaccinationCountry
  );
  vaccination = new Map([...vaccination.values()].map((d) => [d.id, d]));

  // Remove Antarctica
  world.objects.countries.geometries =
    world.objects.countries.geometries.filter((d) => d.id !== "010");

  world.objects.countries.geometries.forEach((g) => {
    const c = codeByNumeric.get(g.id);
    g.id = c ? accessor.codeAlpha(c) : g.id;
  });

  const data = {
    cases,
    vaccination,
    world,
  };

  return data;
}
