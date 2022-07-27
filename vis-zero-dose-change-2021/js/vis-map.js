class VisMap {
  constructor({ data, world, selectedYear }) {
    this.data = data;
    this.world = world;
    this.selectedYear = selectedYear;
    this.resize = this.resize.bind(this);
    this.init();
  }

  init() {
    // Remove Antarctica
    this.world.objects.countries.geometries =
      this.world.objects.countries.geometries.filter((d) => d.id !== "010");

    this.countries = topojson.feature(this.world, this.world.objects.countries);

    this.margin = {
      top: 16,
      right: 4,
      bottom: 16,
      left: 4,
    };

    this.projection = d3.geoNaturalEarth1().rotate([-8, 0]);
    this.geoPath = d3.geoPath(this.projection);

    this.color = d3
      .scaleThreshold()
      .domain([-6.5, -3.5, -0.5, 0.5, 3.5, 6.5])
      .range([
        "#6B2639",
        "#BF334D",
        "#E18F63",
        "#F3C04B",
        "#ADCD5A",
        "#73B99C",
        "#52AEBE",
      ]);

    this.container = d3.select("#vis-map");
    this.svg = this.container.append("svg").attr("class", "chart-svg");

    this.tooltip = new VisTooltip({
      container: this.container,
    });

    this.legend = new VisMapLegend({
      color: this.color,
      selectedYear: this.selectedYear,
    });

    this.g = this.svg.append("g");
    this.country = this.g
      .append("g")
      .attr("class", "countries")
      .selectAll(".country");

    window.addEventListener("resize", this.resize);
    this.resize();
  }

  resize() {
    this.width = this.container.node().clientWidth;

    this.projection.fitWidth(
      this.width - this.margin.left - this.margin.bottom,
      this.countries
    );

    this.height =
      this.margin.top +
      this.margin.bottom +
      Math.ceil(this.geoPath.bounds(this.countries)[1][1]);

    this.projection.fitExtent(
      [
        [this.margin.left, this.margin.top],
        [this.width - this.margin.left, this.height - this.margin.bottom],
      ],
      this.countries
    );

    this.svg.attr("viewBox", [0, 0, this.width, this.height]);

    this.render();
  }

  render() {
    this.country = this.country
      .data(this.countries.features, (d) => d.id)
      .join((enter) =>
        enter
          .append("path")
          .attr("class", "country")
          .attr("fill", "#d8d8d8")
          .call((enter) =>
            enter
              .filter((d) => this.data.has(d.id))
              .each((d) => {
                this.data.get(d.id).feature = d;
              })
              .on("pointerenter", (event, d) => {
                this.container.dispatch("highlight", {
                  detail: d.id,
                  bubbles: true,
                });
              })
              .on("pointerleave", () => {
                this.container.dispatch("highlight", {
                  detail: null,
                  bubbles: true,
                });
              })
          )
      )
      .attr("d", this.geoPath);
    this.country.transition().attr("fill", (d) => {
      if (this.data.has(d.id)) {
        return this.color(
          this.data.get(d.id).values.get(this.selectedYear).dtp3PercentageChange
        );
      } else {
        return "#d8d8d8";
      }
    });
  }

  highlight(id) {
    if (id) {
      const d = this.data.get(id);
      this.tooltip.show(this.tooltipContent(d));
      this.tooltip.move(...this.geoPath.centroid(d.feature));
      this.country.classed("is-highlighted", function (f) {
        if (f.id === id) {
          d3.select(this).raise();
          return true;
        }
        return false;
      });
    } else {
      this.tooltip.hide();
      this.country.classed("is-highlighted", false);
    }
  }

  tooltipContent(d) {
    const v = d.values.get(this.selectedYear);
    const formattedPercentagePrevious = v.dtp3PercentagePrevious + "%";
    const formattedPercentageCurrent = v.dtp3PercentageCurrent + "%";
    const formattedPercentageChange =
      v.dtp3PercentageChange === 0
        ? "No Change"
        : d3.format("+")(v.dtp3PercentageChange);

    return `
      <dl>
        <div>
          <dt>Country</dt>
          <dd>${d.country}</dd>
        </div>
        <div>
          <dt>DTP3 Coverage ${this.selectedYear - 1}</dt>
          <dd>${formattedPercentagePrevious}</dd>
        </div>
        <div>
          <dt>DTP3 Coverage ${this.selectedYear}</dt>
          <dd>${formattedPercentageCurrent}</dd>
        </div>
        <div>
          <dt>PP Difference</dt>
          <dd>${formattedPercentageChange}</dd>
        </div>
      </dl>
    `;
  }

  updateSelectedYear(selectedYear) {
    this.selectedYear = selectedYear;
    this.render();

    this.legend.updateSelectedYear(selectedYear);
  }
}
