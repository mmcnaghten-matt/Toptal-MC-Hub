import mockupHtml from "@/assets/services-exec-dashboard-mockup.html?raw";

export default function ServicesExecDashboardMockup() {
  return (
    <iframe
      srcDoc={mockupHtml}
      title="Toptal Services Performance — Dashboard Suite (Mock)"
      style={{ width: "100vw", height: "100vh", border: "none", display: "block" }}
    />
  );
}
