import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { PricingCard } from "@/components/PricingCard";
import { PricingHero } from "@/components/PricingHero"; // Import PricingHero
import { CreditCard } from "@/components/CreditCard"; // Import CreditCard
import { StoragePolicy } from "@/components/StoragePolicy"; // Import StoragePolicy
import { AddOns } from "@/components/AddOns"; // Import AddOns
import { AuthModal } from "@/components/AuthModal"; // Import AuthModal
import { useAuth } from "@/hooks/use-auth"; // Import useAuth hook
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // Import Tabs components
import { api } from "@/lib/api";

interface CreditPack {
  id: string;
  name: string;
  credits_remaining: number;
  total_credits: number;
  expiration_date: string | null;
}

interface AddOn {
  id: string;
  name: string;
  description: string;
}

interface Transaction {
  id: string;
  date: string;
  item_name: string;
  transaction_type: "New Subscription" | "Renewal" | "Cancellation" | "Purchase";
  amount_paid: string;
  currency: string;
  status: "Active" | "Completed" | "Canceled" | "Expired" | "Refunded";
  invoice_url: string | null;
}

interface Subscription {
  id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
  plan_name: string;
  plan_description: string;
  price: string;
  currency: string;
  interval: string;
  features: { name: string; description: string }[];
  credit_balance: number; // New field
  credit_packs: CreditPack[]; // New field
  add_ons: AddOn[]; // New field
  transaction_history: Transaction[]; // New field
}

interface PlanDefinition {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  interval: string;
  features: { name: string; description: string }[];
}

