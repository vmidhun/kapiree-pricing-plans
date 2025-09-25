import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Index from "../pages/Index";
import Cart from "../pages/Cart";
import Renewal from "../pages/Renewal";
import NotFound from "../pages/NotFound";
import MockStripeCheckout from "../pages/MockStripeCheckout";
import PaymentSuccess from "../pages/PaymentSuccess";
import SubscriptionPage from "../pages/SubscriptionPage";
import DashboardPage from "../pages/DashboardPage";
import JobPositionsPage from "../pages/JobPositionsPage";
import CandidateManagementPage from "../pages/CandidateManagementPage";
import InterviewManagementPage from "../pages/InterviewManagementPage";
import UserManagementPage from "../pages/UserManagementPage";
import RoleManagementPage from "../pages/RoleManagementPage"; // Import RoleManagementPage
import TenantManagementPage from "../pages/TenantManagementPage";
import ReportingAnalyticsPage from "../pages/ReportingAnalyticsPage";
import PricingPlansManagementPage from "../pages/PricingPlansManagementPage";
import AuthenticatedLayout from "../components/AuthenticatedLayout"; // Import AuthenticatedLayout
import { useAuth } from "../context/AuthContext"; // Import useAuth hook from context

// AuthRedirect component to handle redirection for logged-in users
const AuthRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("AuthRedirect - isLoading:", isLoading, "isAuthenticated:", isAuthenticated);
    if (!isLoading && isAuthenticated) {
      console.log("AuthRedirect - Navigating to /dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return <div>Loading authentication...</div>; // Or a loading spinner/component
  }

  // If not authenticated and not loading, render the Index page
  if (!isAuthenticated) {
    return <Index />;
  }

  // If authenticated, but useEffect hasn't redirected yet, show a loading state
  return <div>Redirecting...</div>;
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

const AppRoutes = () => {
  const { user, isLoading } = useAuth(); // Get user and isLoading from useAuth

  if (isLoading) {
    return <div>Loading application...</div>; // Show a global loading indicator
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthRedirect />} /> {/* Use AuthRedirect for the root path */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/renewal" element={<Renewal />} />
        <Route path="/checkout" element={<MockStripeCheckout />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/dashboard" element={<ProtectedRoute><AuthenticatedLayout><DashboardPage /></AuthenticatedLayout></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><AuthenticatedLayout><SubscriptionPage /></AuthenticatedLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AuthenticatedLayout><div>Settings Page (Placeholder)</div></AuthenticatedLayout></ProtectedRoute>} /> {/* Placeholder for settings */}
        <Route path="/jobs" element={<ProtectedRoute><AuthenticatedLayout><JobPositionsPage /></AuthenticatedLayout></ProtectedRoute>} />
        <Route path="/candidates" element={<ProtectedRoute><AuthenticatedLayout><CandidateManagementPage /></AuthenticatedLayout></ProtectedRoute>} />
        <Route path="/interviews" element={<ProtectedRoute><AuthenticatedLayout><InterviewManagementPage /></AuthenticatedLayout></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><AuthenticatedLayout><UserManagementPage key={user?.id} /></AuthenticatedLayout></ProtectedRoute>} />
        <Route path="/roles" element={<ProtectedRoute><AuthenticatedLayout><RoleManagementPage /></AuthenticatedLayout></ProtectedRoute>} /> {/* New route for Role Management */}
        <Route path="/tenants" element={<ProtectedRoute><AuthenticatedLayout><TenantManagementPage /></AuthenticatedLayout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><AuthenticatedLayout><ReportingAnalyticsPage /></AuthenticatedLayout></ProtectedRoute>} />
        <Route path="/pricing-management" element={<ProtectedRoute><AuthenticatedLayout><PricingPlansManagementPage /></AuthenticatedLayout></ProtectedRoute>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
