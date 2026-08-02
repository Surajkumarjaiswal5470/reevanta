import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import "@/index.css";
import App from "@/App";
import { WishlistProvider } from "@/context/WishlistContext";
import { CurrencyProvider } from "@/context/CurrencyContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <WishlistProvider>
          <App />
        </WishlistProvider>
      </CurrencyProvider>
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  </React.StrictMode>,
);
