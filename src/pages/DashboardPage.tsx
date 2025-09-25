import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, setUser, isAuthenticated, logout, isLoading } = useAuth(); // Destructure logout and isLoading

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { // Only navigate if not loading and not authenticated
      navigate("/"); // Redirect to landing page if not authenticated
    }
  }, [isAuthenticated, isLoading, navigate]); // Add isLoading to dependencies

  useEffect(() => {
    if (!isAuthenticated) {
      // This block is now redundant due to the new useEffect above
      // navigate("/"); // Redirect to landing page if not authenticated
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const data = await api.get<{ user: { id: string; username: string; email: string; credits: number } }>(
          "/api/auth/profile"
        );
        setUser(data.user);
      } catch (error: unknown) {
        const err = error as Error & { status?: number; body?: unknown };
        toast({
          title: "Failed to fetch profile",
          description: (err?.body as { message?: string })?.message || err?.message || "An error occurred.",
          variant: "destructive",
        });
        if (err?.status === 401 || err?.status === 403) {
          navigate("/");
        }
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, navigate, setUser, toast]);

  const handleLogout = () => {
    logout(); // Call the logout function from useAuth
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    // Navigation will now be handled by the useEffect watching isAuthenticated
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="text-center">
        <p className="text-lg">Welcome to your Dashboard, {user?.username || "User"}!</p>
        {user?.credits !== undefined && (
          <p className="text-xl font-semibold mt-4">
            Available Credits: <span className="text-primary">{user.credits}</span>
          </p>
        )}
        <p className="text-muted-foreground mt-2">Navigate using the menu above.</p>
      </div>
    </div>
  );
};

export default DashboardPage;
