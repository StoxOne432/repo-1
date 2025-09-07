import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Copy, CheckCircle, Clock, ArrowLeft } from "lucide-react";

interface BankDetail {
  id: string;
  account_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch: string;
  is_active: boolean;
}

interface UpiDetail {
  id: string;
  upi_id: string;
  upi_name: string;
  description?: string;
  is_active: boolean;
}

interface WalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletDialog({ open, onOpenChange }: WalletDialogProps) {
  const [bankDetails, setBankDetails] = useState<BankDetail[]>([]);
  const [upiDetails, setUpiDetails] = useState<UpiDetail[]>([]);
  const [activeTab, setActiveTab] = useState<'bank' | 'upi'>('bank');
  const [showVerifyForm, setShowVerifyForm] = useState(true);
  const [amount, setAmount] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchBankDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bank_details')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBankDetails(data || []);
    } catch (error) {
      console.error('Error fetching bank details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bank details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUpiDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('upi_details')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched UPI details:', data);
      setUpiDetails(data || []);
    } catch (error) {
      console.error('Error fetching UPI details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch UPI details",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleSubmitRequest = async () => {
    if (!amount || !receiptUrl) {
      toast({
        title: "Required Fields",
        description: "Please enter amount and upload receipt",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in to submit fund request",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('fund_requests')
        .insert({
          user_id: user.id,
          amount: parseFloat(amount),
          receipt_image_url: receiptUrl,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Your fund request has been submitted for review. Funds will be reflected once approved.",
      });

      // Reset form
      setAmount("");
      setReceiptUrl("");
      setShowVerifyForm(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting fund request:', error);
      toast({
        title: "Error",
        description: "Failed to submit fund request",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchBankDetails();
      fetchUpiDetails();
      setShowVerifyForm(false);
      setAmount('');
      setReceiptUrl('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Funds</DialogTitle>
          <DialogDescription>
            Transfer money to your trading account using the payment methods below
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !showVerifyForm ? (
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'bank' | 'upi')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
                <TabsTrigger value="upi">UPI Payment</TabsTrigger>
              </TabsList>

              <TabsContent value="bank" className="space-y-4">
                {bankDetails.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No bank details available at the moment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bankDetails.map((bank, index) => (
                      <Card key={bank.id} className="border-primary/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{bank.bank_name}</CardTitle>
                          <CardDescription>{bank.branch}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label className="text-xs text-muted-foreground">Account Name</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="font-medium">{bank.account_name}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(bank.account_name, "Account name")}
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-xs text-muted-foreground">Account Number</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="font-medium font-mono">{bank.account_number}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(bank.account_number, "Account number")}
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-xs text-muted-foreground">IFSC Code</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="font-medium font-mono">{bank.ifsc_code}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(bank.ifsc_code, "IFSC code")}
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upi" className="space-y-4">
                {upiDetails.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No UPI details available at the moment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upiDetails.map((upi, index) => (
                      <Card key={upi.id} className="border-primary/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{upi.upi_name}</CardTitle>
                          {upi.description && <CardDescription>{upi.description}</CardDescription>}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">UPI ID</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="font-medium font-mono">{upi.upi_id}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(upi.upi_id, "UPI ID")}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {((activeTab === 'bank' && bankDetails.length > 0) || (activeTab === 'upi' && upiDetails.length > 0)) && (
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={() => setShowVerifyForm(true)}
                  className="w-full max-w-xs"
                >
                  Verify Payment
                </Button>
              </div>
            )}

            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <p className="font-medium">Instructions:</p>
              <p>1. Transfer money using the {activeTab === 'bank' ? 'bank details' : 'UPI ID'} shown above</p>
              <p>2. Click "Verify Payment" to submit your payment proof</p>
              <p>3. Funds will be credited within few minutes after verification</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Verify Your Payment</h3>
              <Button variant="ghost" onClick={() => setShowVerifyForm(false)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Submit Payment Proof</CardTitle>
                <CardDescription>
                  Upload your payment receipt and enter the amount you transferred
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="amount">Transfer Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    step="0.01"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Upload Payment Receipt/Screenshot</Label>
                  <ImageUpload
                    onImageUpload={setReceiptUrl}
                    bucket="fund-receipts"
                    className="mt-2"
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Processing Time:</span>
                    <span>Your funds will be credited within few minutes after verification.</span>
                  </div>
                </div>

                <Button
                  onClick={handleSubmitRequest}
                  disabled={submitting || !amount || !receiptUrl || !user}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit Fund Request
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}