import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import UnauthenticatedLayout from '../components/UnauthenticatedLayout';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.forgotPassword(email);
      toast({
        title: "Password Reset Initiated",
        description: response.data.message,
      });
      navigate("/signin"); // Redirect to sign-in page after request
    } catch (error: unknown) {
      const err = error as Error & { body?: unknown };
      toast({
        title: "Error",
        description: (err?.body as { message?: string })?.message || err?.message || "Failed to send password reset link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UnauthenticatedLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Forgot Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending link..." : "Send Reset Link"}
              </Button>
            </form>
            <div className="text-center text-sm mt-4">
              <a href="/signin" className="font-medium text-primary hover:underline">
                Back to Sign In
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnauthenticatedLayout>
  );
};

export default ForgotPasswordPage;
