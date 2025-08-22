import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Cart from "./pages/Cart";
import Renewal from "./pages/Renewal";
import NotFound from "./pages/NotFound";
import MockStripeCheckout from "./pages/MockStripeCheckout";
import PaymentSuccess from "./pages/PaymentSuccess";
import SubscriptionPage from "./pages/SubscriptionPage";
import DashboardPage from "./pages/DashboardPage";
import { useAuth } from "./hooks/use-auth"; // Import useAuth hook

const queryClient = new QueryClient();

// AuthRedirect component to handle redirection for logged-in users
const AuthRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or a loading spinner/component
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Index />;
};

// ProtectedRoute component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading authentication...</div>; // Or a loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthRedirect />} /> {/* Use AuthRedirect for the root path */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/renewal" element={<Renewal />} />
          <Route path="/checkout" element={<MockStripeCheckout />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><div>Settings Page (Placeholder)</div></ProtectedRoute>} /> {/* Placeholder for settings */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
