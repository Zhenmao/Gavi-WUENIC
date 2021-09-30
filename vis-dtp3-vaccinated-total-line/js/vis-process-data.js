function visProcessData(totalCSV) {
  const total = totalCSV
    .map((d) => ({
      date: new Date(+d.year, +d.month - 1),
      diff: +d.diff,
    }))
    .filter((d) => !isNaN(d.diff));
  total.sort((a, b) => d3.ascending(a.date, b.date));

  return {
    total,
  };
}
