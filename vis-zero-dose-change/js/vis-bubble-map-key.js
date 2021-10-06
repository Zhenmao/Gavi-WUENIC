class VisBubbleMapKey {
  constructor() {
    this.render();
  }

  render() {
    this.renderDotLegend();
    this.renderSizeLegend();
  }

  renderDotLegend() {
    d3.select("#vis-bubble-map-key-dot-legend")
      .selectAll(".legend-item")
      .data([
        {
          label: "Each country is represented by a circle",
          color: VIS_CONST.generalSwatchColor,
        },
        {
          label:
            "Blue circle represents more zero dose children in 2020 compared to 2019",
          color: VIS_CONST.zdChangeColor.positive,
        },
        {
          label:
            "Green circle represents fewer zero dose children in 2020 compared to 2019",
          color: VIS_CONST.zdChangeColor.negative,
        },
        {
          label: "Outer ring denotes a fragile country",
          color: VIS_CONST.generalSwatchColor,
          class: "dashed-ring",
        },
      ])
      .join((enter) =>
        enter
          .append("div")
          .attr("class", "legend-item")
          .call((enter) =>
            enter
              .append("div")
              .attr("class", (d) =>
                d.class
                  ? `legend-swatch legend-swatch--${d.class}`
                  : "legend-swatch"
              )
              .style("color", (d) => d.color)
          )
          .call((enter) =>
            enter
              .append("div")
              .attr("class", "legend-label")
              .text((d) => d.label)
          )
      );
  }

  renderSizeLegend() {
    const sizeLegend = d3
      .select("#vis-bubble-map-key-size-legend")
      .selectAll(".key-text")
      .data(["Circle size represents the absolute change of zero dose change"])
      .join((enter) =>
        enter
          .append("div")
          .attr("class", "key-text")
          .text((d) => d)
      );
    if (this.r) {
      let ticks = [100, 1000, 10000, 100000, 1000000];
      const marginTop = 4;
      const marginBottom = 24;
      const height = this.r.range()[1] * 2 + marginTop + marginBottom;
      sizeLegend
        .selectAll(".size-legend-items")
        .data([0])
        .join("div")
        .attr("class", "size-legend-items")
        .selectAll(".size-legend-item")
        .data(ticks)
        .join((enter) =>
          enter
            .append("svg")
            .attr("class", "size-legend-item")
            .attr("height", height)
            .call((svg) =>
              svg
                .append("g")
                .call((g) =>
                  g
                    .append("circle")
                    .attr("class", "size-legend-circle")
                    .attr("stroke", VIS_CONST.generalSwatchColor)
                    .attr("fill", "none")
                )
                .call((g) =>
                  g
                    .append("text")
                    .attr("class", "size-legend-label")
                    .attr("fill", "currentColor")
                    .attr("dy", "0.32em")
                    .attr("text-anchor", "middle")
                    .attr("y", marginBottom - 8)
                )
            )
        )
        .call((svg) =>
          svg
            .select(".size-legend-circle")
            .attr("cy", (d) => -this.r(d))
            .attr("r", (d) => this.r(d))
        )
        .call((svg) =>
          svg.select(".size-legend-label").text((d) => d3.format(",")(d))
        )
        .each(function () {
          const svg = d3.select(this);
          let { width } = svg.select("g").node().getBoundingClientRect();
          width = Math.ceil(width);
          svg
            .attr("width", width + 8)
            .attr("viewBox", [
              -(width / 2 + 4),
              -(height - marginBottom),
              width,
              height,
            ]);
        });
    }
  }

  updateR(r) {
    this.r = r;
    this.renderSizeLegend();
  }
}
