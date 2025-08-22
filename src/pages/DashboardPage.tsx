import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, setUser, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/"); // Redirect to landing page if not authenticated
      return;
    }

    const fetchUserProfile = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return; // Should not happen if isAuthenticated is true

      try {
        const response = await fetch("http://localhost:3000/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user); // Update user context with latest profile data (including credits)
        } else {
          const errorData = await response.json();
          toast({
            title: "Failed to fetch profile",
            description: errorData.message || "An error occurred.",
            variant: "destructive",
          });
          // Optionally log out if profile fetch fails
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Network error",
          description: "Unable to connect to server. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, navigate, setUser, toast]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/"); // Redirect to landing page
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <nav className="space-x-4">
          <Button variant="ghost" onClick={() => navigate("/settings")}>Settings</Button>
          <Button variant="ghost" onClick={() => navigate("/subscription")}>Subscription</Button>
          <Button onClick={handleLogout} variant="outline">Logout</Button>
        </nav>
      </header>
      <div className="text-center">
        <p className="text-lg">Welcome to your Dashboard, {user?.username || "User"}!</p>
        {user?.credits !== undefined && (
          <p className="text-xl font-semibold mt-4">
            Available Credits: <span className="text-primary">{user.credits}</span>
          </p>
        )}
        <p className="text-muted-foreground mt-2">Navigate using the links above.</p>
      </div>
    </div>
  );
};

export default DashboardPage;
