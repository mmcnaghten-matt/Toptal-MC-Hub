import { useEffect } from "react";

const CLOUD_RUN_URL = "https://mc-hub.toptal.tech/";

const App = () => {
  useEffect(() => {
    window.location.replace(CLOUD_RUN_URL);
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", color: "#374151" }}>
      <p>
        This site has moved.{" "}
        <a href={CLOUD_RUN_URL} style={{ color: "#2563eb" }}>
          Go to mc-hub.toptal.tech →
        </a>
      </p>
    </div>
  );
};

export default App;
