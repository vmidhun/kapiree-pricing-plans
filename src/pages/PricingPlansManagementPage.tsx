import React, { useState, useEffect } from 'react';
import { api, PricingPlan, CreditPackDefinition } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { useToast } from '../components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const PricingPlansManagementPage: React.FC = () => {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [creditPacks, setCreditPacks] = useState<CreditPackDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<PricingPlan> | null>(null);

  const [isCreditPackDialogOpen, setIsCreditPackDialogOpen] = useState(false);
  const [currentCreditPack, setCurrentCreditPack] = useState<Partial<CreditPackDefinition> | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansResponse, creditPacksResponse] = await Promise.all([
        api.getPricingPlans(),
        api.getCreditPacks(),
      ]);
      setPricingPlans(plansResponse.data);
      setCreditPacks(creditPacksResponse.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
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

  // --- Pricing Plan Handlers ---
  const handleCreatePlan = async () => {
    if (!currentPlan?.name || !currentPlan?.price || !currentPlan?.interval) {
      toast({
        title: 'Validation Error',
        description: 'Name, Price, and Interval are required for a pricing plan.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await api.createPricingPlan(currentPlan as Omit<PricingPlan, "id" | "created_at" | "updated_at">);
      toast({ title: 'Success', description: 'Pricing plan created.' });
      setIsPlanDialogOpen(false);
      setCurrentPlan(null);
      fetchData();
    } catch (err) {
      console.error('Failed to create plan:', err);
      toast({ title: 'Error', description: 'Failed to create pricing plan.', variant: 'destructive' });
    }
  };

  const handleUpdatePlan = async () => {
    if (!currentPlan?.id) return;
    try {
      await api.updatePricingPlan(currentPlan.id, currentPlan);
      toast({ title: 'Success', description: 'Pricing plan updated.' });
      setIsPlanDialogOpen(false);
      setCurrentPlan(null);
      fetchData();
    } catch (err) {
      console.error('Failed to update plan:', err);
      toast({ title: 'Error', description: 'Failed to update pricing plan.', variant: 'destructive' });
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing plan?')) return;
    try {
      await api.deletePricingPlan(id);
      toast({ title: 'Success', description: 'Pricing plan deleted.' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete plan:', err);
      toast({ title: 'Error', description: 'Failed to delete pricing plan.', variant: 'destructive' });
    }
  };

  const openPlanDialog = (plan?: PricingPlan) => {
    setCurrentPlan(plan || { name: '', description: '', price: 0, currency: 'USD', interval: 'month' });
    setIsPlanDialogOpen(true);
  };

  // --- Credit Pack Handlers ---
  const handleCreateCreditPack = async () => {
    if (!currentCreditPack?.name || !currentCreditPack?.credits_amount || !currentCreditPack?.price) {
      toast({
        title: 'Validation Error',
        description: 'Name, Credits Amount, and Price are required for a credit pack.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await api.createCreditPack(currentCreditPack as Omit<CreditPackDefinition, "id" | "created_at" | "updated_at">);
      toast({ title: 'Success', description: 'Credit pack created.' });
      setIsCreditPackDialogOpen(false);
      setCurrentCreditPack(null);
      fetchData();
    } catch (err) {
      console.error('Failed to create credit pack:', err);
      toast({ title: 'Error', description: 'Failed to create credit pack.', variant: 'destructive' });
    }
  };

  const handleUpdateCreditPack = async () => {
    if (!currentCreditPack?.id) return;
    try {
      await api.updateCreditPack(currentCreditPack.id, currentCreditPack);
      toast({ title: 'Success', description: 'Credit pack updated.' });
      setIsCreditPackDialogOpen(false);
      setCurrentCreditPack(null);
      fetchData();
    } catch (err) {
      console.error('Failed to update credit pack:', err);
      toast({ title: 'Error', description: 'Failed to update credit pack.', variant: 'destructive' });
    }
  };

  const handleDeleteCreditPack = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credit pack?')) return;
    try {
      await api.deleteCreditPack(id);
      toast({ title: 'Success', description: 'Credit pack deleted.' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete credit pack:', err);
      toast({ title: 'Error', description: 'Failed to delete credit pack.', variant: 'destructive' });
    }
  };

  const openCreditPackDialog = (pack?: CreditPackDefinition) => {
    setCurrentCreditPack(pack || { name: '', description: '', credits_amount: 0, price: 0, currency: 'USD', validity_days: null });
    setIsCreditPackDialogOpen(true);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Pricing & Credit Pack Management</h1>

      {/* Pricing Plans Section */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Pricing Plans</CardTitle>
          <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openPlanDialog()}>Add New Plan</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{currentPlan?.id ? 'Edit Pricing Plan' : 'Create Pricing Plan'}</DialogTitle>
                <DialogDescription>
                  {currentPlan?.id ? 'Make changes to the pricing plan here.' : 'Add a new pricing plan.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="planName" className="text-right">Name</Label>
                  <Input
                    id="planName"
                    value={currentPlan?.name || ''}
                    onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="planDescription" className="text-right">Description</Label>
                  <Textarea
                    id="planDescription"
                    value={currentPlan?.description || ''}
                    onChange={(e) => setCurrentPlan({ ...currentPlan, description: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="planPrice" className="text-right">Price</Label>
                  <Input
                    id="planPrice"
                    type="number"
                    value={currentPlan?.price || 0}
                    onChange={(e) => setCurrentPlan({ ...currentPlan, price: parseFloat(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="planCurrency" className="text-right">Currency</Label>
                  <Input
                    id="planCurrency"
                    value={currentPlan?.currency || 'USD'}
                    onChange={(e) => setCurrentPlan({ ...currentPlan, currency: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="planInterval" className="text-right">Interval</Label>
                  <Select
                    value={currentPlan?.interval || 'month'}
                    onValueChange={(value) => setCurrentPlan({ ...currentPlan, interval: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                      <SelectItem value="lifetime">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={currentPlan?.id ? handleUpdatePlan : handleCreatePlan}>
                  {currentPlan?.id ? 'Save changes' : 'Create Plan'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricingPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{plan.description}</TableCell>
                  <TableCell>{plan.price} {plan.currency}</TableCell>
                  <TableCell>{plan.interval}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => openPlanDialog(plan)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeletePlan(plan.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Credit Packs Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Credit Packs</CardTitle>
          <Dialog open={isCreditPackDialogOpen} onOpenChange={setIsCreditPackDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openCreditPackDialog()}>Add New Credit Pack</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{currentCreditPack?.id ? 'Edit Credit Pack' : 'Create Credit Pack'}</DialogTitle>
                <DialogDescription>
                  {currentCreditPack?.id ? 'Make changes to the credit pack here.' : 'Add a new credit pack.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="creditPackName" className="text-right">Name</Label>
                  <Input
                    id="creditPackName"
                    value={currentCreditPack?.name || ''}
                    onChange={(e) => setCurrentCreditPack({ ...currentCreditPack, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="creditPackDescription" className="text-right">Description</Label>
                  <Textarea
                    id="creditPackDescription"
                    value={currentCreditPack?.description || ''}
                    onChange={(e) => setCurrentCreditPack({ ...currentCreditPack, description: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="creditsAmount" className="text-right">Credits Amount</Label>
                  <Input
                    id="creditsAmount"
                    type="number"
                    value={currentCreditPack?.credits_amount || 0}
                    onChange={(e) => setCurrentCreditPack({ ...currentCreditPack, credits_amount: parseInt(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="creditPackPrice" className="text-right">Price</Label>
                  <Input
                    id="creditPackPrice"
                    type="number"
                    value={currentCreditPack?.price || 0}
                    onChange={(e) => setCurrentCreditPack({ ...currentCreditPack, price: parseFloat(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="creditPackCurrency" className="text-right">Currency</Label>
                  <Input
                    id="creditPackCurrency"
                    value={currentCreditPack?.currency || 'USD'}
                    onChange={(e) => setCurrentCreditPack({ ...currentCreditPack, currency: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="validityDays" className="text-right">Validity Days (Optional)</Label>
                  <Input
                    id="validityDays"
                    type="number"
                    value={currentCreditPack?.validity_days || ''}
                    onChange={(e) => setCurrentCreditPack({ ...currentCreditPack, validity_days: e.target.value ? parseInt(e.target.value) : null })}
                    className="col-span-3"
                    placeholder="e.g., 365 for 1 year"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={currentCreditPack?.id ? handleUpdateCreditPack : handleCreateCreditPack}>
                  {currentCreditPack?.id ? 'Save changes' : 'Create Credit Pack'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditPacks.map((pack) => (
                <TableRow key={pack.id}>
                  <TableCell className="font-medium">{pack.name}</TableCell>
                  <TableCell>{pack.description}</TableCell>
                  <TableCell>{pack.credits_amount}</TableCell>
                  <TableCell>{pack.price} {pack.currency}</TableCell>
                  <TableCell>{pack.validity_days ? `${pack.validity_days} days` : 'No expiration'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => openCreditPackDialog(pack)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteCreditPack(pack.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingPlansManagementPage;
