import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, CheckCircle, XCircle, Search } from "lucide-react";

interface FundRequest {
  id: string;
  user_id: string;
  amount: number;
  receipt_image_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

export function FundRequestManagement() {
  const [requests, setRequests] = useState<FundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<FundRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [imageViewUrl, setImageViewUrl] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const { toast } = useToast();

  const fetchFundRequests = async () => {
    try {
      const { data: requests, error: requestsError } = await supabase
        .from('fund_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Fetch user profiles separately
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');

      if (profilesError) throw profilesError;

      // Match requests with profiles
      const requestsWithProfiles = requests?.map(request => {
        const profile = profiles?.find(p => p.user_id === request.user_id);
        return {
          ...request,
          profiles: {
            full_name: profile?.full_name || 'Unknown User',
            email: profile?.email || 'No Email'
          }
        };
      }) || [];

      setRequests(requestsWithProfiles as FundRequest[]);
    } catch (error) {
      console.error('Error fetching fund requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch fund requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: 'approved' | 'rejected', notes: string) => {
    try {
      const { error } = await supabase
        .from('fund_requests')
        .update({ 
          status, 
          admin_notes: notes 
        })
        .eq('id', requestId);

      if (error) throw error;

      // If approved, add funds to user profile
      if (status === 'approved') {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          const { data: currentProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('funds')
            .eq('user_id', request.user_id)
            .single();

          if (fetchError) throw fetchError;

          const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
              funds: (currentProfile?.funds || 0) + request.amount
            })
            .eq('user_id', request.user_id);

          if (profileError) throw profileError;
        }
      }

      toast({
        title: "Success",
        description: `Fund request ${status} successfully`,
      });

      fetchFundRequests();
      setSelectedRequest(null);
      setAdminNotes("");
    } catch (error) {
      console.error('Error updating fund request:', error);
      toast({
        title: "Error",
        description: "Failed to update fund request",
        variant: "destructive",
      });
    }
  };

  const viewImage = async (imagePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('fund-receipts')
        .createSignedUrl(imagePath, 3600);
      
      if (data?.signedUrl) {
        setImageViewUrl(data.signedUrl);
        setShowImageModal(true);
      }
    } catch (error) {
      console.error('Error viewing image:', error);
      toast({
        title: "Error",
        description: "Failed to load image",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFundRequests();
  }, []);

  const filteredRequests = requests.filter(request =>
    request.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success/20 text-success';
      case 'rejected': return 'bg-destructive/20 text-destructive';
      default: return 'bg-warning/20 text-warning';
    }
  };

  if (loading) {
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
          <CardTitle>Fund Request Management</CardTitle>
          <CardDescription>
            Review and approve user fund requests
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user name, email, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No fund requests found.
              </p>
            ) : (
              filteredRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{request.profiles.full_name}</h4>
                      <p className="text-sm text-muted-foreground">{request.profiles.email}</p>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Amount:</span>
                      <p>₹{request.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="font-medium">Date:</span>
                      <p>{new Date(request.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="font-medium">Receipt:</span>
                      {request.receipt_image_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewImage(request.receipt_image_url!)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      ) : (
                        <p className="text-muted-foreground">No receipt</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setAdminNotes(request.admin_notes || "");
                            }}
                            className="text-xs"
                          >
                            Review
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {request.admin_notes && (
                    <div className="bg-muted p-3 rounded">
                      <span className="font-medium text-sm">Admin Notes:</span>
                      <p className="text-sm mt-1">{request.admin_notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Fund Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <>
                <div>
                  <p><strong>User:</strong> {selectedRequest.profiles.full_name}</p>
                  <p><strong>Amount:</strong> ₹{selectedRequest.amount.toLocaleString()}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Admin Notes</label>
                  <Textarea
                    placeholder="Add notes about this request..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateRequestStatus(selectedRequest.id, 'approved', adminNotes)}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => updateRequestStatus(selectedRequest.id, 'rejected', adminNotes)}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image View Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Receipt Image</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img 
              src={imageViewUrl} 
              alt="Receipt" 
              className="max-w-full max-h-96 object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}