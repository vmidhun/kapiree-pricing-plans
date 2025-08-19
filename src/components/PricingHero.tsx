import { Button } from "@/components/ui/button";
import { Video, Users, Shield } from "lucide-react";

export const PricingHero = () => {
  return (
    <section className="py-12 px-6 text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            Kapiree Pricing
          </span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Choose the plan that fits your hiring needs
        </p>
      </div>
    </section>
  );
};