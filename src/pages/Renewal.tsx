import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Minus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthModal } from "@/components/AuthModal";
import { api, PricingPlan, CreditPackDefinition } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface CartItem {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  type: "plan" | "credits" | "addon";
  description?: string;
  quantity?: number;
}

const Renewal = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // This should come from AuthContext
  const { toast } = useToast();

  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [availableCreditPacks, setAvailableCreditPacks] = useState<CreditPackDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const fetchPricingData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [plansResponse, creditPacksResponse] = await Promise.all([
          api.getPricingPlans(),
          api.getCreditPacks(),
        ]);
        setPricingPlans(plansResponse.data);
        setAvailableCreditPacks(creditPacksResponse.data);

        // Initialize cart based on URL params or default
        const planParam = searchParams.get("plan");
        const amountParam = searchParams.get("amount");
        const typeParam = searchParams.get("type");

        const initialCart: CartItem[] = [];

        if (planParam && amountParam) {
          if (typeParam === "subscription") {
            const matchedPlan = plansResponse.data.find(p => p.name === planParam);
            if (matchedPlan) {
              initialCart.push({
                id: matchedPlan.id,
                name: matchedPlan.name,
                price: `$${matchedPlan.price.toFixed(2)}/${matchedPlan.interval}`,
                type: "plan",
                description: matchedPlan.description,
                quantity: 1,
              });
            }
          } else if (typeParam === "credits") {
            const matchedCreditPack = creditPacksResponse.data.find(cp => cp.name === planParam);
            if (matchedCreditPack) {
              initialCart.push({
                id: matchedCreditPack.id,
                name: matchedCreditPack.name,
                price: `$${matchedCreditPack.price.toFixed(2)}`,
                originalPrice: matchedCreditPack.price > parseFloat(amountParam) ? `$${matchedCreditPack.price.toFixed(2)}` : undefined, // Assuming amountParam is a discounted price
                type: "credits",
                description: matchedCreditPack.description,
                quantity: 1,
              });
            }
          }
        } else if (plansResponse.data.length > 0) {
          // Default to the first pricing plan if no params and plans exist
          const defaultPlan = plansResponse.data[0];
          initialCart.push({
            id: defaultPlan.id,
            name: defaultPlan.name,
            price: `$${defaultPlan.price.toFixed(2)}/${defaultPlan.interval}`,
            type: "plan",
            description: defaultPlan.description,
            quantity: 1,
          });
        }
        setCartItems(initialCart);

      } catch (err) {
        console.error('Failed to fetch pricing data:', err);
        setError('Failed to load pricing data.');
        toast({
          title: 'Error',
          description: 'Failed to load pricing data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPricingData();
  }, [searchParams, toast]);

  // Mock availableAddons for now, as they are not yet managed via backend
  const availableAddons = [
    {
      id: "extra-storage",
      name: "Extra Storage",
      price: "$5/month",
      type: "addon" as const,
      description: "Additional 12 months storage"
    },
    {
      id: "team-access",
      name: "Team Access",
      price: "$15/month",
      type: "addon" as const,
      description: "Up to 5 team members"
    }
  ];

  const addToCart = (item: CartItem) => {
    const existingItem = cartItems.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCartItems(cartItems.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: (cartItem.quantity || 1) + 1 }
          : cartItem
      ));
    } else {
      setCartItems([...cartItems, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems(cartItems.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price.replace(/[$,/a-zA-Z]/g, ''));
      const quantity = item.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    
    // Prepare items for checkout
    const checkoutItems = cartItems.map(item => ({
      id: item.id,
      name: item.name,
      price: parseFloat(item.price.replace(/[$,/a-zA-Z]/g, '')), // Clean price for checkout
      type: item.type,
      quantity: item.quantity || 1,
    }));

    // For simplicity, passing the first item's details to checkout page.
    // In a real scenario, you'd pass all cart items or a cart ID.
    const firstItem = checkoutItems[0];
    if (firstItem) {
      navigate(`/checkout?plan=${encodeURIComponent(firstItem.name)}&amount=${firstItem.price}&type=${firstItem.type === 'plan' ? 'subscription' : firstItem.type}`);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    handleCheckout();
  };

  const planItems = cartItems.filter(item => item.type === "plan");
  const creditItems = cartItems.filter(item => item.type === "credits");
  const addonItems = cartItems.filter(item => item.type === "addon");

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            ← Back to Pricing
          </Button>
          <h1 className="text-3xl font-bold">Renew Subscription</h1>
          <p className="text-muted-foreground">Review and manage your subscription</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Cart Items */}
            {cartItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Selected Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {planItems.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 text-primary">Subscription Plan</h3>
                      {planItems.map(item => (
                        <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <Checkbox 
                            checked={true} 
                            disabled={true}
                            className="opacity-50"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <p className="text-lg font-semibold text-primary">{item.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {creditItems.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 text-primary">Credit Packs</h3>
                      {creditItems.map(item => (
                        <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <Checkbox checked={true} />
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-primary">{item.price}</span>
                              {item.originalPrice && (
                                <span className="text-sm text-muted-foreground line-through">{item.originalPrice}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity || 1}</span>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {addonItems.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 text-primary">Add-ons</h3>
                      {addonItems.map(item => (
                        <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <Checkbox checked={true} />
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <p className="text-lg font-semibold text-primary">{item.price}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Available Credit Packs */}
            <Card>
              <CardHeader>
                <CardTitle>Available Credit Packs</CardTitle>
                <p className="text-sm text-muted-foreground">1 video session = 1 credit</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableCreditPacks.map(item => {
                  const isInCart = creditItems.some(cartItem => cartItem.id === item.id);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-primary">${item.price.toFixed(2)}</span>
                          {/* Assuming originalPrice logic might be handled by backend or not needed here */}
                        </div>
                      </div>
                      <Button 
                        variant={isInCart ? "secondary" : "outline"}
                        onClick={() => addToCart({
                          id: item.id,
                          name: item.name,
                          price: `$${item.price.toFixed(2)}`,
                          type: "credits",
                          description: item.description,
                          quantity: 1,
                        })}
                        disabled={isInCart}
                      >
                        {isInCart ? "In Cart" : "Add to Cart"}
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Available Add-ons */}
            <Card>
              <CardHeader>
                <CardTitle>Available Add-ons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableAddons.map(item => {
                  const isInCart = addonItems.some(cartItem => cartItem.id === item.id);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <p className="text-lg font-semibold text-primary">{item.price}</p>
                      </div>
                      <Button 
                        variant={isInCart ? "secondary" : "outline"}
                        onClick={() => addToCart(item)}
                        disabled={isInCart}
                      >
                        {isInCart ? "In Cart" : "Add to Cart"}
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Your cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {cartItems.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.name} {item.quantity && item.quantity > 1 && `x${item.quantity}`}</span>
                          <span>{item.price}</span>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-primary">${calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="space-y-3">
                      {!isAuthenticated && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            Sign in or create an account to complete your purchase
                          </p>
                        </div>
                      )}
                      <Button 
                        className="w-full" 
                        onClick={handleCheckout}
                        disabled={cartItems.length === 0}
                      >
                        {isAuthenticated ? "Proceed to Checkout" : "Sign In & Checkout"}
                      </Button>
                      {isAuthenticated && (
                        <Badge variant="secondary" className="w-full justify-center">
                          Signed in as demo@example.com
                        </Badge>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Renewal;
