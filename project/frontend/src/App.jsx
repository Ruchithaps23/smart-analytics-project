import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { AppLayout } from "./components/AppLayout";
import { fetchEndpoint } from "./lib/api";
import { getRows, getValue } from "./lib/dataFormatters";
import "./App.css";

const ExecutiveDashboard = lazy(() => import("./pages/ExecutiveDashboard"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const DatasetLibraryPage = lazy(() => import("./pages/data-management/DatasetLibraryPage"));
const UploadDatasetPage = lazy(() => import("./pages/data-management/UploadDatasetPage"));
const DatasetPreviewPage = lazy(() => import("./pages/data-management/DatasetPreviewPage"));
const ColumnMappingPage = lazy(() => import("./pages/data-management/ColumnMappingPage"));
const DataQualityPage = lazy(() => import("./pages/DataQualityPage"));
const EdaPage = lazy(() => import("./pages/EdaPage"));
const ProfitPredictionPage = lazy(() => import("./pages/ProfitPredictionPage"));
const AnomalyDetectionPage = lazy(() => import("./pages/AnomalyDetectionPage"));
const CustomerSegmentationPage = lazy(() => import("./pages/CustomerSegmentationPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const ForecastPage = lazy(() => import("./pages/ExistingPages").then((module) => ({ default: module.ForecastPage })));
const AlertsPage = lazy(() => import("./pages/ExistingPages").then((module) => ({ default: module.AlertsPage })));
const RecommendationsPage = lazy(() => import("./pages/ExistingPages").then((module) => ({ default: module.RecommendationsPage })));

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState({});
  const [monthlySales, setMonthlySales] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [segments, setSegments] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [insights, setInsights] = useState([]);
  const [businessAlerts, setBusinessAlerts] = useState([]);
  const [, setDecisions] = useState([]);
  const [decisionAlerts, setDecisionAlerts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [priorityRecommendations, setPriorityRecommendations] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError("");
      const [
        metricsData,
        monthlySalesData,
        forecastData,
        categoriesData,
        regionsData,
        segmentsData,
        topProductsData,
        insightsData,
        businessAlertsData,
        decisionsData,
        decisionAlertsData,
        recommendationsData,
        priorityRecommendationsData,
      ] = await Promise.all([
        fetchEndpoint("/api/metrics"),
        fetchEndpoint("/api/monthly-sales"),
        fetchEndpoint("/api/forecast"),
        fetchEndpoint("/api/categories"),
        fetchEndpoint("/api/regions"),
        fetchEndpoint("/api/segments"),
        fetchEndpoint("/api/top-products"),
        fetchEndpoint("/api/insights"),
        fetchEndpoint("/api/business-alerts"),
        fetchEndpoint("/api/decisions"),
        fetchEndpoint("/api/decision-alerts"),
        fetchEndpoint("/api/recommendations"),
        fetchEndpoint("/api/priority-recommendations"),
      ]);

      setMetrics(metricsData || {});
      setMonthlySales(getRows(monthlySalesData));
      setForecast(getRows(forecastData));
      setCategories(getRows(categoriesData));
      setRegions(getRows(regionsData));
      setSegments(getRows(segmentsData));
      setTopProducts(getRows(topProductsData));
      setInsights(getRows(insightsData));
      setBusinessAlerts(getRows(businessAlertsData));
      setDecisions(getRows(decisionsData));
      setDecisionAlerts(getRows(decisionAlertsData));
      setRecommendations(getRows(recommendationsData));
      setPriorityRecommendations(getRows(priorityRecommendationsData));
    } catch (requestError) {
      console.error(requestError);
      setError("Unable to load dashboard data. Please check the FastAPI backend connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const categoryChartData = useMemo(() => categories.map((row) => ({
    name: getValue(row, ["category", "Category", "Category of Goods", "name", "Name"]),
    sales: Number(getValue(row, ["sales", "Sales", "total_sales", "Total Sales"])),
    profit: Number(getValue(row, ["profit", "Profit", "total_profit", "Total Profit"])),
  })), [categories]);

  const regionChartData = useMemo(() => regions.map((row) => ({
    name: getValue(row, ["region", "Region", "name", "Name"]),
    sales: Number(getValue(row, ["sales", "Sales", "total_sales", "Total Sales"])),
    profit: Number(getValue(row, ["profit", "Profit", "total_profit", "Total Profit"])),
  })), [regions]);

  const segmentChartData = useMemo(() => segments.map((row) => ({
    name: getValue(row, ["segment", "Segment", "name", "Name"]),
    sales: Number(getValue(row, ["sales", "Sales", "total_sales", "Total Sales"])),
    profit: Number(getValue(row, ["profit", "Profit", "total_profit", "Total Profit"])),
  })), [segments]);

  const historicalChartData = useMemo(() => monthlySales.map((row) => ({
    month: getValue(row, ["month", "Month", "order_month", "date"]),
    sales: Number(getValue(row, ["sales", "Sales", "total_sales", "Total Sales"])),
  })), [monthlySales]);

  const forecastChartData = useMemo(() => forecast.map((row) => ({
    month: getValue(row, ["month", "Month", "forecast_month", "date"]),
    forecast: Number(getValue(row, ["forecast_sales", "Forecast Sales", "forecast", "sales", "predicted_sales"])),
  })), [forecast]);

  function renderActivePage() {
    switch (activePage) {
      case "analytics":
        return <AnalyticsPage categoryChartData={categoryChartData} regionChartData={regionChartData} segmentChartData={segmentChartData} topProducts={topProducts} insights={insights} />;
      case "datasets":
        return <DatasetLibraryPage />;
      case "upload":
        return <UploadDatasetPage />;
      case "dataset-preview":
        return <DatasetPreviewPage />;
      case "mapping":
        return <ColumnMappingPage />;
      case "quality":
        return <DataQualityPage />;
      case "eda":
        return <EdaPage />;
      case "profit":
        return <ProfitPredictionPage />;
      case "anomalies":
        return <AnomalyDetectionPage />;
      case "segmentation":
        return <CustomerSegmentationPage segmentData={segmentChartData} />;
      case "reports":
        return <ReportsPage />;
      case "forecast":
        return <ForecastPage forecast={forecast} forecastChartData={forecastChartData} />;
      case "alerts":
        return <AlertsPage businessAlerts={businessAlerts} decisionAlerts={decisionAlerts} />;
      case "recommendations":
        return <RecommendationsPage recommendations={recommendations} priorityRecommendations={priorityRecommendations} />;
      default:
        return <ExecutiveDashboard metrics={metrics} historicalChartData={historicalChartData} categoryChartData={categoryChartData} regionChartData={regionChartData} businessAlerts={businessAlerts} priorityRecommendations={priorityRecommendations} insights={insights} onNavigate={setActivePage} />;
    }
  }

  const needsApiData = ["dashboard", "analytics", "forecast", "alerts", "recommendations"].includes(activePage);
  const hasMetrics = Object.keys(metrics).length > 0;
  let pageContent = renderActivePage();
  if (needsApiData && loading && !hasMetrics) {
    pageContent = <div className="page-data-state"><span className="loading-orbit"/><strong>Loading live business data</strong><p>Connecting to the existing analytics API.</p></div>;
  } else if (needsApiData && error && !hasMetrics) {
    pageContent = <div className="page-data-state page-data-error"><span className="error-emblem">!</span><strong>Live data is unavailable</strong><p>{error}</p><button className="primary-button" onClick={loadDashboardData}>Retry connection</button></div>;
  }

  return <AppLayout activePage={activePage} onNavigate={setActivePage} onRefresh={loadDashboardData} alertCount={businessAlerts.length + decisionAlerts.length} loading={loading} error={error}><Suspense fallback={<div className="page-data-state" role="status"><span className="loading-orbit"/><strong>Opening workspace</strong><p>Preparing this view.</p></div>}>{pageContent}</Suspense></AppLayout>;
}
