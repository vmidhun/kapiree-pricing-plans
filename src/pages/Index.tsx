import { useState } from "react"; // Removed useEffect, keeping useState for pendingCartAction
import { PricingHero } from "@/components/PricingHero";
import { PricingCard } from "@/components/PricingCard";
import { CreditCard } from "@/components/CreditCard";
import { StoragePolicy } from "@/components/StoragePolicy";
import { AddOns } from "@/components/AddOns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
// Removed AuthModal import
// Removed Button import
import { useAuth } from "@/context/AuthContext"; // Import useAuth hook
// Removed useLocation import

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  // Removed isAuthModalOpen state
  const { isAuthenticated, isLoading } = useAuth();
  const [pendingCartAction, setPendingCartAction] = useState<{ plan: string; amount: string; type: string } | null>(null);

  // Removed useEffect for /signin route

  const handleAction = (plan: string, amount: string, type: string) => {
    if (!isAuthenticated) {
      setPendingCartAction({ plan, amount, type });
      // Instead of opening a modal, navigate to the sign-in page
      navigate("/signin");
      toast({
        title: "Authentication Required",
        description: "Please log in or sign up to proceed with your selection.",
        variant: "destructive",
      });
    } else {
      const redirectPath = `/cart?plan=${encodeURIComponent(plan)}&amount=${amount}&type=${type}`;
      navigate(redirectPath);
    }
  };

  const handleSubscribe = (plan: string) => {
    handleAction(plan, "$10", "subscription");
  };

  const handlePurchaseCredits = (credits: number) => {
    const amount = credits === 30 ? '$25' : '$100';
    handleAction(`${credits} Credits`, amount, "payment");
  };

  const basePlanFeatures = [
    "10 credits per month (valid for 1 month)",
    "6 months video storage for all interviews",
    "Request and conduct video interviews",
    "Record & review interview sessions",
    "Candidate notes & evaluation tools"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Removed the internal header as UnauthenticatedLayout provides the main navigation */}
      <PricingHero />
      
      {/* Main Pricing Section - 2 Column Layout */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left Column - Base Plan */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <PricingCard
                  planName="Base Plan"
                  price="$10"
                  interval="month"
                  features={basePlanFeatures}
                  isPopular={true}
                  buttonText="Start with first month free"
                  onAction={() => handleSubscribe("Base Plan")}
                />
              </div>
            </div>

            {/* Right Column - Credit Packs */}
            <div className="flex justify-center lg:justify-start">
              <div className="w-full max-w-md">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">
                    <span className="bg-gradient-primary bg-clip-text text-transparent">
                      Credit Packs
                    </span>
                  </h2>
                  <p className="text-muted-foreground">
                    1 video session = 1 credit
                  </p>
                </div>
                
                <div className="space-y-4">
                  <CreditCard
                    credits={30}
                    price="$25"
                    validity="3 months"
                    originalValue="$30"
                    onPurchase={() => handlePurchaseCredits(30)}
                  />
                  <CreditCard
                    credits={150}
                    price="$100"
                    validity="6 months"
                    originalValue="$150"
                    onPurchase={() => handlePurchaseCredits(150)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AddOns />
      <StoragePolicy />

      {/* Removed AuthModal component */}
    </div>
  );
};

export default Index;
