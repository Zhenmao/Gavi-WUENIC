class VisTooltip {
  constructor({ container }) {
    this.container = container;
    this.tooltip = this.container.append("div").attr("class", "vis-tooltip");
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.move = this.move.bind(this);
  }

  show(content) {
    this.tooltip.html(content).classed("is-visible", true);
    this.containerBox = this.container.node().getBoundingClientRect();
    this.tooltipBox = this.tooltip.node().getBoundingClientRect();
  }

  hide() {
    this.tooltip.classed("is-visible", false);
  }

  move(x0, y0) {
    let x = x0 - this.tooltipBox.width / 2;
    if (x < 0) {
      x = 0;
    } else if (x + this.tooltipBox.width > this.containerBox.width) {
      x = this.containerBox.width - this.tooltipBox.width;
    }
    let y = y0 - this.tooltipBox.height - 8;
    if (y < 0) {
      y = y0 + 8;
    }
    this.tooltip.style("transform", `translate(${x}px,${y}px)`);
  }
}
