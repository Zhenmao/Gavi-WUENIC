class VisMapLegend {
  constructor({ color }) {
    this.color = color;
    this.render();
  }

  render() {
    this.container = d3
      .select("#vis-map-legend")
      .classed("vis-stack--xs", true);

    this.container
      .append("div")
      .text(
        "Percentage point (pp) difference in DTP3 vaccination, 2020 to 2021"
      );

    this.container
      .append("div")
      .attr("class", "swatches")
      .selectAll(".swatch")
      .data(this.color.range().reverse())
      .join("div")
      .attr("class", "swatch")
      .call((div) =>
        div
          .append("div")
          .attr("class", "swatch__swatch")
          .style("background-color", (d) => d)
      )
      .call((div) =>
        div
          .append("div")
          .attr("class", "swatch__label")
          .text((d) => {
            const [min, max] = this.color.invertExtent(d);
            if (min === undefined) return `<${Math.floor(max)}`;
            if (max === undefined) return `>${Math.ceil(min)}`;
            if (min * max > 0) return `${Math.ceil(min)} to ${Math.floor(max)}`;
            return "No Change";
          })
      );
  }
}
