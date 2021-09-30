class VisBar {
  constructor({ data, tooltip }) {
    this.data = data;
    this.tooltip = tooltip;
    this.resize = this.resize.bind(this);
    this.init();
  }

  init() {
    this.isEntered = false;

    this.margin = {
      top: 8,
      right: 16,
      bottom: 88,
      left: 72,
    };
    this.height = 480;

    this.x = d3.scaleBand().padding(0.2);
    this.y = d3
      .scaleLinear()
      .range([this.height - this.margin.bottom, this.margin.top]);

    this.container = d3.select("#vis-bar-chart").classed("bar-chart", true);
    this.svg = this.container.append("svg");
    this.g = this.svg.append("g");
    this.gBars = this.g.append("g");
    this.gGrid = this.g.append("g").style("pointer-events", "none");
    this.gX = this.g.append("g").attr("class", "axis");
    this.gXYearLines = this.gX.append("g");
    this.gXMonths = this.gX.append("g");
    this.gXYears = this.gX.append("g");
    this.gY = this.g.append("g").attr("class", "axis");

    window.addEventListener("resize", this.resize);
    this.resize();
    this.wrangle();
    visEnterObserver({
      target: this.container.node(),
      callback: () => {
        this.isEntered = true;
        this.render();
      },
    });
  }

  resize() {
    this.width = this.container.node().clientWidth;

    this.x.range([this.margin.left, this.width - this.margin.right]);

    this.svg.attr("viewBox", [0, 0, this.width, this.height]);
    if (this.displayData) this.render();
  }

  wrangle() {
    if (!this.displayData) {
      this.x.domain(this.data.map((d) => d.date));

      this.y.domain(d3.extent(this.data, (d) => d.diff)).nice();
    }

    this.displayData = this.data.map((d) =>
      Object.assign(
        {
          color:
            d.diff >= 0
              ? VIS_CONST.relativeDiffColor.positive
              : VIS_CONST.relativeDiffColor.negative,
        },
        d
      )
    );

    if (this.displayData) this.render();
  }

  render() {
    this.renderXAxis();
    this.renderYAxis();
    this.renderGrid();
    if (this.isEntered) {
      this.renderBars();
    }
  }

  renderXAxis() {
    this.gX
      .attr("transform", `translate(0,${this.height - this.margin.bottom})`)
      .selectAll(".axis-title")
      .data(["Monthly change in DTP3 coverage"])
      .join((enter) =>
        enter
          .append("text")
          .attr("class", "axis-title")
          .attr("fill", "currentColor")
          .attr("text-anchor", "middle")
          .text((d) => d)
      )
      .attr(
        "transform",
        `translate(${
          (this.margin.left + this.width - this.margin.right) / 2
        },80)`
      );

    this.gXYearLines
      .selectAll("line")
      .data(
        this.displayData.filter((d, i) => i !== 0 && d.date.getMonth() === 0)
      )
      .join((enter) =>
        enter
          .append("line")
          .attr("y1", this.margin.bottom - 32)
          .attr("y2", -this.height + this.margin.bottom - this.margin.top)
      )
      .attr(
        "transform",
        (d) =>
          `translate(${
            this.x(d.date) - (this.x.step() - this.x.bandwidth()) / 2
          },0)`
      );

    this.gXMonths
      .attr("transform", `translate(0,32)`)
      .selectAll("text")
      .data(
        this.displayData.filter((d, i) =>
          this.x.step() >= 40 ? true : i % 2 === 0
        )
      )
      .join((enter) =>
        enter
          .append("text")
          .attr("dy", "0.32em")
          .attr("fill", "currentColor")
          .text((d) => d3.timeFormat("%b")(d.date))
      )
      .attr(
        "transform",
        (d) =>
          `rotate(-90)translate(0,${this.x(d.date) + this.x.bandwidth() / 2})`
      );

    this.gXYears
      .attr("transform", `translate(0,56)`)
      .selectAll("text")
      .data(d3.groups(this.displayData, (d) => d.date.getFullYear()))
      .join((enter) =>
        enter
          .append("text")
          .attr("text-anchor", "middle")
          .attr("fill", "currentColor")
          .text(([year]) => year)
      )
      .attr("transform", ([, d]) => {
        const x0 = this.x(d[0].date);
        const x1 = this.x(d[d.length - 1].date) + this.x.bandwidth();
        const xt = (x0 + x1) / 2;
        return `translate(${xt},0)`;
      });
  }

  renderYAxis() {
    this.gY
      .attr("transform", `translate(${this.margin.left},0)`)
      .call(
        d3
          .axisLeft(this.y)
          .ticks((this.margin.top + this.height - this.margin.bottom) / 50)
          .tickFormat(d3.format(".0%"))
          .tickSize(0)
          .tickPadding(8)
      )
      .call((g) =>
        g
          .selectAll(".tick line")
          .filter((d) => d === 0)
          .attr("x2", this.width - this.margin.right - this.margin.left)
          .attr("stroke-dasharray", 5)
      )
      .call((g) =>
        g
          .selectAll(".axis-title")
          .data(["Relative difference (%)"])
          .join((enter) =>
            enter
              .append("text")
              .attr("class", "axis-title")
              .attr("fill", "currentColor")
              .attr("text-anchor", "middle")
              .attr("dy", 0)
              .attr("transform", () => {
                const xt = this.margin.left - 20;
                const yt =
                  (this.margin.top + this.height - this.margin.bottom) / 2;
                return `rotate(-90)translate(${-yt},${-xt})`;
              })
              .text((d) => d)
          )
      );
  }

  renderBars() {
    const t = this.svg.transition().duration(500);
    this.bar = this.gBars
      .selectAll("rect")
      .data(this.displayData)
      .join((enter) =>
        enter
          .append("rect")
          .attr("y", this.y(0))
          .attr("height", 0)
          .on("mouseenter", (event, d) => {
            this.bar
              .filter((e) => e === d)
              .style("fill", VIS_CONST.highlightColor);
            const content = this.tooltipContent(d);
            this.tooltip.show(content);
          })
          .on("mousemove", (event, d) => {
            this.tooltip.move(event);
          })
          .on("mouseleave", (event, d) => {
            this.bar.filter((e) => e === d).style("fill", null);
            this.tooltip.hide();
          })
      )
      .attr("fill", (d) => d.color)
      .attr("transform", (d) => `translate(${this.x(d.date)},0)`)
      .attr("width", this.x.bandwidth());
    this.bar
      .transition(t)
      .attr("y", (d) => (d.diff > 0 ? this.y(d.diff) : this.y(0)))
      .attr("height", (d) => Math.abs(this.y(d.diff) - this.y(0)));
  }

  renderGrid() {
    this.gGrid
      .attr("stroke", "#fff")
      .selectAll("line")
      .data(d3.range(this.y.domain()[0], this.y.domain()[1], 0.01))
      .join((enter) => enter.append("line").attr("x1", this.margin.left))
      .attr("transform", (d) => `translate(0,${this.y(d)})`)
      .attr("x2", this.width - this.margin.right);
  }

  tooltipContent(d) {
    return `
      <div>
        <div>Month</div>
        <div>${d3.timeFormat("%B %Y")(d.date)}</div>
      </div>
      <div>
        <div>Relative Difference</div>
        <div>${d3.format(".1%")(d.diff)}</div>
      </div>
    `;
  }
}
