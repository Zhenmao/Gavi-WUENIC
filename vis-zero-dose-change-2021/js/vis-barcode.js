class VisBarcode {
  constructor({ data }) {
    this.data = data;
    this.resize = this.resize.bind(this);
    this.init();
  }

  init() {
    this.margin = {
      top: 40,
      bottom: 40,
    };
    this.height = 480;
    this.trackWidth = 20;
    this.barcodeWidth = 32;

    this.labelN = 3;

    this.color = d3
      .scalePoint()
      .domain([
        "#742039",
        "#d01e49",
        "#ef4249",
        "#fdbe22",
        "#a5ce41",
        "#59bb5f",
        "#19b1c0",
      ])
      .range([0, 100]);

    const [min, max] = d3.extent(this.data.values(), (d) => d.dtp1ValueChange);
    const extreme = Math.max(Math.abs(min), max);
    this.y = d3
      .scaleLinear()
      .domain([-extreme, extreme])
      .range([this.height - this.margin.bottom, this.margin.top]);

    this.displayData = [...this.data.values()].sort((a, b) =>
      d3.ascending(a.dtp1ValueChange, b.dtp1ValueChange)
    );

    this.bisect = d3.bisector((d) => d.dtp1ValueChange).center;

    this.container = d3.select("#vis-barcode");

    this.svg = this.container
      .append("svg")
      .attr("class", "chart-svg")
      .on("pointermove", (event) => {
        const [_, ym] = d3.pointer(event);
        const yv = this.y.invert(ym);
        const i = this.bisect(this.displayData, yv);
        const d = this.displayData[i];
        if (d.numericId !== this.highlighted) {
          this.container.dispatch("highlight", {
            detail: d.numericId,
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
      .data(this.color.domain())
      .join("stop")
      .attr("offset", (d) => `${Math.round(this.color(d))}%`)
      .attr("stop-color", (d) => d);

    this.g = this.svg.append("g");

    this.g
      .append("text")
      .attr("fill", "currentColor")
      .attr("y", this.margin.top - 8)
      .selectAll("tspan")
      .data(["ZD children", "Increase in"])
      .join("tspan")
      .attr("x", -this.trackWidth / 2)
      .attr("dy", (d, i) => `${-i * 1.2}em`)
      .text((d) => d);

    this.g
      .append("text")
      .attr("fill", "currentColor")
      .attr("y", this.height - this.margin.bottom + 8)
      .selectAll("tspan")
      .data(["Decrease in", "ZD children"])
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
      .attr("width", this.trackWidth)
      .attr("height", this.height - this.margin.bottom - this.margin.top);

    this.barcode = this.g
      .append("g")
      .attr("class", "barcodes")
      .selectAll(".barcode")
      .data(this.displayData, (d) => d.numericId)
      .join((enter) =>
        enter
          .append("g")
          .attr("class", "barcode")
          .attr("transform", (d) => `translate(0,${this.y(d.dtp1ValueChange)})`)
          .call((g) =>
            g
              .append("line")
              .attr("class", "barcode__line")
              .attr("x1", -this.barcodeWidth / 2)
              .attr("x2", this.barcodeWidth / 2)
          )
          .call((g) =>
            g
              .filter(
                (d, i) =>
                  i < this.labelN ||
                  i > this.displayData.length - this.labelN - 1
              )
              .append("text")
              .attr("class", "barcode__label")
              .attr("dy", "0.35em")
              .attr("fill", "currentColor")
              .attr("x", -this.barcodeWidth / 2 - 4)
              .attr("text-anchor", "end")
              .text((d) => d.id)
          )
      );

    this.resize();
    window.addEventListener("resize", this.resize);
  }

  resize() {
    this.width = this.container.node().clientWidth;

    this.svg.attr("viewBox", [-this.width / 2, 0, this.width, this.height]);
  }

  highlight(id) {
    this.highlighted = id;
    if (id) {
      const d = this.data.get(id);
      this.tooltip.show(this.tooltipContent(d));
      this.tooltip.move(this.width / 2, this.y(d.dtp1ValueChange));
      this.barcode.classed("is-highlighted", function (e) {
        if (e.numericId === id) {
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
    const formattedValueChange =
      d.dtp1ValueChange === 0
        ? "No Change"
        : d3.format("+,")(d.dtp1ValueChange);

    return `
      <dl>
        <div>
          <dt>Country</dt>
          <dd>${d.country}</dd>
        </div>
        <div>
          <dt>ZD Children Change</dt>
          <dd>${formattedValueChange}</dd>
        </div>
      </dl>
    `;
  }
}
