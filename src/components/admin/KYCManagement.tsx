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
import { Search, FileText, Clock, CheckCircle, XCircle, Eye, ExternalLink } from 'lucide-react';

interface KYCDocument {
  id: string;
  user_id: string;
  aadhar_card_url?: string;
  pan_card_url?: string;
  kyc_status: string;
  verification_notes?: string;
  verification_date?: string;
  created_at: string;
  user_profile?: {
    full_name: string;
    email: string;
    phone?: string;
  };
}

export function KYCManagement() {
  const { toast } = useToast();
  const [kycDocuments, setKYCDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKYC, setSelectedKYC] = useState<KYCDocument | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  useEffect(() => {
    fetchKYCDocuments();
  }, []);

  const fetchKYCDocuments = async () => {
    setLoading(true);
    try {
      // First fetch KYC documents
      const { data: kycData, error: kycError } = await supabase
        .from('kyc_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (kycError) throw kycError;

      // Then fetch profiles for each user
      const kycWithProfiles = await Promise.all(
        (kycData || []).map(async (kyc) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email, phone')
            .eq('user_id', kyc.user_id)
            .single();

          return {
            ...kyc,
            user_profile: profileData
          };
        })
      );

      setKYCDocuments(kycWithProfiles);
    } catch (error) {
      console.error('Error fetching KYC documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch KYC documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateKYCStatus = async (kycId: string, status: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('kyc_documents')
        .update({
          kyc_status: status,
          verification_notes: notes,
          verification_date: new Date().toISOString()
        })
        .eq('id', kycId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `KYC ${status} successfully`,
      });

      setSelectedKYC(null);
      setVerificationNotes('');
      fetchKYCDocuments();
    } catch (error) {
      console.error('Error updating KYC status:', error);
      toast({
        title: "Error",
        description: "Failed to update KYC status",
        variant: "destructive",
      });
    }
  };

  const getDocumentUrl = async (path: string) => {
    try {
      const { data } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(path, 3600); // 1 hour expiry

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error getting document URL:', error);
      toast({
        title: "Error",
        description: "Failed to open document",
        variant: "destructive",
      });
    }
  };

  const filteredKYC = kycDocuments.filter(kyc =>
    kyc.user_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kyc.user_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kyc.kyc_status.toLowerCase().includes(searchTerm.toLowerCase())
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

  const pendingCount = kycDocuments.filter(kyc => kyc.kyc_status === 'pending').length;
  const approvedCount = kycDocuments.filter(kyc => kyc.kyc_status === 'approved').length;
  const rejectedCount = kycDocuments.filter(kyc => kyc.kyc_status === 'rejected').length;

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
              <FileText className="h-5 w-5" />
              KYC Management
            </CardTitle>
            <CardDescription>Manage user KYC document verification</CardDescription>
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
            placeholder="Search by name, email, or status..."
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
              <TableHead>Documents</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredKYC.map((kyc) => (
              <TableRow key={kyc.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{kyc.user_profile?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{kyc.user_profile?.email}</p>
                    {kyc.user_profile?.phone && (
                      <p className="text-sm text-muted-foreground">{kyc.user_profile.phone}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {kyc.aadhar_card_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => getDocumentUrl(kyc.aadhar_card_url!)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Aadhar
                      </Button>
                    )}
                    {kyc.pan_card_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => getDocumentUrl(kyc.pan_card_url!)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        PAN
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(kyc.kyc_status)}
                </TableCell>
                <TableCell>
                  {new Date(kyc.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedKYC(kyc);
                          setVerificationNotes(kyc.verification_notes || '');
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Review KYC Documents</DialogTitle>
                        <DialogDescription>
                          Review and verify user KYC documents
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedKYC && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium">User</p>
                              <p className="text-sm text-muted-foreground">{selectedKYC.user_profile?.full_name}</p>
                              <p className="text-sm text-muted-foreground">{selectedKYC.user_profile?.email}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Current Status</p>
                              {getStatusBadge(selectedKYC.kyc_status)}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium mb-2">Documents</p>
                            <div className="flex gap-2">
                              {selectedKYC.aadhar_card_url && (
                                <Button
                                  variant="outline"
                                  onClick={() => getDocumentUrl(selectedKYC.aadhar_card_url!)}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View Aadhar Card
                                </Button>
                              )}
                              {selectedKYC.pan_card_url && (
                                <Button
                                  variant="outline"
                                  onClick={() => getDocumentUrl(selectedKYC.pan_card_url!)}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View PAN Card
                                </Button>
                              )}
                            </div>
                          </div>

                          {selectedKYC.verification_notes && (
                            <div>
                              <p className="text-sm font-medium mb-2">Previous Notes</p>
                              <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                                {selectedKYC.verification_notes}
                              </p>
                            </div>
                          )}

                          <div>
                            <p className="text-sm font-medium mb-2">Verification Notes</p>
                            <Textarea
                              placeholder="Add notes about the KYC verification..."
                              value={verificationNotes}
                              onChange={(e) => setVerificationNotes(e.target.value)}
                            />
                          </div>

                          {selectedKYC.kyc_status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="flex-1 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => updateKYCStatus(selectedKYC.id, 'rejected', verificationNotes)}
                              >
                                Reject
                              </Button>
                              <Button
                                className="flex-1"
                                onClick={() => updateKYCStatus(selectedKYC.id, 'approved', verificationNotes)}
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

        {filteredKYC.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No KYC documents found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}