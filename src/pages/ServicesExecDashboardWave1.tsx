import mockupHtml from "@/assets/services-exec-dashboard-wave1-v25.html?raw";

export default function ServicesExecDashboardWave1() {
  return (
    <iframe
      srcDoc={mockupHtml}
      title="Toptal Services Performance — Wave 1 Dashboard v25.0"
      style={{ width: "100vw", height: "100vh", border: "none", display: "block" }}
    />
  );
}
