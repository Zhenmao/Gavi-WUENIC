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
    zeroDosePercentage: (d) => +d.pct_zero_dose,
  };

  const data = d3.rollup(
    csv,
    (v) => {
      const values = new Map();
      [2020, 2021].forEach((year) => {
        const dtp3PercentagePrevious = accessor.coverage(
          v.find(
            (d) =>
              accessor.vaccine(d) === "dtp3" && accessor.year(d) === year - 1
          )
        );
        const dtp3PercentageCurrent = accessor.coverage(
          v.find(
            (d) => accessor.vaccine(d) === "dtp3" && accessor.year(d) === year
          )
        );
        const dtp3PercentageChange =
          dtp3PercentageCurrent - dtp3PercentagePrevious;
        const dtp1PercentageChange =
          accessor.zeroDosePercentage(
            v.find(
              (d) => accessor.vaccine(d) === "dtp1" && accessor.year(d) === year
            )
          ) -
          accessor.zeroDosePercentage(
            v.find(
              (d) =>
                accessor.vaccine(d) === "dtp1" && accessor.year(d) === year - 1
            )
          );
        const dtp1ValueChange =
          accessor.zeroDose(
            v.find(
              (d) => accessor.vaccine(d) === "dtp1" && accessor.year(d) === year
            )
          ) -
          accessor.zeroDose(
            v.find(
              (d) =>
                accessor.vaccine(d) === "dtp1" && accessor.year(d) === year - 1
            )
          );
        values.set(year, {
          dtp3PercentagePrevious,
          dtp3PercentageCurrent,
          dtp3PercentageChange,
          dtp1PercentageChange,
          dtp1ValueChange,
        });
      });
      return {
        values,
        country: accessor.country(v[0]),
        id: accessor.id(v[0]),
        numericId: accessor.numericId(v[0]),
      };
    },
    accessor.numericId
  );

  return data;
}
