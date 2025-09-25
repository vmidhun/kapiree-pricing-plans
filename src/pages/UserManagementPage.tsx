import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  email: string;
  role_name: string;
  role_id: string;
  credits: number;
  created_at: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

const UserManagementPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    roleId: '',
  });

  const canManageUsers = hasPermission('Manage Users');

  useEffect(() => {
    console.log("UserManagementPage - canManageUsers:", canManageUsers); // Debugging log
    if (canManageUsers) {
      setError(null); // Clear any previous permission error
      fetchUsersAndRoles();
    } else {
      setLoading(false);
      setError('You do not have permission to manage users.');
      setUsers([]); // Clear users if permission is lost
    }
  }, [canManageUsers]);

  const fetchUsersAndRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        api.get<{ users: User[] }>('/api/auth/users'),
        api.get<{ roles: Role[] }>('/api/auth/roles'),
      ]);
      setUsers(usersResponse.data.users);
      setRoles(rolesResponse.data.roles);
    } catch (err) {
      console.error('Failed to fetch users or roles:', err);
      setError('Failed to load user data or roles.');
      toast.error('Failed to load user data or roles.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: User) => {
    setCurrentUser(user);
    setEditFormData({
      username: user.username,
      email: user.email,
      roleId: user.role_id,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setCurrentUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSelectChange = (value: string) => {
    setEditFormData((prev) => ({ ...prev, roleId: value }));
  };

  const handleSaveUser = async () => {
    if (!currentUser) return;

    try {
      await api.put(`/api/auth/users/${currentUser.id}`, editFormData);
      toast.success('User updated successfully!');
      setIsEditDialogOpen(false);
      fetchUsersAndRoles(); // Refresh the list
    } catch (err) {
      console.error('Failed to update user:', err);
      toast.error('Failed to update user.');
    }
  };

  const handleDeleteUser = async () => {
    if (!currentUser) return;

    try {
      await api.delete(`/api/auth/users/${currentUser.id}`);
      toast.success('User deleted successfully!');
      setIsDeleteDialogOpen(false);
      fetchUsersAndRoles(); // Refresh the list
    } catch (err) {
      console.error('Failed to delete user:', err);
      toast.error('Failed to delete user.');
    }
  };

  if (loading) {
    return <div className="p-4">Loading users...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>

      {!canManageUsers ? (
        <div className="text-red-500">You do not have the necessary permissions to view or manage users.</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role_name}</TableCell>
                  <TableCell>{user.credits}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => handleEditClick(user)}
                      disabled={!canManageUsers}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(user)}
                      disabled={!canManageUsers}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to {currentUser?.username}'s profile here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                value={editFormData.username}
                onChange={handleEditFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                value={editFormData.email}
                onChange={handleEditFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select value={editFormData.roleId} onValueChange={handleRoleSelectChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user <strong>{currentUser?.username}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPage;
