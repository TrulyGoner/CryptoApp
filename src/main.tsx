import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app";
import "@/app/styles/index.css";

const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
mediaQuery.addEventListener("change", () => {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (link) {
    const url = new URL(link.href);
    url.searchParams.set("t", Date.now().toString());
    link.href = url.toString();
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
