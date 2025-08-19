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
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Start with our base plan and scale as you grow
            </p>
          </div>
          
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
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Credit Packs
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Need more interviews? Purchase credits in bulk and save
            </p>
            <div className="inline-flex items-center gap-2 bg-card px-4 py-2 rounded-full border">
              <span className="text-sm text-muted-foreground">1 video session = 1 credit</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
      
      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-subtle">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Hiring Process?
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of companies already using Kapiree to find the best talent
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => handleSubscribe("Base Plan")}
              className="px-8 py-4 bg-gradient-primary text-white rounded-lg font-semibold hover:bg-gradient-secondary transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Start Your Free Trial
            </button>
            <button className="px-8 py-4 border border-primary text-primary rounded-lg font-semibold hover:bg-primary hover:text-white transition-all duration-300">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
