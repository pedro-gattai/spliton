import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { tonConnectUIProps } from './config/tonConnect';
import { TelegramProvider } from "@/components/TelegramProvider";
import { Dashboard } from "./pages/Dashboard";
import { Groups } from "./pages/Groups";
import { History } from "./pages/History";
import { Profile } from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <TonConnectUIProvider {...tonConnectUIProps}>
    <QueryClientProvider client={queryClient}>
      <TelegramProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/history" element={<History />} />
              <Route path="/profile" element={<Profile />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </TelegramProvider>
    </QueryClientProvider>
  </TonConnectUIProvider>
);

export default App;
