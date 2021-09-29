class VisForceTree {
  constructor({ data, tooltip }) {
    this.data = data;
    this.tooltip = tooltip;
    this.resize = this.resize.bind(this);
    this.ticked = this.ticked.bind(this);
    this.dragstarted = this.dragstarted.bind(this);
    this.dragged = this.dragged.bind(this);
    this.dragended = this.dragended.bind(this);
    this.init();
  }

  init() {
    this.height = 640;
    this.rNonLeaf = 6;

    this.r = d3.scaleSqrt().range([2, 32]);

    this.simulation = d3
      .forceSimulation()
      .force("charge", d3.forceManyBody().strength(-200))
      .force(
        "link",
        d3
          .forceLink()
          .id((d) => d.id)
          .distance(30)
          .strength(1)
      )
      .force(
        "collide",
        d3
          .forceCollide()
          .radius((d) => (d.rOutline || d.r) + 1)
          .iterations(2)
      )
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .on("tick", this.ticked);

    this.drag = d3
      .drag()
      .on("start", this.dragstarted)
      .on("drag", this.dragged)
      .on("end", this.dragended);

    this.container = d3.select("#vis-force-tree").classed("force-tree", true);
    this.svg = this.container.append("svg");
    this.g = this.svg.append("g");
    this.link = this.g.append("g").attr("class", "links").selectAll(".link");
    this.node = this.g.append("g").attr("class", "nodes").selectAll(".node");

    window.addEventListener("resize", this.resize);
    this.resize();
    this.wrangle();
  }

  resize() {
    this.width = this.container.node().clientWidth;

    this.svg.attr("viewBox", [
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height,
    ]);

    if (this.displayData) this.render();
  }

  wrangle() {
    if (!this.displayData) {
      this.r.domain([0, d3.max(this.data, (d) => Math.abs(d.zdChange))]).nice();
    }

    const group = d3.group(
      this.data,
      (d) => d.region,
      (d) => d.pefTire
    );
    const root = d3.hierarchy(group);
    root.data[0] = "World";
    root.each((d) => {
      if (d.children) {
        d.id = d
          .ancestors()
          .map((d) => d.data[0])
          .join("|");
        d.r = this.rNonLeaf;
      } else {
        d.id = d.data.id;
        d.r = this.r(Math.abs(d.data.zdChange));
        if (d.data.fragility === "Fragile") {
          d.rOutline = d.r + 3;
        }
      }
    });
    const nodes = root.descendants();
    const links = root.links().map((d) => ({
      source: d.source.id,
      target: d.target.id,
    }));
    this.displayData = {
      links,
      nodes,
    };

    this.render();
  }

  render() {
    this.simulation.stop();

    const old = new Map(this.node.data().map((d) => [d.id, d]));
    this.displayData.nodes = this.displayData.nodes.map((d) =>
      Object.assign(old.get(d.id) || {}, d)
    );

    this.renderLinks();
    this.renderNodes();

    this.simulation.nodes(this.displayData.nodes);
    this.simulation.force("link").links(this.displayData.links);
    this.simulation.alpha(1).restart();
  }

  renderLinks() {
    this.link = this.link
      .data(this.displayData.links, (d) => `${d.source.id}-${d.target.id}`)
      .join((enter) =>
        enter.append("line").attr("class", "link").attr("stroke", "#ccc")
      );
  }

  renderNodes() {
    this.node = this.node
      .data(this.displayData.nodes, (d) => d.id)
      .join((enter) =>
        enter
          .append("g")
          .attr("class", "node")
          .call((g) =>
            g
              .append("circle")
              .attr("class", "node-circle")
              .attr("stroke-width", 1.5)
              .attr("stroke", (d) => {
                if (d.children) {
                  return "#00A1DF";
                } else {
                  return "#84BD00";
                }
              })
              .attr("fill", (d) => {
                if (d.children) {
                  return "#fff";
                } else {
                  if (d.data.zdChange > 0) {
                    return "#84BD00";
                  } else {
                    return "#fff";
                  }
                }
              })
              .attr("r", (d) => d.r)
          )
          .call((g) =>
            g
              .filter((d) => d.rOutline)
              .append("circle")
              .attr("class", "node-outline")
              .attr("stroke", "#84BD00")
              .attr("stroke-width", 1.5)
              .attr("stroke-dasharray", "2")
              .attr("fill", "none")
              .attr("pointer-events", "all")
              .attr("r", (d) => d.rOutline)
          )
          .call(this.drag)
          .on("mouseenter", (event, d) => {
            this.node
              .filter((e) => e === d)
              .call((g) =>
                g
                  .select(".node-circle")
                  .style("stroke", "#ED9B33")
                  .style("fill", (d) =>
                    !d.children && d.data.zdChange > 0 ? "#ED9B33" : null
                  )
              )
              .call((g) =>
                g.select(".node-outline").style("stroke", "#ED9B33")
              );
            if (this.isDragging) return;
            const content = this.tooltipContent(d);
            this.tooltip.show(content);
          })
          .on("mousemove", (event, d) => {
            if (this.isDragging) return;
            this.tooltip.move(event);
          })
          .on("mouseleave", (event, d) => {
            this.node
              .filter((e) => e === d)
              .call((g) =>
                g
                  .select(".node-circle")
                  .style("stroke", null)
                  .style("fill", null)
              )
              .call((g) => g.select(".node-outline").style("stroke", null));
            if (this.isDragging) return;
            this.tooltip.hide();
          })
      );
  }

  ticked() {
    this.node.attr("transform", (d) => `translate(${d.x},${d.y})`);

    this.link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);
  }

  dragstarted(event, d) {
    this.tooltip.hide();
    this.isDragging = true;
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  dragended(event, d) {
    this.isDragging = false;
    if (!event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  tooltipContent(d) {
    if (!d.parent) {
      return `
        <div>${d.data[0]}</div>
      `;
    } else if (d.children) {
      return `
        ${d.id
          .split("|")
          .reverse()
          .slice(1)
          .map(
            (d) => `
          <div>${d}</div>
        `
          )
          .join("")}
      `;
    } else {
      return `
        <div>${d.data.region}</div>
        <div>${d.data.pefTire}</div>
        <div>${d.data.country}</div>
        <div>Zero Dose Change: ${d3.format("+,")(d.data.zdChange)}</div>
      `;
    }
  }
}
