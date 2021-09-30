class VisLine {
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
      right: 140,
      bottom: 88,
      left: 72,
    };
    this.height = 480;

    this.x = d3.scalePoint();
    this.xTime = d3.scaleTime();
    this.y = d3
      .scaleLinear()
      .range([this.height - this.margin.bottom, this.margin.top]);
    this.line = d3
      .line()
      .x((d, i) => this.x(this.displayData.dates[i]))
      .y((d) => this.y(d))
      .curve(d3.curveMonotoneX);

    this.container = d3.select("#vis-line-chart").classed("line-chart", true);
    this.svg = this.container.append("svg").style("pointer-events", "none");
    this.g = this.svg.append("g");
    this.gLines = this.g.append("g");
    this.gX = this.g.append("g").attr("class", "axis");
    this.gXYearLines = this.gX.append("g");
    this.gXMonths = this.gX.append("g");
    this.gXYears = this.gX.append("g");
    this.gY = this.g.append("g").attr("class", "axis");
    this.gFocus = this.g.append("g").attr("class", "focus").attr("opacity", 0);
    this.focusLine = this.gFocus.append("line");
    this.focusDots = this.gFocus.append("g");

    this.iActive = null;
    this.svg
      .on("mousemove", (event, d) => {
        const pointer = d3.pointer(event, this.svg.node());
        const xm = this.xTime.invert(pointer[0]);
        const i = d3.bisectCenter(this.displayData.dates, xm);
        const dateActive = this.displayData.dates[i];
        if (i !== this.iActive) {
          this.iActive = i;
          const content = this.tooltipContent();
          this.tooltip.show(content);
          this.gFocus.attr("opacity", 1);
          this.focusLine.attr(
            "transform",
            `translate(${this.x(dateActive)},0)`
          );
          this.focusDot.attr(
            "transform",
            (d) => `translate(${this.x(dateActive)},${this.y(d.values[i])})`
          );
        }
        let x =
          this.x(dateActive) +
          this.svg.node().getBoundingClientRect().x -
          this.tooltip.containerBox.x -
          this.tooltip.tooltipBox.width -
          8;
        if (x < 0) {
          x = x + this.tooltip.tooltipBox.width + 16;
        }
        let y =
          event.clientY -
          this.tooltip.containerBox.y -
          this.tooltip.tooltipBox.height -
          8;
        if (y < 0) {
          y = event.clientY - this.tooltip.containerBox.y + 8;
        }
        this.tooltip.tooltip.style("transform", `translate(${x}px,${y}px)`);
      })
      .on("mouseleave", (event, d) => {
        this.tooltip.hide();
        this.gFocus.attr("opacity", 0);
        this.iActive = null;
      });

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

    if (this.displayData) {
      this.xTime.range([
        this.x.range()[0] + this.x.step() / 2,
        this.x.range()[1] - this.x.step() / 2,
      ]);
      this.render();
    }
  }

  wrangle() {
    if (!this.displayData) {
      this.data = this.data.filter((d) => !!VIS_CONST.regionName[d.region]);

      this.y.domain(d3.extent(this.data, (d) => d.diff)).nice();
    }

    const series = Array.from(
      d3.rollup(
        this.data,
        (v) => ({
          region: VIS_CONST.regionName[v[0].region],
          label: `${VIS_CONST.regionName[v[0].region]} (${v[0].region})`,
          color: VIS_CONST.regionColor[v[0].region],
          values: v.sort((a, b) => d3.ascending(a.date, b.date)),
        }),
        (d) => d.region
      ),
      ([, v]) => v
    );

    const dates = series[0].values.map((d) => d.date);

    this.x.domain(dates);

    this.xTime
      .domain([dates[0], dates[dates.length - 1]])
      .range([
        this.x.range()[0] + this.x.step() / 2,
        this.x.range()[1] - this.x.step() / 2,
      ]);

    series.forEach((d) => (d.values = d.values.map((d) => d.diff)));

    this.displayData = {
      series,
      dates,
    };

    if (this.displayData) this.render();
  }

  render() {
    this.renderXAxis();
    this.renderYAxis();
    if (this.isEntered) {
      this.renderFocus();
      this.renderLines();
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
        this.displayData.dates.filter((d, i) => i !== 0 && d.getMonth() === 0)
      )
      .join((enter) =>
        enter
          .append("line")
          .attr("y1", this.margin.bottom - 32)
          .attr("y2", -this.height + this.margin.bottom - this.margin.top)
      )
      .attr(
        "transform",
        (d) => `translate(${this.x(d) - this.x.step() / 2},0)`
      );

    this.gXMonths
      .attr("transform", `translate(0,32)`)
      .selectAll("text")
      .data(
        this.displayData.dates.filter((d, i) =>
          this.x.step() >= 40 ? true : i % 2 === 0
        )
      )
      .join((enter) =>
        enter
          .append("text")
          .attr("dy", "0.32em")
          .attr("fill", "currentColor")
          .text((d) => d3.timeFormat("%b")(d))
      )
      .attr("transform", (d) => `rotate(-90)translate(0,${this.x(d)})`);

    this.gXYears
      .attr("transform", `translate(0,56)`)
      .selectAll("text")
      .data(d3.groups(this.displayData.dates, (d) => d.getFullYear()))
      .join((enter) =>
        enter
          .append("text")
          .attr("text-anchor", "middle")
          .attr("fill", "currentColor")
          .text(([year]) => year)
      )
      .attr("transform", ([, d]) => {
        const x0 = this.x(d[0]);
        const x1 = this.x(d[d.length - 1]);
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

  renderLines() {
    const t = this.svg
      .transition()
      .duration(1000)
      .on("end", () => {
        this.gLine.select("path").attr("stroke-dasharray", null);
        this.svg.style("pointer-events", null);
      });

    this.gLine = this.gLines
      .selectAll("g")
      .data(this.displayData.series, (d) => d.region)
      .join((enter) =>
        enter
          .append("g")
          .call((g) =>
            g
              .append("path")
              .attr("fill", "none")
              .attr("stroke", (d) => d.color)
              .attr("stroke-width", 1.5)
              .attr("d", (d) => this.line(d.values))
              .each(function () {
                const totalLength = this.getTotalLength();
                d3.select(this)
                  .attr("stroke-dasharray", totalLength)
                  .attr("stroke-dashoffset", totalLength);
              })
          )
          .call((g) =>
            g
              .append("text")
              .attr("fill", (d) => d.color)
              .attr("dy", "0.71em")
              .text((d) => d.label)
              .call(this.wrap, this.margin.right - 16)
              .each(function (d) {
                d.labelHeight = this.getBBox().height;
              })
          )
      );

    this.gLine
      .select("path")
      .attr("d", (d) => this.line(d.values))
      .transition(t)
      .attr("stroke-dashoffset", 0);

    this.gLine
      .select("text")
      .attr(
        "transform",
        (d) =>
          `translate(${this.width - this.margin.right + 8},${
            this.y(d.values[d.values.length - 1]) - d.labelHeight / 2
          })`
      );
  }

  renderFocus() {
    this.focusLine
      .attr("stroke", "currentColor")
      .attr("stroke-dasharray", 5)
      .attr("y1", this.margin.top)
      .attr("y2", this.height - this.margin.bottom);

    this.focusDot = this.focusDots
      .selectAll("circle")
      .data(this.displayData.series, (d) => d.region)
      .join((enter) =>
        enter
          .append("circle")
          .attr("fill", (d) => d.color)
          .attr("stroke", "#fff")
          .attr("r", 4)
      );
  }

  tooltipContent() {
    return `
      <div>
        <div>Month</div>
        <div>${d3.timeFormat("%B %Y")(
          this.displayData.dates[this.iActive]
        )}</div>
      </div>
      ${this.displayData.series
        .slice()
        .sort((a, b) =>
          d3.descending(a.values[this.iActive], b.values[this.iActive])
        )
        .map(
          (d) => `
        <div>
          <div style="color:${d.color}">${d.label}</div>
          <div>${d3.format(".1%")(d.values[this.iActive])}</div>
        </div>
      `
        )
        .join("")}
    `;
  }

  wrap(text, width) {
    text.each(function () {
      let text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineHeight = 1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text
          .text(null)
          .append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", dy + "em");
      while ((word = words.pop())) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text
            .append("tspan")
            .attr("x", 0)
            .attr("y", y)
            .attr("dy", lineHeight + "em")
            .text(word);
        }
      }
    });
  }
}
