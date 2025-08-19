import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Lock } from "lucide-react";

const MockStripeCheckout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const planName = searchParams.get('plan') || 'Base Plan';
  const amount = searchParams.get('amount') || '$10';
  const type = searchParams.get('type') || 'subscription';

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      navigate('/payment-success');
    }, 3000);
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
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input 
                  type="email" 
                  placeholder="john@example.com"
                  defaultValue="demo@kapiree.com"
                />
              </div>

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