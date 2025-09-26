import { Routes, Route, Navigate, useNavigate } from "react-router-dom"; // Removed BrowserRouter
import { useEffect } from "react";
import Index from "../pages/Index";
import HomePortal from "../pages/HomePortal"; // Import the new HomePortal component
import LoginPage from "../pages/LoginPage"; // Import the new LoginPage component
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
import ForgotPasswordPage from "../pages/ForgotPasswordPage"; // Import ForgotPasswordPage
import ResetPasswordPage from "../pages/ResetPasswordPage"; // Import ResetPasswordPage
import AuthenticatedLayout from "../components/AuthenticatedLayout"; // Import AuthenticatedLayout
import UnauthenticatedLayout from "../components/UnauthenticatedLayout"; // Import UnauthenticatedLayout
import { useAuth } from "../context/AuthContext"; // Import useAuth hook from context
import { setGlobalTriggerLogout } from "../lib/api"; // Import setGlobalTriggerLogout

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

  // If not authenticated and not loading, render the HomePortal page within the UnauthenticatedLayout
  if (!isAuthenticated) {
    return (
      <UnauthenticatedLayout>
        <HomePortal />
      </UnauthenticatedLayout>
    );
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
    return <Navigate to="/signin" replace />; // Redirect to /signin instead of /
  }

  return children;
};

const AppRoutes = () => {
  const { user, isLoading, triggerLogout } = useAuth(); // Get user, isLoading, and triggerLogout from useAuth

  useEffect(() => {
    // Set the global logout function from AuthContext
    setGlobalTriggerLogout(triggerLogout);
  }, [triggerLogout]);

  if (isLoading) {
    return <div>Loading application...</div>; // Show a global loading indicator
  }

  return (
    <Routes>
      <Route path="/" element={<AuthRedirect />} /> {/* Use AuthRedirect for the root path */}
      <Route path="/pricing" element={<UnauthenticatedLayout><Index /></UnauthenticatedLayout>} /> {/* Public pricing page, using the original Index page */}
      <Route path="/signin" element={<LoginPage />} /> {/* Dedicated login page */}
      <Route path="/forgot-password" element={<UnauthenticatedLayout><ForgotPasswordPage /></UnauthenticatedLayout>} /> {/* Forgot password page */}
      <Route path="/reset-password" element={<UnauthenticatedLayout><ResetPasswordPage /></UnauthenticatedLayout>} /> {/* Reset password page */}
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
  );
};

export default AppRoutes;
