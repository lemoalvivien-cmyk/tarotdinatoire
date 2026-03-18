import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";

// ── Sentry — must init before React renders ──────────────────────────────────
initSentry();

// ── Force dark (éthéré) mode globally — unconditional ───────────────────────
document.documentElement.classList.add('dark');

// App mounting — debug stripped in production by esbuild.drop

createRoot(document.getElementById("root")!).render(<App />);
