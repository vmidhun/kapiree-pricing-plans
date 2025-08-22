import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface Subscription {
  id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
  plan_name: string;
  plan_description: string; // Added plan_description
  price: string;
  currency: string;
  interval: string;
  features: { name: string; description: string }[]; // Added features
}

const SubscriptionPage = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubscription = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to view your subscription details.",
          variant: "destructive",
        });
        navigate("/login"); // Redirect to login if no token
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/api/auth/subscription", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSubscription(data.subscription);
        } else if (response.status === 404) {
          toast({
            title: "No Subscription Found",
            description: "You do not have an active subscription.",
          });
          setSubscription(null);
        } else {
          const errorData = await response.json();
          toast({
            title: "Failed to fetch subscription",
            description: errorData.message || "An error occurred.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
        toast({
          title: "Network error",
          description: "Unable to connect to server. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [toast, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/"); // Redirect to landing page
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading subscription details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Subscription</h1>
        <Button onClick={handleLogout} variant="outline">Logout</Button>
      </header>

      {subscription ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{subscription.plan_name} Plan</CardTitle>
            <CardDescription>
              {subscription.plan_description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              <strong>Status:</strong> <span className={`font-semibold ${subscription.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{subscription.status}</span>
            </p>
            <p>
              <strong>Price:</strong> {subscription.currency} {subscription.price} / {subscription.interval}
            </p>
            <p>
              <strong>Start Date:</strong> {format(new Date(subscription.start_date), "PPP")}
            </p>
            {subscription.end_date && (
              <p>
                <strong>End Date:</strong> {format(new Date(subscription.end_date), "PPP")}
              </p>
            )}
            <p>
              <strong>Auto-renew:</strong> {subscription.auto_renew ? "Yes" : "No"}
            </p>

            {subscription.features && subscription.features.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Plan Features:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {subscription.features.map((feature, index) => (
                    <li key={index}>
                      <strong>{feature.name}:</strong> {feature.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button className="w-full mt-4">Manage Subscription</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-lg mb-4">You don't have an active subscription.</p>
          <Button onClick={() => navigate("/")}>Explore Plans</Button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;
