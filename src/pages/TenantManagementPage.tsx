import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, Tenant, TenantsResponse } from '../lib/api'; // Import Tenant and TenantsResponse
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from '../components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const TenantManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [adminUserId, setAdminUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTenants = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<TenantsResponse>('/api/tenants'); // Use TenantsResponse type
      setTenants(response.data.tenants);
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
      setError('Failed to load tenants. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load tenants.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'Super Admin' && user.permissions.includes('Manage Tenants')) {
      fetchTenants();
    } else {
      setLoading(false);
      setError('You do not have permission to view this page.');
    }
  }, [user]);

  const handleCreateTenant = () => {
    setCurrentTenant(null);
    setTenantName('');
    setAdminUserId('');
    setIsModalOpen(true);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setCurrentTenant(tenant);
    setTenantName(tenant.name);
    setAdminUserId(tenant.admin_user_id || '');
    setIsModalOpen(true);
  };

  const handleDeleteTenant = (tenant: Tenant) => {
    setCurrentTenant(tenant);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    if (!tenantName || !adminUserId) {
      setError('Tenant Name and Admin User ID are required.');
      toast({
        title: 'Error',
        description: 'Tenant Name and Admin User ID are required.',
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }

    try {
      if (currentTenant) {
        // Update tenant
        await api.put(`/api/tenants/${currentTenant.id}`, { name: tenantName, admin_user_id: adminUserId });
        toast({
          title: 'Success',
          description: 'Tenant updated successfully.',
        });
      } else {
        // Create tenant
        await api.post('/api/tenants', { name: tenantName, admin_user_id: adminUserId });
        toast({
          title: 'Success',
          description: 'Tenant created successfully.',
        });
      }
      setIsModalOpen(false);
      fetchTenants(); // Refresh the list
    } catch (err: any) {
      console.error('Failed to save tenant:', err);
      setError(err.response?.data?.message || 'Failed to save tenant.');
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to save tenant.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (currentTenant) {
        await api.delete(`/api/tenants/${currentTenant.id}`);
        toast({
          title: 'Success',
          description: 'Tenant deleted successfully.',
        });
        setIsDeleteModalOpen(false);
        fetchTenants(); // Refresh the list
      }
    } catch (err: any) {
      console.error('Failed to delete tenant:', err);
      setError(err.response?.data?.message || 'Failed to delete tenant.');
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to delete tenant.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!user || user.role !== 'Super Admin' || !user.permissions.includes('Manage Tenants')) {
    return (
      <div className="container mx-auto p-4 text-center text-red-500">
        <p>Access Denied: You do not have the necessary permissions to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Tenant Management</h1>

      <div className="flex justify-end mb-4">
        <Button onClick={handleCreateTenant}>Create New Tenant</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Admin User ID</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell>{tenant.admin_user_id || 'N/A'}</TableCell>
                <TableCell>{new Date(tenant.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditTenant(tenant)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteTenant(tenant)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Tenant Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentTenant ? 'Edit Tenant' : 'Create New Tenant'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="tenantName" className="text-right">
                Tenant Name
              </label>
              <Input
                id="tenantName"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="adminUserId" className="text-right">
                Admin User ID
              </label>
              <Input
                id="adminUserId"
                value={adminUserId}
                onChange={(e) => setAdminUserId(e.target.value)}
                className="col-span-3"
                placeholder="UUID of an existing user"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm col-span-4 text-center">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentTenant ? 'Save Changes' : 'Create Tenant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete tenant "{currentTenant?.name}"?</p>
            <p className="text-sm text-red-500">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantManagementPage;
