import { Button } from "@/components/ui/button";
import { Video, Users, Shield } from "lucide-react";
import { Link } from "react-router-dom";

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
        <div className="mt-4">
          <Link to="/renewal">
            <Button variant="link">Already a customer? Renew your subscription here.</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
