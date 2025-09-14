import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, DollarSign, UserPlus, Users, Trash2, KeyRound } from 'lucide-react';
import { ChangePasswordDialog } from './ChangePasswordDialog';

interface User {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  funds: number;
  created_at: string;
  role: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [fundsAmount, setFundsAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [passwordChangeUser, setPasswordChangeUser] = useState<User | null>(null);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 10;

  const fetchUsers = async (page = 1, search = "") => {
    try {
      setLoading(true);
      
      // Fetch profiles with pagination
      let profileQuery = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (search) {
        profileQuery = profileQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: profiles, error: profilesError, count } = await profileQuery
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (profilesError) throw profilesError;

      if (!profiles) {
        setUsers([]);
        setTotalPages(0);
        return;
      }

      // Fetch roles for these users
      const userIds = profiles.map(p => p.user_id);
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles = profiles.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || 'user'
        };
      });

      setUsers(usersWithRoles);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserFunds = async (userId: string, amount: number, operation: 'add' | 'deduct') => {
    try {
      const user = users.find(u => u.user_id === userId);
      if (!user) return;

      const newFunds = operation === 'add' 
        ? user.funds + Math.abs(amount)
        : Math.max(0, user.funds - Math.abs(amount));

      const { error } = await supabase
        .from('profiles')
        .update({ funds: newFunds })
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => 
        u.user_id === userId ? { ...u, funds: newFunds } : u
      ));

      toast({
        title: "Success",
        description: `Funds ${operation === 'add' ? 'added to' : 'deducted from'} user successfully`,
      });

      setSelectedUser(null);
      setFundsAmount(0);
    } catch (error) {
      console.error('Error updating user funds:', error);
      toast({
        title: "Error",
        description: "Failed to update user funds",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete from auth.users table - this will cascade delete related records
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      // Remove from local state
      setUsers(users.filter(u => u.user_id !== userId));

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, searchTerm);
  }, [currentPage]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchUsers(1, searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const getRoleColor = (role: string) => {
    return role === 'admin' 
      ? 'bg-primary/20 text-primary' 
      : 'bg-muted text-muted-foreground';
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts, funds, and permissions
              </CardDescription>
            </div>
            <div className="flex gap-2 text-sm">
              <Badge variant="outline">
                Total Users: {users.length}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Funds</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-muted-foreground">{user.phone || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{user.funds.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUser(user)}
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            Funds
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPasswordChangeUser(user)}
                          >
                            <KeyRound className="h-3 w-3 mr-1" />
                            Change Password
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteUser(user.user_id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Funds Management Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage User Funds</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUser && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">User:</span>
                    <span>{selectedUser.full_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Current Funds:</span>
                    <span className="font-medium">₹{selectedUser.funds.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    placeholder="Enter amount..."
                    value={fundsAmount || ''}
                    onChange={(e) => setFundsAmount(Number(e.target.value))}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateUserFunds(selectedUser.user_id, fundsAmount, 'add')}
                    className="flex-1"
                    disabled={!fundsAmount || fundsAmount <= 0}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Funds
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateUserFunds(selectedUser.user_id, fundsAmount, 'deduct')}
                    className="flex-1"
                    disabled={!fundsAmount || fundsAmount <= 0}
                  >
                    Deduct Funds
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <ChangePasswordDialog
        open={!!passwordChangeUser}
        onOpenChange={() => setPasswordChangeUser(null)}
        userId={passwordChangeUser?.user_id || ''}
        userName={passwordChangeUser?.full_name || ''}
      />
    </>
  );
}