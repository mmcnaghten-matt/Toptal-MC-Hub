import mockupHtml from "@/assets/services-exec-dashboard-vision-v23.html?raw";

export default function ServicesExecDashboardVision() {
  return (
    <iframe
      srcDoc={mockupHtml}
      title="Toptal Services Performance — Future Vision v23.0"
      style={{ width: "100vw", height: "100vh", border: "none", display: "block" }}
    />
  );
}
