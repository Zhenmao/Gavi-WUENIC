class VisFilters {
  constructor({ data, onFiltered }) {
    this.data = data;
    this.onFiltered = onFiltered;
    this.filterValues = {
      fragility: "ALL",
      segment: "ALL",
      incomeLevel: "ALL",
    };
    this.init();
  }

  init() {
    // Fragility
    this.fragilityOptions = [
      { value: "ALL", filter: () => true },
      { value: "Fragile", filter: (d) => d.fragility === "Fragile" },
      { value: "Non-fragile", filter: (d) => d.fragility === "Non-fragile" },
    ];
    new VisSelect({
      el: document.querySelector("#fragility-filter"),
      options: this.fragilityOptions,
      initValue: this.filterValues.fragility,
      onChange: (value) => {
        this.filterValues.fragility = value;
        this.filter();
      },
    });

    // Gavi Segment
    this.segmentOptions = [
      { value: "ALL", filter: () => true },
      { value: "Fragile", filter: (d) => d.segment === "Fragile" },
      { value: "High impact", filter: (d) => d.segment === "High impact" },
      {
        value: "Post-transition",
        filter: (d) => d.segment === "Post-transition",
      },
      { value: "Priority", filter: (d) => d.segment === "Priority" },
      { value: "Standard", filter: (d) => d.segment === "Standard" },
    ];
    new VisSelect({
      el: document.querySelector("#segment-filter"),
      options: this.segmentOptions,
      initValue: this.filterValues.segment,
      onChange: (value) => {
        this.filterValues.segment = value;
        this.filter();
      },
    });

    // Income Level
    this.incomeLevelOptions = [
      { value: "ALL", filter: () => true },
      { value: "LIC", filter: (d) => d.incomeLevel === "LIC" },
      { value: "MIC", filter: (d) => d.incomeLevel === "MIC" },
    ];
    new VisSelect({
      el: document.querySelector("#income-level-filter"),
      options: this.incomeLevelOptions,
      initValue: this.filterValues.incomeLevel,
      onChange: (value) => {
        this.filterValues.incomeLevel = value;
        this.filter();
      },
    });
  }

  filter() {
    const filters = [
      // Fragility
      this.fragilityOptions.find((d) => d.value === this.filterValues.fragility)
        .filter,
      // Gavi Segment
      this.segmentOptions.find((d) => d.value === this.filterValues.segment)
        .filter,
      // Income Level
      this.incomeLevelOptions.find(
        (d) => d.value === this.filterValues.incomeLevel
      ).filter,
    ];
    const filtered = this.data.filter((d) =>
      filters.every((filter) => filter(d))
    );
    this.onFiltered(filtered);
  }
}
