import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const MockStripeCheckout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user, setUser } = useAuth();

  const planName = searchParams.get('plan') || 'Base Plan';
  const amount = searchParams.get('amount') || '$10';
  const type = searchParams.get('type') || 'subscription';

  useEffect(() => {
    if (user && type === 'subscription') {
      // If an authenticated user tries to access a subscription payment,
      // they should probably be redirected to their subscription management page
      // or a page that confirms their current subscription.
      // For now, we'll just redirect to dashboard.
      toast({
        title: "Already logged in",
        description: "You are already logged in. Redirecting to dashboard.",
      });
      navigate('/dashboard');
    }
  }, [user, type, navigate, toast]);

  const handlePayment = async () => {
    setIsProcessing(true);

    if (type === 'payment') { // This is for credit purchases
      const creditsMatch = planName.match(/(\d+)\s*Credits/);
      const creditsToAdd = creditsMatch ? parseInt(creditsMatch[1], 10) : 0;

      if (creditsToAdd > 0 && user) {
        try {
          const token = localStorage.getItem("authToken");
          const response = await fetch("http://localhost:3000/api/auth/update-credits", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ creditsToAdd }),
          });

          const data = await response.json();

          if (response.ok) {
            toast({
              title: "Credits purchased successfully!",
              description: data.message,
            });
            setUser(data.user); // Update user context with new credits
            navigate('/payment-success');
          } else {
            toast({
              title: "Credit purchase failed",
              description: data.message || "An error occurred.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error updating credits:", error);
          toast({
            title: "Network error",
            description: "Unable to connect to server. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      } else {
        toast({
          title: "Invalid credit purchase",
          description: "Could not determine credits to add or user not logged in.",
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    } else {
      // Simulate payment processing for subscriptions
      setTimeout(() => {
        navigate('/payment-success');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center text-sm text-muted-foreground">
            <Lock className="h-4 w-4 mr-1" />
            Secure checkout powered by Stripe
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Complete your order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Summary */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Order Summary</h3>
              <div className="flex justify-between text-sm">
                <span>{planName}</span>
                <span className="font-medium">{amount}</span>
              </div>
              {type === 'subscription' && (
                <p className="text-xs text-muted-foreground mt-1">Recurring monthly</p>
              )}
            </div>

            {/* Payment Form */}
            <div className="space-y-4">
              {/* Email field - conditionally render for guest checkout */}
              {!user && (
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input 
                    type="email" 
                    placeholder="john@example.com"
                    defaultValue="demo@kapiree.com"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Card information</label>
                <div className="space-y-2">
                  <Input 
                    placeholder="1234 1234 1234 1234"
                    defaultValue="4242 4242 4242 4242"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      placeholder="MM / YY"
                      defaultValue="12 / 28"
                    />
                    <Input 
                      placeholder="CVC"
                      defaultValue="123"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Cardholder name</label>
                <Input 
                  placeholder="John Doe"
                  defaultValue="Demo User"
                />
              </div>
            </div>

            <Button 
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                `Pay ${amount}`
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By confirming your payment, you agree to our terms of service.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MockStripeCheckout;
