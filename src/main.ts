import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./assets/main.css";
import router from "@/router/router";
// Initialize window state for Google Apps Script compatibility

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(pinia);

app.mount("#app");

if (typeof window !== "undefined") {
  window.__markwhen_initial_state = window.__markwhen_initial_state || {};
  window.__markwhen_initial_state.initialized = true;

  window.__timeline_updateData = (options) => {
    if (!options || typeof options.rawText !== "string") {
      return;
    }
    window.dispatchEvent(
      new CustomEvent("timeline-data", { detail: { rawText: options.rawText } })
    );
  };
}

// vue devtools - disabled to prevent connection errors
// if (import.meta.env.DEV) {
//   const script = document.createElement("script");
//   script.src = "http://localhost:8098";
//   script.onerror = () => {
//     console.debug("Vue DevTools not available at localhost:8098");
//   };
//   document.head.append(script);
// }
