import { HelmetProvider } from "react-helmet-async";
import { ToastProvider } from "./components/toast";
import { PWAInstallBanner } from "./components/PWAInstallBanner";

// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import AppRouter from "./config/routes/index.route";

const App = () => {
  return (
    <HelmetProvider>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      <ToastProvider />
      <AppRouter />
      <PWAInstallBanner />
    </HelmetProvider>
  );
};

export default App;
