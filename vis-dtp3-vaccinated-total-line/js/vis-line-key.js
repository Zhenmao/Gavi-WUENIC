class VisLineKey {
  constructor() {
    this.init();
  }

  init() {
    this.container = d3.select("#vis-line-chart-key-container");
    this.note = this.container.append("div");
    this.render();
  }

  render() {
    this.renderNote();
  }

  renderNote() {
    this.note
      .selectAll(".note-item")
      .data([
        "Weighted relative difference in DTP3 vaccination in 2020 and 2021, compared to 2019 for Gavi68 countries",
      ])
      .join((enter) => enter.append("div").attr("class", "note-item"))
      .text((d) => d);
  }
}
