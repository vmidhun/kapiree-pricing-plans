import React, { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[]; // Permissions directly associated with this role
}

interface Permission {
  id: string;
  name: string;
  description: string;
}

const RoleManagementPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const [isDeleteRoleDialogOpen, setIsDeleteRoleDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [editRoleFormData, setEditRoleFormData] = useState({
    name: '',
    description: '',
    selectedPermissionIds: new Set<string>(),
  });
  const [newRoleFormData, setNewRoleFormData] = useState({
    name: '',
    description: '',
    selectedPermissionIds: new Set<string>(),
  });

  const { user, isLoading: authLoading, isAuthenticated } = useAuth(); // Get user, authLoading, isAuthenticated
  const canManageRoles = user?.permissions?.includes('Manage Roles') || false; // Directly check permission from user object

  const fetchRolesAndPermissions = useCallback(async () => {
    if (!isAuthenticated || authLoading) return; // Only fetch if authenticated and not loading auth

    setLoading(true);
    setError(null);
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        api.get<{ roles: Role[] }>('/api/auth/roles'),
        api.get<{ permissions: Permission[] }>('/api/auth/permissions'),
      ]);

      const fetchedRoles = rolesResponse.data.roles;
      const fetchedPermissions = permissionsResponse.data.permissions;

      // For each role, fetch its specific permissions
      const rolesWithPermissions = await Promise.all(
        fetchedRoles.map(async (role: Role) => {
          try {
            const rolePermsResponse = await api.get<{ permissions: Permission[] }>(`/api/auth/roles/${role.id}/permissions`);
            return { ...role, permissions: rolePermsResponse.data.permissions };
          } catch (permErr) {
            console.error(`Failed to fetch permissions for role ${role.name}:`, permErr);
            return { ...role, permissions: [] }; // Default to no permissions on error
          }
        })
      );

      setRoles(rolesWithPermissions);
      setAllPermissions(fetchedPermissions);
    } catch (err) {
      console.error('Failed to fetch roles or permissions:', err);
      setError('Failed to load role data or permissions.');
      toast.error('Failed to load role data or permissions.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]); // Add isAuthenticated and authLoading to dependencies

  useEffect(() => {
    if (!authLoading && isAuthenticated && canManageRoles) {
      fetchRolesAndPermissions();
    } else if (!authLoading && (!isAuthenticated || !canManageRoles)) {
      setLoading(false);
      setError('You do not have permission to manage roles.');
      setRoles([]);
      setAllPermissions([]);
    }
  }, [authLoading, isAuthenticated, canManageRoles, fetchRolesAndPermissions]);

  const handleEditRoleClick = (role: Role) => {
    setCurrentRole(role);
    setEditRoleFormData({
      name: role.name,
      description: role.description,
      selectedPermissionIds: new Set(role.permissions.map(p => p.id)),
    });
    setIsEditRoleDialogOpen(true);
  };

  const handleCreateRoleClick = () => {
    setNewRoleFormData({
      name: '',
      description: '',
      selectedPermissionIds: new Set<string>(),
    });
    setIsCreateRoleDialogOpen(true);
  };

  const handleDeleteRoleClick = (role: Role) => {
    setCurrentRole(role);
    setIsDeleteRoleDialogOpen(true);
  };

  const handleEditRoleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditRoleFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewRoleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewRoleFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditPermissionToggle = (permissionId: string, checked: boolean) => {
    setEditRoleFormData((prev) => {
      const newSet = new Set(prev.selectedPermissionIds);
      if (checked) {
        newSet.add(permissionId);
      } else {
        newSet.delete(permissionId);
      }
      return { ...prev, selectedPermissionIds: newSet };
    });
  };

  const handleNewPermissionToggle = (permissionId: string, checked: boolean) => {
    setNewRoleFormData((prev) => {
      const newSet = new Set(prev.selectedPermissionIds);
      if (checked) {
        newSet.add(permissionId);
      } else {
        newSet.delete(permissionId);
      }
      return { ...prev, selectedPermissionIds: newSet };
    });
  };

  const handleSaveRole = async () => {
    if (!currentRole) return;

    try {
      // Update role name and description
      await api.put(`/api/auth/roles/${currentRole.id}`, {
        name: editRoleFormData.name,
        description: editRoleFormData.description,
      });

      // Update role permissions
      await api.put(`/api/auth/roles/${currentRole.id}/permissions`, {
        permissionIds: Array.from(editRoleFormData.selectedPermissionIds),
      });

      toast.success('Role updated successfully!');
      setIsEditRoleDialogOpen(false);
      fetchRolesAndPermissions(); // Refresh the list
    } catch (err) {
      console.error('Failed to update role:', err);
      toast.error('Failed to update role.');
    }
  };

  const handleCreateRole = async () => {
    try {
      const response = await api.post<{ role: Role }>(`/api/auth/roles`, {
        name: newRoleFormData.name,
        description: newRoleFormData.description,
        permissionIds: Array.from(newRoleFormData.selectedPermissionIds),
      });
      toast.success('Role created successfully!');
      setIsCreateRoleDialogOpen(false);
      fetchRolesAndPermissions(); // Refresh the list
    } catch (err) {
      console.error('Failed to create role:', err);
      toast.error('Failed to create role.');
    }
  };

  const handleDeleteRole = async () => {
    if (!currentRole) return;

    try {
      await api.delete(`/api/auth/roles/${currentRole.id}`);
      toast.success('Role deleted successfully!');
      setIsDeleteRoleDialogOpen(false);
      fetchRolesAndPermissions(); // Refresh the list
    } catch (err) {
      console.error('Failed to delete role:', err);
      toast.error('Failed to delete role.');
    }
  };

  if (loading) {
    return <div className="p-4">Loading roles...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Role Management</h1>

      {!canManageRoles ? (
        <div className="text-red-500">You do not have the necessary permissions to view or manage roles.</div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <Button onClick={handleCreateRoleClick}>Create New Role</Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell>
                      {role.permissions.map(p => p.name).join(', ')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => handleEditRoleClick(role)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRoleClick(role)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Create Role Dialog */}
      <Dialog open={isCreateRoleDialogOpen} onOpenChange={setIsCreateRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define the name, description, and permissions for the new role.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-role-name" className="text-right">
                Role Name
              </Label>
              <Input
                id="new-role-name"
                name="name"
                value={newRoleFormData.name}
                onChange={handleNewRoleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-role-description" className="text-right">
                Description
              </Label>
              <Input
                id="new-role-description"
                name="description"
                value={newRoleFormData.description}
                onChange={handleNewRoleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">Permissions</Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                {allPermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`new-perm-${permission.id}`}
                      checked={newRoleFormData.selectedPermissionIds.has(permission.id)}
                      onCheckedChange={(checked) =>
                        handleNewPermissionToggle(permission.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={`new-perm-${permission.id}`}>{permission.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole}>Create Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Make changes to {currentRole?.name}'s details and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role-name" className="text-right">
                Role Name
              </Label>
              <Input
                id="role-name"
                name="name"
                value={editRoleFormData.name}
                onChange={handleEditRoleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role-description" className="text-right">
                Description
              </Label>
              <Input
                id="role-description"
                name="description"
                value={editRoleFormData.description}
                onChange={handleEditRoleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">Permissions</Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                {allPermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`perm-${permission.id}`}
                      checked={editRoleFormData.selectedPermissionIds.has(permission.id)}
                      onCheckedChange={(checked) =>
                        handleEditPermissionToggle(permission.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={`perm-${permission.id}`}>{permission.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={isDeleteRoleDialogOpen} onOpenChange={setIsDeleteRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete role <strong>{currentRole?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRole}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagementPage;
