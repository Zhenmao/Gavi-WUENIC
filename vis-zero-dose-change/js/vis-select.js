class VisSelect {
  constructor({ el, options, initValue, onChange }) {
    this.el = el;
    this.options = options;
    this.initValue = initValue;
    this.onChange = onChange;
    this.render();
  }

  render() {
    d3.select(this.el)
      .on("change", (event) => {
        this.onChange(event.currentTarget.value);
      })
      .selectAll("option")
      .data(this.options)
      .join("option")
      .attr("value", (d) => d.value)
      .attr("selected", (d) => (d.value === this.initValue ? "selected" : null))
      .text((d) => d.value);
  }

  updateOptions({ options, initValue }) {
    this.options = options;
    this.initValue = initValue;
    this.render();
    this.onChange(initValue);
  }
}
