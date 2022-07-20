function visProcessData(csv, codes) {
  const accessor = {
    numericId: (d) =>
      codes.find((e) => e["Alpha-3 code"] === d.iso3)["Numeric"],
    id: (d) => d.iso3,
    country: (d) => d.cname,
    vaccine: (d) => d.vaccine,
    year: (d) => +d.year,
    coverage: (d) => +d.coverage,
    zeroDose: (d) => +d.zero_dose,
  };

  const data = d3.rollup(
    csv,
    (v) => {
      const dtp3PercentageChange =
        accessor.coverage(
          v.find(
            (d) => accessor.vaccine(d) === "dtp3" && accessor.year(d) === 2021
          )
        ) -
        accessor.coverage(
          v.find(
            (d) => accessor.vaccine(d) === "dtp3" && accessor.year(d) === 2020
          )
        );
      const dtp1ValueChange =
        accessor.zeroDose(
          v.find(
            (d) => accessor.vaccine(d) === "dtp1" && accessor.year(d) === 2021
          )
        ) -
        accessor.zeroDose(
          v.find(
            (d) => accessor.vaccine(d) === "dtp1" && accessor.year(d) === 2020
          )
        );
      return {
        dtp3PercentageChange,
        dtp1ValueChange,
        country: accessor.country(v[0]),
        id: accessor.id(v[0]),
        numericId: accessor.numericId(v[0]),
      };
    },
    accessor.numericId
  );

  return data;
}
