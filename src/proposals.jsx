import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import markup from "./markup/proposals.html?raw";
import { LegacyPage } from "./LegacyPage.jsx";

function ProposalsPage() {
  useEffect(() => {
    window.lucide?.createIcons({ attrs: { "stroke-width": 1.8 } });
    import("../js/proposals.js");
  }, []);

  return <LegacyPage markup={markup} />;
}

createRoot(document.getElementById("root")).render(<ProposalsPage />);
