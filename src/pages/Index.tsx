import { PricingHero } from "@/components/PricingHero";
import { PricingCard } from "@/components/PricingCard";
import { CreditCard } from "@/components/CreditCard";
import { StoragePolicy } from "@/components/StoragePolicy";
import { AddOns } from "@/components/AddOns";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();

  const handleSubscribe = (plan: string) => {
    toast({
      title: "Coming Soon!",
      description: `${plan} subscription will be available once Stripe is integrated.`,
    });
  };

  const handlePurchaseCredits = (credits: number) => {
    toast({
      title: "Coming Soon!",
      description: `${credits} credits purchase will be available once Stripe is integrated.`,
    });
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
      
      {/* Main Subscription */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center">
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
        </div>
      </section>

      {/* Credit System */}
      <section className="py-12 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Credit Packs
              </span>
            </h2>
            <p className="text-muted-foreground mb-4">
              1 video session = 1 credit
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
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
      </section>

      <StoragePolicy />
      <AddOns />
    </div>
  );
};

export default Index;
