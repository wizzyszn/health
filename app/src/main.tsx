import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Provider } from "react-redux";
import { store } from "@/config/stores/store.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { scan } from "react-scan";
import { useRegisterSW } from "virtual:pwa-register/react";

const queryClient = new QueryClient();
scan({
  enabled: false,
});

function AppWithSW() {
  // autoUpdate is set in vite.config.ts; this hook handles the update cycle
  useRegisterSW({ immediate: true });
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <App />
      </Provider>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWithSW />
  </StrictMode>,
);
