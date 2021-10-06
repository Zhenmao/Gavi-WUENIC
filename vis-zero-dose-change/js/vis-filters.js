class VisFilters {
  constructor({ data, onFiltered }) {
    this.data = data;
    this.onFiltered = onFiltered;
    this.filterValues = {
      fragility: "ALL",
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
