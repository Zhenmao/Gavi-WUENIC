function visProcessData(regionsCSV) {
  const regions = regionsCSV
    .map((d) => ({
      date: new Date(+d.year, +d.month - 1),
      diff: +d.diff,
      region: d.who_region,
    }))
    .filter((d) => !isNaN(d.diff));

  return {
    regions,
  };
}
