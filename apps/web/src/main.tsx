import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="flex h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">MiniDrive</h1>
    </div>
  </StrictMode>,
);
