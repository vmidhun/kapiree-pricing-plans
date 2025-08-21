import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Minus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthModal } from "@/components/AuthModal";

interface CartItem {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  type: "plan" | "credits" | "addon";
  description?: string;
  quantity?: number;
}

const Cart = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Mock cart items based on URL params or default items
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const plan = searchParams.get("plan");
    const amount = searchParams.get("amount");
    const type = searchParams.get("type");
    
    const items: CartItem[] = [];
    
    if (plan && amount) {
      if (type === "subscription") {
        items.push({
          id: "base-plan",
          name: plan,
          price: amount,
          type: "plan",
          description: "10 credits per month + 6 months storage"
        });
      } else {
        items.push({
          id: "credits",
          name: plan,
          price: amount,
          originalPrice: plan.includes("30") ? "$30" : "$150",
          type: "credits",
          description: plan.includes("30") ? "Valid for 3 months" : "Valid for 6 months"
        });
      }
    }
    
    return items;
  });

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

  const availableCredits = [
    {
      id: "credits-30",
      name: "30 Credits",
      price: "$25",
      originalPrice: "$30",
      type: "credits" as const,
      description: "Valid for 3 months"
    },
    {
      id: "credits-150",
      name: "150 Credits",
      price: "$100",
      originalPrice: "$150",
      type: "credits" as const,
      description: "Valid for 6 months"
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
      const price = parseFloat(item.price.replace(/[$,]/g, ''));
      const quantity = item.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    
    const firstItem = cartItems[0];
    if (firstItem) {
      navigate(`/checkout?plan=${encodeURIComponent(firstItem.name)}&amount=${firstItem.price}&type=${firstItem.type === 'plan' ? 'subscription' : 'payment'}`);
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
          <h1 className="text-3xl font-bold">Your Cart</h1>
          <p className="text-muted-foreground">Review your selected items before checkout</p>
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
                {availableCredits.map(item => {
                  const isInCart = creditItems.some(cartItem => cartItem.id === item.id);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-primary">{item.price}</span>
                          <span className="text-sm text-muted-foreground line-through">{item.originalPrice}</span>
                        </div>
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

export default Cart;