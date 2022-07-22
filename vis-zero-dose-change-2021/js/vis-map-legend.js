class VisMapLegend {
  constructor({ color, selectedYear }) {
    this.color = color;
    this.selectedYear = selectedYear;
    this.render();
  }

  render() {
    this.container = d3
      .select("#vis-map-legend")
      .classed("vis-stack--xs", true);

    this.title = this.container.append("div");

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

    this.renderTitle();
  }

  renderTitle() {
    this.title.text(
      `Percentage point (pp) difference in DTP3 vaccination, ${
        this.selectedYear - 1
      } to ${this.selectedYear}`
    );
  }

  updateSelectedYear(selectedYear) {
    this.selectedYear = selectedYear;
    this.renderTitle();
  }
}
