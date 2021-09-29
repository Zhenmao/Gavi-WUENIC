class VisBarKey {
  constructor() {
    this.init();
  }

  init() {
    this.container = d3.select("#vis-bar-chart-key-container");
    this.barLegend = this.container.append("div");
    this.render();
  }

  render() {
    this.renderBarLegend();
  }

  renderBarLegend() {
    this.barLegend
      .selectAll(".legend-item")
      .data([
        {
          label: "Each rectangle represents 1%",
          color: VIS_CONST.generalSwatchColor,
        },
      ])
      .join((enter) =>
        enter
          .append("div")
          .attr("class", "legend-item")
          .call((enter) =>
            enter
              .append("div")
              .attr("class", "legend-swatch--rect")
              .style("background-color", (d) => d.color)
          )
          .call((enter) =>
            enter
              .append("div")
              .attr("class", "legend-label")
              .text((d) => d.label)
          )
      );
  }
}
