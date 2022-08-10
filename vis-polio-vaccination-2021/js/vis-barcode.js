class VisBarcode {
  constructor({ data, years }) {
    this.data = data;
    this.years = years;
    this.resize = this.resize.bind(this);
    this.init();
  }

  init() {
    this.margin = {
      top: 40,
      bottom: 40,
    };
    this.trackWidth = 20;
    this.barcodeWidth = 32;

    this.labelN = 3;

    const min = d3.min(this.data.values(), (d) =>
      d.change.get(this.years.join(""))
    );
    const max = d3.max(this.data.values(), (d) =>
      d.change.get(this.years.join(""))
    );
    const extreme = Math.max(Math.abs(min), max);

    this.colorInterpolator = d3.piecewise(d3.interpolateRgb.gamma(2.2), [
      "#6B2639",
      "#BF334D",
      "#E18F63",
      "#F3C04B",
      "#ADCD5A",
      "#73B99C",
      "#52AEBE",
    ]);

    this.color = d3
      .scaleSequential(this.colorInterpolator)
      .domain([-extreme, extreme])
      .nice();

    this.value = d3.scaleLinear().domain([0, 100]).range([min, max]);

    this.colorSteps = d3.range(0, 101, 10).map((offset) => {
      const value = this.value(offset);
      const color = this.color(value);
      return {
        offset,
        color,
      };
    });

    this.y = d3.scaleLinear().domain([min, max]);

    this.bisect = d3.bisector((d) => d.change.get(this.years.join(""))).center;

    this.container = d3.select("#vis-barcode");

    this.svg = this.container
      .append("svg")
      .attr("class", "chart-svg")
      .on("pointermove", (event) => {
        const [_, ym] = d3.pointer(event);
        const yv = this.y.invert(ym);
        const i = this.bisect(this.displayData, yv);
        const d = this.displayData[i];
        if (d.id !== this.highlighted) {
          this.container.dispatch("highlight", {
            detail: d.id,
            bubbles: true,
          });
        }
      })
      .on("pointerleave", () => {
        this.container.dispatch("highlight", {
          detail: null,
          bubbles: true,
        });
      })
      .on("touchstart", (event) => event.preventDefault());

    this.tooltip = new VisTooltip({
      container: this.container,
    });

    this.defs = this.svg.append("defs");
    this.defs
      .append("linearGradient")
      .attr("id", "barcode-gradient")
      .attr("gradientTransform", "rotate(90)")
      .selectAll("stop")
      .data(this.colorSteps)
      .join("stop")
      .attr("offset", (d) => `${d.offset}%`)
      .attr("stop-color", (d) => d.color);

    this.g = this.svg.append("g");

    this.topLabel = this.g
      .append("text")
      .attr("fill", this.color(min))
      .attr("y", this.margin.top - 8);
    this.topLabel
      .selectAll("tspan")
      .data(["cases", "Increase in"])
      .join("tspan")
      .attr("x", -this.trackWidth / 2)
      .attr("dy", (d, i) => `${-i * 1.2}em`)
      .text((d) => d);

    this.bottomLabel = this.g.append("text").attr("fill", this.color(max));
    this.bottomLabel
      .selectAll("tspan")
      .data(["Decrease in", "cases"])
      .join("tspan")
      .attr("x", -this.trackWidth / 2)
      .attr("dy", (d, i) => (i === 0 ? "0.71em" : `${i * 1.2}em`))
      .text((d) => d);

    this.track = this.g
      .append("rect")
      .attr("class", "track")
      .attr("fill", "url(#barcode-gradient)")
      .attr("x", -this.trackWidth / 2)
      .attr("y", this.margin.top)
      .attr("width", this.trackWidth);

    this.barcode = this.g
      .append("g")
      .attr("class", "barcodes")
      .selectAll(".barcode");

    this.barcodeLabel = this.g
      .append("g")
      .attr("class", "barcode-labels")
      .selectAll(".barcode-label");

    this.resize();
    window.addEventListener("resize", this.resize);

    this.wrangle();
  }

  resize() {
    this.width = this.container.node().clientWidth;
    this.height = this.container.node().clientHeight;

    this.y.range([this.margin.top, this.height - this.margin.bottom]);

    this.svg.attr("viewBox", [-this.width / 2, 0, this.width, this.height]);

    if (this.displayData) this.render();
  }

  wrangle() {
    this.displayData = [...this.data.values()].sort((a, b) =>
      d3.ascending(
        a.change.get(this.years.join("")),
        b.change.get(this.years.join(""))
      )
    );

    this.labelData = this.displayData.filter(
      (d, i) => i < this.labelN || i > this.displayData.length - this.labelN - 1
    );

    this.render();
  }

  render() {
    this.bottomLabel.attr("y", this.height - this.margin.bottom + 8);

    this.track.attr(
      "height",
      this.height - this.margin.bottom - this.margin.top
    );

    this.barcode = this.barcode
      .data(this.displayData, (d) => d.numericId)
      .join((enter) =>
        enter
          .append("line")
          .attr("class", "barcode")
          .attr("x1", -this.barcodeWidth / 2)
          .attr("x2", this.barcodeWidth / 2)
      )
      .attr(
        "transform",
        (d) => `translate(0,${this.y(d.change.get(this.years.join("")))})`
      );

    this.barcodeLabel = this.barcodeLabel
      .data(this.labelData, (d) => d.numericId)
      .join((enter) =>
        enter
          .append("text")
          .attr("class", "barcode-label")
          .attr("dy", "0.35em")
          .attr("fill", "currentColor")
          .attr("x", -this.barcodeWidth / 2 - 4)
          .attr("text-anchor", "end")
      )
      .attr(
        "transform",
        (d) => `translate(0,${this.y(d.change.get(this.years.join("")))})`
      )
      .text((d) => d.id);

    this.barcode
      .transition()
      .attr(
        "transform",
        (d) => `translate(0,${this.y(d.change.get(this.years.join("")))})`
      );

    let previousLabelY = -Infinity;
    const labelYMinDistance = 12;
    this.barcodeLabel.transition().attr("transform", (d) => {
      const labelY = this.y(d.change.get(this.years.join("")));
      previousLabelY =
        labelY - previousLabelY < labelYMinDistance
          ? previousLabelY + labelYMinDistance
          : labelY;
      return `translate(0,${previousLabelY})`;
    });
  }

  highlight(id) {
    this.highlighted = id;
    if (id && this.data.has(id)) {
      const d = this.data.get(id);
      this.tooltip.show(this.tooltipContent(d));
      this.tooltip.move(
        this.width / 2,
        this.y(d.change.get(this.years.join("")))
      );
      this.barcode.classed("is-highlighted", function (e) {
        if (e.id === id) {
          d3.select(this).raise();
          return true;
        }
        return false;
      });
    } else {
      this.tooltip.hide();
      this.barcode.classed("is-highlighted", false);
    }
  }

  tooltipContent(d) {
    const formatValue = d3.format(",");
    const previous = d.values.get(this.years[0]);
    const current = d.values.get(this.years[1]);
    const change = d.change.get(this.years.join(""));
    const formattedChange =
      change === 0 ? "No Change" : d3.format("+,")(change);
    return `
      <dl>
        <div>
          <dt>Country</dt>
          <dd>${d.country}</dd>
        </div>
        <div>
          <dt>Polio cases in ${this.years[0]}</dt>
          <dd>Total: ${formatValue(previous.total)}</dd>
          <dd>Wild: ${formatValue(previous.wild)}</dd>
          <dd>cVDPD: ${formatValue(previous.cVDPV)}</dd>
        </div>
        <div>
          <dt>Polio cases in ${this.years[1]}</dt>
          <dd>Total: ${formatValue(current.total)}</dd>
          <dd>Wild: ${formatValue(current.wild)}</dd>
          <dd>cVDPD: ${formatValue(current.cVDPV)}</dd>
        </div>
        <div>
          <dt>Total cases Change</dt>
          <dd>${formattedChange}</dd>
        </div>
      </dl>
    `;
  }
}
