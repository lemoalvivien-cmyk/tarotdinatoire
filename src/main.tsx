import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ── Force dark (éthéré) mode globally — unconditional ───────────────────────
document.documentElement.classList.add('dark');

createRoot(document.getElementById("root")!).render(<App />);