const SubscriptionPage = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [availableCreditPacks, setAvailableCreditPacks] = useState<CreditPackDefinition[]>([]);
  const [availableAddOns, setAvailableAddOns] = useState<AddOnDefinition[]>([]);
  const [availablePlans, setAvailablePlans] = useState<PlanDefinition[]>([]); // New state for plans
  const [showPurchaseCreditModal, setShowPurchaseCreditModal] = useState(false);
  const [showPurchaseAddOnModal, setShowPurchaseAddOnModal] = useState(false);
  const [selectedCreditPack, setSelectedCreditPack] = useState<CreditPackDefinition | null>(null);
  const [selectedAddOn, setSelectedAddOn] = useState<AddOnDefinition | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); // State for AuthModal
  const [activeTab, setActiveTab] = useState("my-subscription"); // New state for active tab
  const [pendingCartAction, setPendingCartAction] = useState<{
    plan: string;
    amount: string;
    type: string;
  } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth(); // Get auth state

  interface CreditPackDefinition {
    id: string;
    name: string;
    description: string;
    credits_amount: number;
    price: string;
    currency: string;
    validity_days: number | null;
  }

  interface AddOnDefinition {
    id: string;
    name: string;
    description: string;
    price: string;
    currency: string;
    interval: string | null;
  }

  const fetchSubscriptionData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ subscription: Subscription | null }>("/api/auth/subscription");
      setSubscription(data.subscription);
    } catch (error: unknown) {
      const err = error as Error & { status?: number; body?: unknown };
      if (err?.status === 404) {
        toast({
          title: "No Subscription Found",
          description: "You do not have an active subscription, credit packs, add-ons, or transaction history.",
        });
        setSubscription(null);
      } else {
        toast({
          title: "Failed to fetch subscription",
          description: (err?.body as { message?: string })?.message || err?.message || "An error occurred.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchAvailableProducts = useCallback(async () => {
    try {
      const [creditPacksData, addOnsData, plansData] = await Promise.all([
        api.get<{ creditPacks: CreditPackDefinition[] }>("/api/auth/credit-packs/definitions"),
        api.get<{ addOns: AddOnDefinition[] }>("/api/auth/add-ons/definitions"),
        api.get<{ plans: PlanDefinition[] }>("/api/auth/plans"),
      ]);
      setAvailableCreditPacks(creditPacksData.creditPacks);
      setAvailableAddOns(addOnsData.addOns);
      setAvailablePlans(plansData.plans);
    } catch (error) {
      console.error("Error fetching available products:", error);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptionData();
    fetchAvailableProducts();
  }, [fetchSubscriptionData, fetchAvailableProducts]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/"); // Redirect to landing page
  };

  const handleAction = (plan: string, amount: string, type: string) => {
    if (!isAuthenticated) {
      // Store the cart action for after authentication
      setPendingCartAction({ plan, amount, type });
      setIsAuthModalOpen(true);
      toast({
        title: "Authentication Required",
        description: "Please log in or sign up to proceed with your selection.",
        variant: "destructive",
      });
    } else {
      navigate(`/cart?plan=${encodeURIComponent(plan)}&amount=${amount}&type=${type}`);
    }
  };

  // Handle successful authentication and redirect to cart
  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    if (pendingCartAction) {
      const { plan, amount, type } = pendingCartAction;
      setPendingCartAction(null);
      navigate(`/cart?plan=${encodeURIComponent(plan)}&amount=${amount}&type=${type}`);
    } else {
      // If no pending action, just refresh subscription data
      fetchSubscriptionData();
    }
  };

  const handleSubscribe = (plan: string) => {
    handleAction(plan, "$10", "subscription");
  };

  const handlePurchaseCredits = (credits: number) => {
    const amount = credits === 30 ? '$25' : '$100';
    handleAction(`${credits} Credits`, amount, "payment");
  };

  const basePlanFeatures = [ // Define basePlanFeatures here for use in PricingCard
    "10 credits per month (valid for 1 month)",
    "6 months video storage for all interviews",
    "Request and conduct video interviews",
    "Record & review interview sessions",
    "Candidate notes & evaluation tools"
  ];

  const handlePurchasePlan = (planId: string, planName: string, price: string, currency: string, interval: string) => {
    handleAction(planName, price, "subscription");
  };

  // For subscribed users, show "Buy" instead of "Start with first month free"
  const getPlanButtonText = () => {
    return subscription ? "Buy Plan" : "Start with first month free";
  };

  const handlePurchaseCreditPack = useCallback(async () => {
    if (!selectedCreditPack) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to purchase credit packs.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      await api.post("/api/auth/credit-packs/purchase", { creditPackDefId: selectedCreditPack.id });
      toast({
        title: "Credit Pack Purchased",
        description: `${selectedCreditPack.name} purchased successfully!`,
      });
      setShowPurchaseCreditModal(false);
      setSelectedCreditPack(null);
      fetchSubscriptionData(); // Refresh subscription data
    } catch (error: unknown) {
      const err = error as Error & { body?: unknown };
      toast({
        title: "Network error",
        description: (err?.body as { message?: string })?.message || err?.message || "Unable to connect to server. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedCreditPack, toast, navigate, fetchSubscriptionData]);

  const handlePurchaseAddOn = useCallback(async () => {
    if (!selectedAddOn) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to purchase add-ons.",
        variant: "destructive",
      });
      setIsAuthModalOpen(true); // Open auth modal if not authenticated
      return;
    }

    try {
      await api.post("/api/auth/add-ons/purchase", { addOnDefId: selectedAddOn.id });
      toast({
        title: "Add-On Purchased",
        description: `${selectedAddOn.name} purchased successfully!`,
      });
      setShowPurchaseAddOnModal(false);
      setSelectedAddOn(null);
      fetchSubscriptionData(); // Refresh subscription data
    } catch (error: unknown) {
      const err = error as Error & { body?: unknown };
      toast({
        title: "Network error",
        description: (err?.body as { message?: string })?.message || err?.message || "Unable to connect to server. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedAddOn, toast, setIsAuthModalOpen, fetchSubscriptionData]);

  return (
    <div className="container mx-auto p-4">
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {isLoading || isAuthLoading ? (
        <div className="text-center py-10">Loading subscription data...</div>
      ) : (
        <Tabs defaultValue="my-subscription" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-subscription">My Subscription</TabsTrigger>
            <TabsTrigger value="plans-addons">Plans & Add-ons</TabsTrigger>
          </TabsList>

          <TabsContent value="my-subscription">
            {subscription ? (
              <>
                <h1 className="text-3xl font-bold mb-6">My Subscription</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {/* Current Plan Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{subscription.plan_name}</CardTitle>
                      <CardDescription>{subscription.plan_description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold mb-2">
                        {subscription.currency} {subscription.price} / {subscription.interval}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">Status: {subscription.status}</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start Date: {format(new Date(subscription.start_date), "PPP")}
                      </p>
                      {subscription.end_date && (
                        <p className="text-sm text-muted-foreground mb-4">
                          End Date: {format(new Date(subscription.end_date), "PPP")}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mb-4">
                        Auto-renew: {subscription.auto_renew ? "Yes" : "No"}
                      </p>
                      <h3 className="font-semibold mb-2">Features:</h3>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {subscription.features.map((feature, index) => (
                          <li key={index}>{feature.name}: {feature.description}</li>
                        ))}
                      </ul>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="mt-4" disabled={isCancelling}>
                            {isCancelling ? "Cancelling..." : "Cancel Subscription"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently cancel your subscription
                              and remove your access to all features at the end of your current billing cycle.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Nevermind</AlertDialogCancel>
                            <AlertDialogAction onClick={() => console.log("Cancellation logic here")}>
                              Yes, cancel subscription
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>

                  {/* Credit Balance Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Credit Balance</CardTitle>
                      <CardDescription>Your current available credits.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold mb-4">{subscription.credit_balance}</p>
                      <h3 className="font-semibold mb-2">Credit Packs:</h3>
                      {subscription.credit_packs && subscription.credit_packs.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Remaining</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Expires</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {subscription.credit_packs.map((pack) => (
                              <TableRow key={pack.id}>
                                <TableCell>{pack.name}</TableCell>
                                <TableCell>{pack.credits_remaining}</TableCell>
                                <TableCell>{pack.total_credits}</TableCell>
                                <TableCell>
                                  {pack.expiration_date ? format(new Date(pack.expiration_date), "PPP") : "N/A"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground">No credit packs active.</p>
                      )}
                      <Button className="mt-4" onClick={() => setShowPurchaseCreditModal(true)}>
                        Purchase More Credits
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Add-Ons Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Active Add-Ons</CardTitle>
                      <CardDescription>Additional features you've purchased.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {subscription.add_ons && subscription.add_ons.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {subscription.add_ons.map((addOn) => (
                              <TableRow key={addOn.id}>
                                <TableCell>{addOn.name}</TableCell>
                                <TableCell>{addOn.description}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground">No add-ons active.</p>
                      )}
                      <Button className="mt-4" onClick={() => setShowPurchaseAddOnModal(true)}>
                        Browse Add-Ons
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Transaction History */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>A record of your past payments and activities.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {subscription.transaction_history && subscription.transaction_history.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Invoice</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subscription.transaction_history.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>{format(new Date(transaction.date), "PPP")}</TableCell>
                              <TableCell>{transaction.item_name}</TableCell>
                              <TableCell>{transaction.transaction_type}</TableCell>
                              <TableCell>{transaction.currency} {transaction.amount_paid}</TableCell>
                              <TableCell>{transaction.status}</TableCell>
                              <TableCell>
                                {transaction.invoice_url ? (
                                  <a href={transaction.invoice_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                    View
                                  </a>
                                ) : (
                                  "N/A"
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground">No transaction history available.</p>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-10">
                <h2 className="text-2xl font-bold mb-4">No Active Subscription</h2>
                <p className="text-muted-foreground mb-6">
                  It looks like you don't have an active subscription. Explore our plans below!
                </p>
                <Button onClick={() => setActiveTab("plans-addons")}>View Plans</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="plans-addons">
            <PricingHero />

            {/* Main Pricing Section - 2 Column Layout */}
            <section className="py-12 px-6">
              <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 items-start">
                  {/* Left Column - Base Plan */}
                  <div className="flex justify-center lg:justify-end">
                    <div className="w-full max-w-md">
                      {availablePlans.length > 0 && (
                        <PricingCard
                          planName={availablePlans[0].name} // Assuming the first plan is the base plan
                          price={`${availablePlans[0].currency}${availablePlans[0].price}`}
                          interval={availablePlans[0].interval}
                          features={basePlanFeatures} // Using the defined basePlanFeatures
                          isPopular={true}
                          buttonText={getPlanButtonText()}
                          onAction={() => handlePurchasePlan(availablePlans[0].id, availablePlans[0].name, availablePlans[0].price, availablePlans[0].currency, availablePlans[0].interval)}
                        />
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
                        {availableCreditPacks.map((pack) => (
                          <CreditCard
                            key={pack.id}
                            credits={pack.credits_amount}
                            price={`${pack.currency}${pack.price}`}
                            validity={pack.validity_days ? `${pack.validity_days} days` : "N/A"}
                            onPurchase={() => {
                              setSelectedCreditPack(pack);
                              setShowPurchaseCreditModal(true);
                            }}
                            showBuyButton={!!subscription}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <AddOns 
              onPurchaseAddOn={(addOnId) => {
                const addOn = availableAddOns.find(a => a.id === addOnId);
                if (addOn) {
                  setSelectedAddOn(addOn);
                  setShowPurchaseAddOnModal(true);
                }
              }}
              availableAddOns={availableAddOns}
            />
            <StoragePolicy />
          </TabsContent>
        </Tabs>
      )}

      {/* Purchase Credit Pack Modal */}
      <Dialog open={showPurchaseCreditModal} onOpenChange={setShowPurchaseCreditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Credit Pack</DialogTitle>
            <DialogDescription>Select a credit pack to purchase.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {availableCreditPacks.map((pack) => (
              <Card
                key={pack.id}
                className={`cursor-pointer ${selectedCreditPack?.id === pack.id ? "border-blue-500 ring-2 ring-blue-500" : ""}`}
                onClick={() => setSelectedCreditPack(pack)}
              >
                <CardHeader>
                  <CardTitle>{pack.name}</CardTitle>
                  <CardDescription>{pack.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold">{pack.currency} {pack.price}</p>
                  <p className="text-sm text-muted-foreground">{pack.credits_amount} credits</p>
                  {pack.validity_days && (
                    <p className="text-sm text-muted-foreground">Valid for {pack.validity_days} days</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseCreditModal(false)}>Cancel</Button>
            <Button onClick={handlePurchaseCreditPack} disabled={!selectedCreditPack}>Purchase</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Add-On Modal */}
      <Dialog open={showPurchaseAddOnModal} onOpenChange={setShowPurchaseAddOnModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Browse Add-Ons</DialogTitle>
            <DialogDescription>Select an add-on to purchase.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {availableAddOns.map((addOn) => (
              <Card
                key={addOn.id}
                className={`cursor-pointer ${selectedAddOn?.id === addOn.id ? "border-blue-500 ring-2 ring-blue-500" : ""}`}
                onClick={() => setSelectedAddOn(addOn)}
              >
                <CardHeader>
                  <CardTitle>{addOn.name}</CardTitle>
                  <CardDescription>{addOn.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold">{addOn.currency} {addOn.price}</p>
                  {addOn.interval && (
                    <p className="text-sm text-muted-foreground">Billed {addOn.interval}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseAddOnModal(false)}>Cancel</Button>
            <Button onClick={handlePurchaseAddOn} disabled={!selectedAddOn}>Purchase</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPage;
