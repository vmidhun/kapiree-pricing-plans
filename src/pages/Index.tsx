import { PricingHero } from "@/components/PricingHero";
import { PricingCard } from "@/components/PricingCard";
import { CreditCard } from "@/components/CreditCard";
import { StoragePolicy } from "@/components/StoragePolicy";
import { AddOns } from "@/components/AddOns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubscribe = (plan: string) => {
    navigate(`/cart?plan=${encodeURIComponent(plan)}&amount=$10&type=subscription`);
  };

  const handlePurchaseCredits = (credits: number) => {
    const amount = credits === 30 ? '$25' : '$100';
    navigate(`/cart?plan=${credits} Credits&amount=${amount}&type=payment`);
  };

  const basePlanFeatures = [
    "10 credits per month (valid for 1 month)",
    "6 months video storage for all interviews",
    "Request and conduct video interviews",
    "Record & review interview sessions",
    "Candidate notes & evaluation tools",
    "Email support",
    "HD video quality"
  ];

  return (
    <div className="min-h-screen bg-background">
      <PricingHero />
      
      {/* Main Pricing Section - 2 Column Layout */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left Column - Base Plan */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <PricingCard
                  title="Base Plan"
                  price="$10/month"
                  description="Perfect for individual recruiters and small teams"
                  features={basePlanFeatures}
                  isPopular={true}
                  buttonText="Start Free Trial"
                  onSelect={() => handleSubscribe("Base Plan")}
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
                    isPopular={true}
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
    </div>
  );
};

export default Index;
