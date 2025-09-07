import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, DollarSign, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  admin_notes?: string;
  created_at: string;
  user_profile?: {
    full_name: string;
    email: string;
    phone?: string;
  };
}

export function WithdrawalManagement() {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      // First fetch withdrawal requests
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (withdrawalError) throw withdrawalError;

      // Then fetch profiles for each user
      const withdrawalsWithProfiles = await Promise.all(
        (withdrawalData || []).map(async (withdrawal) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email, phone')
            .eq('user_id', withdrawal.user_id)
            .single();

          return {
            ...withdrawal,
            user_profile: profileData
          };
        })
      );

      setWithdrawals(withdrawalsWithProfiles);
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch withdrawal requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateWithdrawalStatus = async (withdrawalId: string, status: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status,
          admin_notes: notes
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      // If rejected, restore the funds to user's account
      if (status === 'rejected' && selectedWithdrawal) {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('funds')
          .eq('user_id', selectedWithdrawal.user_id)
          .single();

        if (currentProfile) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              funds: currentProfile.funds + selectedWithdrawal.amount
            })
            .eq('user_id', selectedWithdrawal.user_id);

          if (profileError) throw profileError;
        }
      }
      // If approved, funds are already deducted when request was made, so no action needed

      toast({
        title: "Success",
        description: `Withdrawal request ${status} successfully${status === 'rejected' ? ' and funds restored' : ''}`,
      });

      setSelectedWithdrawal(null);
      setAdminNotes('');
      fetchWithdrawals();
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      toast({
        title: "Error",
        description: "Failed to update withdrawal status",
        variant: "destructive",
      });
    }
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal =>
    withdrawal.user_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    withdrawal.user_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    withdrawal.amount.toString().includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-warning border-warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-success border-success"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-destructive border-destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const approvedCount = withdrawals.filter(w => w.status === 'approved').length;
  const rejectedCount = withdrawals.filter(w => w.status === 'rejected').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Withdrawal Management
            </CardTitle>
            <CardDescription>Manage user withdrawal requests</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-warning border-warning">
              Pending: {pendingCount}
            </Badge>
            <Badge variant="outline" className="text-success border-success">
              Approved: {approvedCount}
            </Badge>
            <Badge variant="outline" className="text-destructive border-destructive">
              Rejected: {rejectedCount}
            </Badge>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWithdrawals.map((withdrawal) => (
              <TableRow key={withdrawal.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{withdrawal.user_profile?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{withdrawal.user_profile?.email}</p>
                    {withdrawal.user_profile?.phone && (
                      <p className="text-sm text-muted-foreground">{withdrawal.user_profile.phone}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">₹{withdrawal.amount.toLocaleString('en-IN')}</span>
                </TableCell>
                <TableCell>
                  {getStatusBadge(withdrawal.status)}
                </TableCell>
                <TableCell>
                  {new Date(withdrawal.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal);
                          setAdminNotes(withdrawal.admin_notes || '');
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Review Withdrawal Request</DialogTitle>
                        <DialogDescription>
                          Review and approve or reject this withdrawal request
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedWithdrawal && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium">User</p>
                              <p className="text-sm text-muted-foreground">{selectedWithdrawal.user_profile?.full_name}</p>
                              <p className="text-sm text-muted-foreground">{selectedWithdrawal.user_profile?.email}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Amount</p>
                              <p className="text-sm text-muted-foreground">₹{selectedWithdrawal.amount.toLocaleString('en-IN')}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium mb-2">Admin Notes</p>
                            <Textarea
                              placeholder="Add notes about this withdrawal request..."
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                            />
                          </div>

                          {selectedWithdrawal.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="flex-1 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => updateWithdrawalStatus(selectedWithdrawal.id, 'rejected', adminNotes)}
                              >
                                Reject
                              </Button>
                              <Button
                                className="flex-1"
                                onClick={() => updateWithdrawalStatus(selectedWithdrawal.id, 'approved', adminNotes)}
                              >
                                Approve
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredWithdrawals.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No withdrawal requests found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}