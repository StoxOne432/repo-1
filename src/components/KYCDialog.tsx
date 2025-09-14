import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ui/image-upload";
import { FileText, CheckCircle, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KYCDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface KYCDocument {
  id: string;
  aadhar_card_url?: string;
  pan_card_url?: string;
  kyc_status: string;
  verification_notes?: string;
  verification_date?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
}

export function KYCDialog({ open, onOpenChange }: KYCDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [aadharUrl, setAadharUrl] = useState("");
  const [panUrl, setPanUrl] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingKYC, setExistingKYC] = useState<KYCDocument | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchExistingKYC();
    }
  }, [open, user]);

  const fetchExistingKYC = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setExistingKYC(data);
        setAadharUrl(data.aadhar_card_url || "");
        setPanUrl(data.pan_card_url || "");
        setBankName(data.bank_name || "");
        setAccountNumber(data.account_number || "");
        setIfscCode(data.ifsc_code || "");
        setAccountHolderName(data.account_holder_name || "");
      }
    } catch (error) {
      console.error('Error fetching KYC documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitKYC = async () => {
    if (!user) return;

    if (!aadharUrl || !panUrl || !bankName || !accountNumber || !ifscCode || !accountHolderName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including documents and bank details",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const kycData = {
        user_id: user.id,
        aadhar_card_url: aadharUrl,
        pan_card_url: panUrl,
        bank_name: bankName,
        account_number: accountNumber,
        ifsc_code: ifscCode,
        account_holder_name: accountHolderName,
        kyc_status: 'pending'
      };

      if (existingKYC) {
        // Update existing KYC
        const { error } = await supabase
          .from('kyc_documents')
          .update(kycData)
          .eq('id', existingKYC.id);

        if (error) throw error;
      } else {
        // Create new KYC
        const { error } = await supabase
          .from('kyc_documents')
          .insert(kycData);

        if (error) throw error;
      }

      toast({
        title: "KYC Documents Submitted",
        description: "Your KYC documents have been submitted for verification",
      });

      onOpenChange(false);
      fetchExistingKYC(); // Refresh the data
    } catch (error) {
      console.error('Error submitting KYC documents:', error);
      toast({
        title: "Error",
        description: "Failed to submit KYC documents",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="outline" className="text-success border-success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-destructive border-destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-warning border-warning">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            KYC Verification
          </DialogTitle>
          <DialogDescription>
            Complete your Know Your Customer (KYC) verification
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {existingKYC && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">KYC Status</span>
                {getStatusBadge(existingKYC.kyc_status)}
              </div>
              {existingKYC.verification_notes && (
                <p className="text-sm text-muted-foreground">
                  <strong>Notes:</strong> {existingKYC.verification_notes}
                </p>
              )}
              {existingKYC.verification_date && (
                <p className="text-xs text-muted-foreground mt-1">
                  Verified on: {new Date(existingKYC.verification_date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="aadhar-upload" className="text-sm font-medium">
                Aadhar Card *
              </Label>
              <div className="mt-2">
                <ImageUpload
                  onImageUpload={setAadharUrl}
                  bucket="kyc-documents"
                  folder="aadhar"
                  accept=".jpg,.jpeg,.png,.pdf"
                  maxSize={5}
                  existingImageUrl={aadharUrl}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Upload a clear photo of your Aadhar card (JPG, PNG, PDF - Max 5MB)
              </p>
            </div>

            <div>
              <Label htmlFor="pan-upload" className="text-sm font-medium">
                PAN Card *
              </Label>
              <div className="mt-2">
                <ImageUpload
                  onImageUpload={setPanUrl}
                  bucket="kyc-documents"
                  folder="pan"
                  accept=".jpg,.jpeg,.png,.pdf"
                  maxSize={5}
                  existingImageUrl={panUrl}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Upload a clear photo of your PAN card (JPG, PNG, PDF - Max 5MB)
              </p>
            </div>

            {/* Bank Details Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold">Bank Account Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank-name" className="text-sm font-medium">
                    Bank Name *
                  </Label>
                  <Input
                    id="bank-name"
                    placeholder="Enter bank name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="account-holder" className="text-sm font-medium">
                    Account Holder Name *
                  </Label>
                  <Input
                    id="account-holder"
                    placeholder="Enter account holder name"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="account-number" className="text-sm font-medium">
                    Account Number *
                  </Label>
                  <Input
                    id="account-number"
                    placeholder="Enter account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="ifsc-code" className="text-sm font-medium">
                    IFSC Code *
                  </Label>
                  <Input
                    id="ifsc-code"
                    placeholder="Enter IFSC code"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong>
              <br />• Ensure documents are clear and readable
              <br />• All details should be visible
              <br />• Documents will be verified within 24-48 hours
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmitKYC}
              disabled={isSubmitting || !aadharUrl || !panUrl || !bankName || !accountNumber || !ifscCode || !accountHolderName || existingKYC?.kyc_status === 'approved'}
            >
              {isSubmitting ? "Submitting..." : existingKYC ? "Update KYC" : "Submit KYC"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}