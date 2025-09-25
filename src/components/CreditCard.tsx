import { Button } from "@/components/ui/button";
import { Clock, Zap } from "lucide-react";

interface CreditCardProps {
  credits: number;
  price: string;
  validity: string;
  originalValue?: string;
  isPopular?: boolean;
  onPurchase: () => void;
  showBuyButton?: boolean;
}

export const CreditCard = ({
  credits,
  price,
  validity,
  originalValue,
  isPopular = false,
  onPurchase,
  showBuyButton = false,
}: CreditCardProps) => {
  const savings = originalValue ? 
    Math.round(((parseFloat(originalValue.replace('$', '')) - parseFloat(price.replace('$', ''))) / parseFloat(originalValue.replace('$', ''))) * 100) 
    : 0;

  return (
    <div 
      className={`
        relative p-6 rounded-xl transition-all duration-300 ease-smooth
        ${isPopular 
          ? 'bg-gradient-to-br from-secondary-accent/10 to-primary/10 border-2 border-secondary-accent shadow-premium' 
          : 'bg-card border border-border shadow-card hover:shadow-card-hover'
        }
        hover:scale-105 cursor-pointer animate-fade-up
      `}
      onClick={showBuyButton ? undefined : onPurchase}
    >
      {savings > 0 && (
        <div className="absolute -top-3 -right-3">
          <span className="bg-success text-white px-3 py-1 rounded-full text-xs font-bold">
            Save {savings}%
          </span>
        </div>
      )}
      
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Zap className="w-6 h-6 text-secondary-accent" />
          <span className="text-3xl font-bold text-foreground">{credits}</span>
          <span className="text-muted-foreground">credits</span>
        </div>
        
        <div className="mb-3">
          <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {price}
          </span>
          {originalValue && (
            <span className="text-muted-foreground line-through ml-2 text-sm">
              {originalValue}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
          <Clock className="w-4 h-4" />
          <span>Valid for {validity}</span>
        </div>
        
        {showBuyButton && (
          <Button 
            className="w-full bg-gradient-primary hover:bg-gradient-secondary"
            onClick={(e) => {
              e.stopPropagation();
              onPurchase();
            }}
          >
            Buy Credits
          </Button>
        )}
      </div>
    </div>
  );
};