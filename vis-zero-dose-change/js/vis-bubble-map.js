class VisBubbleMap {
  constructor({ data, world, tooltip }) {
    this.data = data;
    this.world = world;
    this.tooltip = tooltip;
    this.resize = this.resize.bind(this);
    this.ticked = this.ticked.bind(this);
    this.init();
  }

  init() {
    // Remove Antarctica
    this.world.objects.countries.geometries =
      this.world.objects.countries.geometries.filter((d) => d.id !== "010");

    this.countries = topojson.feature(this.world, this.world.objects.countries);

    this.margin = {
      top: 4,
      right: 4,
      bottom: 4,
      left: 4,
    };

    this.projection = d3.geoNaturalEarth1().rotate([-8, 0]);
    this.geoPath = d3.geoPath(this.projection);

    this.r = d3.scaleSqrt().range([2, 32]);

    this.simulation = d3
      .forceSimulation()
      .force(
        "collide",
        d3
          .forceCollide()
          .radius((d) => (d.rOutline || d.r) + 1)
          .iterations(2)
      )
      .force(
        "x",
        d3.forceX().x((d) => d.x)
      )
      .force(
        "y",
        d3.forceY().y((d) => d.y)
      )
      .on("tick", this.ticked);

    this.container = d3.select("#vis-bubble-map").classed("bubble-map", true);
    this.svg = this.container.append("svg");
    this.g = this.svg.append("g");
    this.country = this.g
      .append("g")
      .attr("class", "countries")
      .selectAll(".country");
    this.bubble = this.g
      .append("g")
      .attr("class", "bubbles")
      .selectAll(".bubble");

    window.addEventListener("resize", this.resize);
    this.resize();
    this.wrangle();
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

    if (this.displayData) {
      this.displayData.forEach((d) => {
        const centroid = this.geoPath.centroid(d.geo);
        d.x = centroid[0];
        d.y = centroid[1];
      });
      this.render();
    }
  }

  wrangle() {
    if (!this.displayData) {
      this.r.domain([0, d3.max(this.data, (d) => Math.abs(d.zdChange))]).nice();

      this.featureMap = new Map(this.countries.features.map((d) => [d.id, d]));
    }

    this.displayData = this.data.map((d) => {
      const o = Object.assign({}, d);
      o.geo = this.featureMap.get(o.numericId);
      const centroid = this.geoPath.centroid(o.geo);
      o.x = centroid[0];
      o.y = centroid[1];
      o.r = this.r(Math.abs(d.zdChange));
      if (o.fragility === "Fragile") {
        o.rOutline = o.r + 2;
      }
      return o;
    });

    this.render();
  }

  render() {
    this.simulation.stop();

    const old = new Map(this.bubble.data().map((d) => [d.id, d]));
    this.displayData = this.displayData.map((d) =>
      Object.assign(old.get(d.id) || {}, d)
    );

    this.renderCountries();
    this.renderBubbles();

    this.simulation.nodes(this.displayData);
    this.simulation.alpha(1).restart();
  }

  renderCountries() {
    this.country = this.country
      .data(this.countries.features, (d) => d.id)
      .join((enter) =>
        enter
          .append("path")
          .attr("class", "country")
          .attr("stroke", "#eee")
          .attr("fill", "#eee")
      )
      .attr("d", this.geoPath);
  }

  renderBubbles() {
    const t = this.svg.transition();

    this.bubble = this.bubble
      .data(this.displayData, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append("g")
            .attr("class", "bubble")
            .call((g) =>
              g
                .append("circle")
                .attr("class", "bubble-circle")
                .attr("fill", (d) => {
                  if (d.zdChange > 0) {
                    return VIS_CONST.zdChangeColor.positive;
                  } else {
                    return VIS_CONST.zdChangeColor.negative;
                  }
                })
                .attr("r", 0)
            )
            .call((g) =>
              g
                .filter((d) => d.rOutline)
                .append("circle")
                .attr("class", "bubble-outline")
                .attr("stroke", (d) => {
                  if (d.zdChange > 0) {
                    return VIS_CONST.zdChangeColor.positive;
                  } else {
                    return VIS_CONST.zdChangeColor.negative;
                  }
                })
                .attr("stroke-width", 1.5)
                .attr("stroke-dasharray", "2")
                .attr("fill", "none")
                .attr("pointer-events", "all")
                .attr("r", 0)
            )
            .on("mouseenter", (event, d) => {
              this.bubble
                .filter((e) => e === d)
                .call((g) =>
                  g
                    .select(".bubble-circle")
                    .style("fill", VIS_CONST.highlightColor)
                )
                .call((g) =>
                  g
                    .select(".bubble-outline")
                    .style("stroke", VIS_CONST.highlightColor)
                );
              const content = this.tooltipContent(d);
              this.tooltip.show(content);
            })
            .on("mousemove", (event, d) => {
              this.tooltip.move(event);
            })
            .on("mouseleave", (event, d) => {
              this.bubble
                .filter((e) => e === d)
                .call((g) =>
                  g
                    .select(".bubble-circle")
                    .style("stroke", null)
                    .style("fill", null)
                )
                .call((g) => g.select(".bubble-outline").style("stroke", null));
              this.tooltip.hide();
            })
            .call((enter) =>
              enter
                .transition(t)
                .call((t) => t.select(".bubble-circle").attr("r", (d) => d.r))
                .call((t) =>
                  t.select(".bubble-outline").attr("r", (d) => d.rOutline)
                )
            ),
        (update) =>
          update.call((update) =>
            update
              .transition(t)
              .call((t) => t.select(".bubble-circle").attr("r", (d) => d.r))
              .call((t) =>
                t.select(".bubble-outline").attr("r", (d) => d.rOutline)
              )
          ),
        (exit) =>
          exit.call((exit) =>
            exit
              .transition(t)
              .call((t) => t.select(".bubble-circle").attr("r", 0))
              .call((t) => t.select(".bubble-outline").attr("r", 0))
              .remove()
          )
      );
  }

  ticked() {
    this.bubble.attr("transform", (d) => `translate(${d.x},${d.y})`);
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
