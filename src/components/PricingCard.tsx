import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
  onSelect: () => void;
}

export const PricingCard = ({
  title,
  price,
  description,
  features,
  isPopular = false,
  buttonText,
  onSelect,
}: PricingCardProps) => {
  return (
    <div 
      className={`
        relative p-8 rounded-2xl transition-all duration-300 ease-smooth
        ${isPopular 
          ? 'bg-gradient-to-br from-primary/5 to-secondary-accent/5 border-2 border-primary shadow-premium scale-105' 
          : 'bg-card border border-border shadow-card hover:shadow-card-hover'
        }
        animate-scale-in hover:scale-105 cursor-pointer
      `}
      onClick={onSelect}
    >
      
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-foreground mb-2">{title}</h3>
        <div className="mb-4">
          <span className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {price}
          </span>
        </div>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
            <span className="text-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <Button 
        variant={isPopular ? "default" : "outline"}
        className={`
          w-full h-12 text-base font-semibold transition-all duration-300
          ${isPopular 
            ? 'bg-gradient-primary hover:bg-gradient-secondary shadow-lg hover:shadow-xl' 
            : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
          }
        `}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {buttonText}
      </Button>
    </div>
  );
};