import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { tonConnectUIProps } from './config/tonConnect';
import { WalletProtectedRoute } from "./components/WalletProtectedRoute";
import { Dashboard } from "./pages/Dashboard";
import { Groups } from "./pages/Groups";
import { History } from "./pages/History";
import { Profile } from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <TonConnectUIProvider {...tonConnectUIProps}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <WalletProtectedRoute>
                <Dashboard />
              </WalletProtectedRoute>
            } />
            <Route path="/groups" element={
              <WalletProtectedRoute>
                <Groups />
              </WalletProtectedRoute>
            } />
            <Route path="/history" element={
              <WalletProtectedRoute>
                <History />
              </WalletProtectedRoute>
            } />
            <Route path="/profile" element={
              <WalletProtectedRoute>
                <Profile />
              </WalletProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </TonConnectUIProvider>
);

export default App;
