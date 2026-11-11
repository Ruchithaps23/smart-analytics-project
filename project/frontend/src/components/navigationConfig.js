export const NAV_GROUPS = [
  { label: "OVERVIEW", items: [
    { id: "dashboard", label: "Executive Dashboard", icon: "dashboard", availability: "live" },
    { id: "analytics", label: "Analytics", icon: "analytics", availability: "live" },
  ] },
  { label: "DATA MANAGEMENT", items: [
    { id: "datasets", label: "Dataset Library", icon: "datasets", availability: "preview" },
    { id: "upload", label: "Upload Dataset", icon: "upload", availability: "preview" },
    { id: "dataset-preview", label: "Dataset Preview", icon: "preview", availability: "preview" },
    { id: "mapping", label: "Column Mapping", icon: "mapping", availability: "preview" },
  ] },
  { label: "DATA INTELLIGENCE", items: [
    { id: "quality", label: "Data Quality", icon: "quality", availability: "preview" },
    { id: "eda", label: "Exploratory Data Analysis", icon: "exploratory", availability: "preview" },
  ] },
  { label: "PREDICTIVE ANALYTICS", items: [
    { id: "forecast", label: "Forecasting", icon: "forecast", availability: "live" },
    { id: "profit", label: "Profit Prediction", icon: "profit", availability: "preview" },
    { id: "anomalies", label: "Anomaly Detection", icon: "anomaly", availability: "preview" },
    { id: "segmentation", label: "Customer Segmentation", icon: "segments", availability: "partial" },
  ] },
  { label: "DECISION INTELLIGENCE", items: [
    { id: "alerts", label: "Alerts", icon: "alerts", availability: "live" },
    { id: "recommendations", label: "Recommendations", icon: "recommendations", availability: "live" },
  ] },
  { label: "REPORTS", items: [
    { id: "reports", label: "Reports & Downloads", icon: "reports", availability: "preview" },
  ] },
];

export const PAGE_TITLES = Object.fromEntries(
  NAV_GROUPS.flatMap((group) => group.items.map(({ id, label }) => [id, label])),
);
