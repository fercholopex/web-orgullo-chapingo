import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import markup from "./markup/home.html?raw";
import { LegacyPage } from "./LegacyPage.jsx";
import "../js/main.js";

function HomePage() {
  useEffect(() => {
    window.teamChapingoInitializeMain?.();
  }, []);

  return <LegacyPage markup={markup} />;
}

createRoot(document.getElementById("root")).render(<HomePage />);
