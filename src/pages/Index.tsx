import { useState, useEffect } from "react";
import { PricingHero } from "@/components/PricingHero";
import { PricingCard } from "@/components/PricingCard";
import { CreditCard } from "@/components/CreditCard";
import { StoragePolicy } from "@/components/StoragePolicy";
import { AddOns } from "@/components/AddOns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, PricingPlan, CreditPackDefinition } from "@/lib/api"; // Import api and interfaces

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [pendingCartAction, setPendingCartAction] = useState<{ plan: string; amount: string; type: string } | null>(null);

  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [creditPacks, setCreditPacks] = useState<CreditPackDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansResponse, creditPacksResponse] = await Promise.all([
          api.getPricingPlans(),
          api.getCreditPacks(),
        ]);
        setPricingPlans(plansResponse.data);
        setCreditPacks(creditPacksResponse.data);
      } catch (err: unknown) {
        const errorMsg = (err as Error)?.message || "Failed to fetch pricing data.";
        setError(errorMsg);
        toast({
          title: "Error fetching pricing data",
          description: errorMsg,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleAction = (plan: string, amount: string, type: string) => {
    if (!isAuthenticated) {
      setPendingCartAction({ plan, amount, type });
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

  const handleSubscribe = (planName: string, price: string, currency: string) => {
    handleAction(planName, `${currency}${price}`, "subscription");
  };

  const handlePurchaseCredits = (packName: string, credits: number, price: string, currency: string) => {
    handleAction(`${packName} (${credits} Credits)`, `${currency}${price}`, "payment");
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading pricing information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  // Assuming 'Base Plan' corresponds to a specific plan in your backend, e.g., 'plan_basic'
  const basePlan = pricingPlans.find(p => p.name === 'Basic Plan'); // Adjust name as per your DB
  const creditPack30 = creditPacks.find(cp => cp.credits_amount === 30);
  const creditPack150 = creditPacks.find(cp => cp.credits_amount === 150);

  // Placeholder features for base plan if not fetched from backend
  const defaultBasePlanFeatures = [
    "10 credits per month (valid for 1 month)",
    "6 months video storage for all interviews",
    "Request and conduct video interviews",
    "Record & review interview sessions",
    "Candidate notes & evaluation tools"
  ];

  return (
    <div className="min-h-screen bg-background">
      <PricingHero />
      
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left Column - Base Plan */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                {basePlan ? (
                  <PricingCard
                    planName={basePlan.name}
                    price={parseFloat(basePlan.price).toFixed(2)}
                    currency={basePlan.currency}
                    interval={basePlan.interval}
                    features={defaultBasePlanFeatures} // Features are not in PricingPlan interface, using default
                    isPopular={true}
                    buttonText={`Start with first month free`}
                    onAction={() => handleSubscribe(basePlan.name, basePlan.price, basePlan.currency)}
                  />
                ) : (
                  <p>Base Plan not found.</p>
                )}
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
                  {creditPack30 && (
                    <CreditCard
                      credits={creditPack30.credits_amount}
                      price={parseFloat(creditPack30.price).toFixed(2)}
                      currency={creditPack30.currency}
                      validity={creditPack30.validity_days ? `${creditPack30.validity_days / 30} months` : 'No Expiration'}
                      originalValue={`$${(creditPack30.credits_amount * 1).toFixed(2)}`} // Assuming 1 credit = $1 for original value calculation
                      onPurchase={() => handlePurchaseCredits(creditPack30.name, creditPack30.credits_amount, creditPack30.price, creditPack30.currency)}
                    />
                  )}
                  {creditPack150 && (
                    <CreditCard
                      credits={creditPack150.credits_amount}
                      price={parseFloat(creditPack150.price).toFixed(2)}
                      currency={creditPack150.currency}
                      validity={creditPack150.validity_days ? `${creditPack150.validity_days / 30} months` : 'No Expiration'}
                      originalValue={`$${(creditPack150.credits_amount * 1).toFixed(2)}`} // Assuming 1 credit = $1 for original value calculation
                      onPurchase={() => handlePurchaseCredits(creditPack150.name, creditPack150.credits_amount, creditPack150.price, creditPack150.currency)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AddOns />
      <StoragePolicy />
    </div>
  );
};

export default Index;
