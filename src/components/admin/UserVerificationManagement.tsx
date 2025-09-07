import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, CheckCircle, XCircle, Search, Calendar, User } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  verification_date: string | null;
  verification_notes: string | null;
  created_at: string;
}

export function UserVerificationManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 10;

  const fetchUsers = async (page = 1, search = "") => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('id, user_id, full_name, email, phone, verification_status, verification_date, verification_notes, created_at', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: users, error: usersError, count } = await query
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (usersError) throw usersError;

      setUsers((users || []) as UserProfile[]);
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

  const updateVerificationStatus = async (userId: string, status: 'approved' | 'rejected', notes: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          verification_status: status,
          is_verified: status === 'approved',
          verification_date: new Date().toISOString(),
          verification_notes: notes 
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User account ${status} successfully`,
      });

      fetchUsers(currentPage, searchTerm);
      setSelectedUser(null);
      setVerificationNotes("");
    } catch (error) {
      console.error('Error updating verification status:', error);
      toast({
        title: "Error",
        description: "Failed to update verification status",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success/20 text-success';
      case 'rejected': return 'bg-destructive/20 text-destructive';
      default: return 'bg-warning/20 text-warning';
    }
  };

  const getStatusCounts = () => {
    const counts = users.reduce((acc, user) => {
      acc[user.verification_status] = (acc[user.verification_status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return counts;
  };

  const statusCounts = getStatusCounts();

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
                <User className="h-5 w-5" />
                User Verification Management
              </CardTitle>
              <CardDescription>
                Review and approve user account registrations
              </CardDescription>
            </div>
            <div className="flex gap-2 text-sm">
              <Badge variant="outline" className="bg-warning/20 text-warning">
                Pending: {statusCounts.pending || 0}
              </Badge>
              <Badge variant="outline" className="bg-success/20 text-success">
                Approved: {statusCounts.approved || 0}
              </Badge>
              <Badge variant="outline" className="bg-destructive/20 text-destructive">
                Rejected: {statusCounts.rejected || 0}
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
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                        <Badge className={getStatusColor(user.verification_status)}>
                          {user.verification_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setVerificationNotes(user.verification_notes || "");
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Review
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

      {/* Review Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review User Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUser && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Name:</span>
                    <span>{selectedUser.full_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Email:</span>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Phone:</span>
                    <span>{selectedUser.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Joined:</span>
                    <span>{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Current Status:</span>
                    <Badge className={getStatusColor(selectedUser.verification_status)}>
                      {selectedUser.verification_status}
                    </Badge>
                  </div>
                </div>

                {selectedUser.verification_notes && (
                  <div className="bg-muted p-3 rounded">
                    <span className="font-medium text-sm">Previous Notes:</span>
                    <p className="text-sm mt-1">{selectedUser.verification_notes}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Verification Notes</label>
                  <Textarea
                    placeholder="Add notes about this user account..."
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                {selectedUser.verification_status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateVerificationStatus(selectedUser.user_id, 'approved', verificationNotes)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => updateVerificationStatus(selectedUser.user_id, 'rejected', verificationNotes)}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}