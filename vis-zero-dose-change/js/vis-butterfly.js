class VisButterfly {
  constructor({ data, tooltip }) {
    this.data = data;
    this.tooltip = tooltip;
    this.resize = this.resize.bind(this);
    this.init();
  }

  init() {
    this.margin = {
      top: 4,
      right: 80,
      bottom: 4,
      left: 56,
    };
    this.rowHeight = 40;
    this.rowRectHeight = 12;

    this.x = d3.scaleLinear();
    this.y = d3.scalePoint().padding(0.5);

    this.container = d3.select("#vis-butterfly").classed("butterfly", true);
    this.svg = this.container.append("svg");
    this.g = this.svg.append("g");
    this.zeroTick = this.g.append("line").attr("class", "butterfly-zero-tick");
    this.row = this.g
      .append("g")
      .attr("class", "butterfly-rows")
      .selectAll(".butterfly-row");

    window.addEventListener("resize", this.resize);
    this.resize();
    this.wrangle();
  }

  resize() {
    this.width = this.container.node().clientWidth;

    this.x.range([this.margin.left, this.width - this.margin.right]);

    if (this.displayData) this.render();
  }

  wrangle() {
    if (!this.displayData) {
      this.x.domain(d3.extent(this.data, (d) => d.zdChange));
    }

    this.displayData = this.data
      .map((d) => Object.assign({}, d))
      .sort((a, b) => d3.descending(a.zdChange, b.zdChange));

    this.height =
      this.displayData.length * this.rowHeight +
      this.margin.top +
      this.margin.bottom;

    this.y
      .domain(this.displayData.map((d) => d.id))
      .range([this.margin.top, this.height - this.margin.bottom]);

    this.render();
  }

  render() {
    this.svg.attr("viewBox", [0, 0, this.width, this.height]);
    this.renderZeroTick();
    this.renderRows();
  }

  renderZeroTick() {
    this.zeroTick
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.2)
      .attr("x1", this.x(0))
      .attr("x2", this.x(0))
      .attr("y2", this.height);
  }

  renderRows() {
    this.row = this.row
      .data(this.displayData, (d) => d.id)
      .join((enter) =>
        enter
          .append("g")
          .attr("class", "butterfly-row")
          .call((g) =>
            g
              .append("text")
              .attr("class", "butterfly-row-label")
              .attr("fill", "currentColor")
              .attr("x", 0)
              .attr("y", -6)
              .text((d) => d.country)
          )
          .call((g) =>
            g
              .append("text")
              .attr("class", "butterfly-row-value")
              .attr("fill", (d) => {
                if (d.zdChange > 0) {
                  return VIS_CONST.zdChangeColor.positive;
                } else {
                  return VIS_CONST.zdChangeColor.negative;
                }
              })
              .attr("text-anchor", (d) => {
                if (d.zdChange > 0) {
                  return "start";
                } else {
                  return "end";
                }
              })
              .attr("dy", "0.32em")
              .attr("y", this.rowRectHeight / 2)
              .text((d) => d3.format("+,")(d.zdChange))
          )
          .call((g) =>
            g
              .append("rect")
              .attr("class", "butterfly-row-rect")
              .attr("fill", (d) => {
                if (d.zdChange > 0) {
                  return VIS_CONST.zdChangeColor.positive;
                } else {
                  return VIS_CONST.zdChangeColor.negative;
                }
              })
              .attr("height", this.rowRectHeight)
          )
          .on("mouseenter", (event, d) => {
            this.row
              .filter((e) => e === d)
              .call((g) =>
                g
                  .select(".butterfly-row-rect")
                  .style("fill", VIS_CONST.highlightColor)
              )
              .call((g) =>
                g
                  .select(".butterfly-row-value")
                  .style("fill", VIS_CONST.highlightColor)
              );
            const content = this.tooltipContent(d);
            this.tooltip.show(content);
          })
          .on("mousemove", (event, d) => {
            this.tooltip.move(event);
          })
          .on("mouseleave", (event, d) => {
            this.row
              .filter((e) => e === d)
              .call((g) => g.select(".butterfly-row-rect").style("fill", null))
              .call((g) =>
                g.select(".butterfly-row-value").style("fill", null)
              );
            this.tooltip.hide();
          })
      )
      .attr("transform", (d) => `translate(0,${this.y(d.id)})`)
      .call((g) =>
        g.select(".butterfly-row-value").attr("x", (d) => {
          if (d.zdChange > 0) {
            return this.x(d.zdChange) + 4;
          } else {
            return this.x(d.zdChange) - 4;
          }
        })
      )
      .call((g) =>
        g
          .select(".butterfly-row-rect")
          .attr("x", (d) => this.x(Math.min(0, d.zdChange)))
          .attr("width", (d) => Math.abs(this.x(d.zdChange) - this.x(0)))
      );
  }

  tooltipContent(d) {
    return `
        <div>
          <div>Country</div>
          <div>${d.country}</div>
        </div>
        <div>
          <div>Gavi Region</div>
          <div>${d.region}</div>
        </div>
        <div>
          <div>Fragility</div>
          <div>${d.fragility}</div>
        </div>
        <div>
          <div>Income Level</div>
          <div>${d.incomeLevel}</div>
        </div>
        <div>
          <div>Zero Dose Change</div>
          <div>${d3.format("+,")(d.zdChange)}</div>
        </div>
      `;
  }

  updateData(data) {
    this.data = data;
    this.wrangle();
  }
}
