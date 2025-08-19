import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download, Home } from "lucide-react";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-xl">Payment Successful!</CardTitle>
            <p className="text-muted-foreground mt-2">
              Thank you for your purchase. Your payment has been processed successfully.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Order ID:</span>
                <span className="font-mono">#KAP-2024-001</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Amount:</span>
                <span className="font-medium">$10.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <span className="text-green-600 font-medium">Paid</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">What's next?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your account has been activated</li>
                <li>• 10 credits have been added to your account</li>
                <li>• A confirmation email has been sent</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => navigate('/')}
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.print()}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;