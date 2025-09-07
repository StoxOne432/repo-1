import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BankDetail {
  id: string;
  account_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch: string;
  is_active: boolean;
}

export function BankDetailsManagement() {
  const [bankDetails, setBankDetails] = useState<BankDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDetail, setEditingDetail] = useState<BankDetail | null>(null);
  const [formData, setFormData] = useState({
    account_name: "",
    account_number: "",
    ifsc_code: "",
    bank_name: "",
    branch: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBankDetails(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch bank details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingDetail) {
        const { error } = await supabase
          .from('bank_details')
          .update(formData)
          .eq('id', editingDetail.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Bank details updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('bank_details')
          .insert(formData);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Bank details added successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingDetail(null);
      setFormData({
        account_name: "",
        account_number: "",
        ifsc_code: "",
        bank_name: "",
        branch: ""
      });
      fetchBankDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save bank details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (detail: BankDetail) => {
    setEditingDetail(detail);
    setFormData({
      account_name: detail.account_name,
      account_number: detail.account_number,
      ifsc_code: detail.ifsc_code,
      bank_name: detail.bank_name,
      branch: detail.branch
    });
    setIsDialogOpen(true);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('bank_details')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Bank details ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
      fetchBankDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update bank details status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bank Details Management</CardTitle>
            <CardDescription>Manage bank account details for fund transfers</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingDetail(null);
                setFormData({
                  account_name: "",
                  account_number: "",
                  ifsc_code: "",
                  bank_name: "",
                  branch: ""
                });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Bank Details
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingDetail ? 'Edit' : 'Add'} Bank Details</DialogTitle>
                <DialogDescription>
                  {editingDetail ? 'Update' : 'Add new'} bank account details for fund transfers
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account_name">Account Name</Label>
                  <Input
                    id="account_name"
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_number">Account Number</Label>
                  <Input
                    id="account_number"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifsc_code">IFSC Code</Label>
                  <Input
                    id="ifsc_code"
                    value={formData.ifsc_code}
                    onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Saving...' : (editingDetail ? 'Update' : 'Add')} Bank Details
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bankDetails.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No bank details found</p>
          ) : (
            bankDetails.map((detail) => (
              <div key={detail.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{detail.account_name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      detail.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {detail.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {detail.account_number} • {detail.ifsc_code}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {detail.bank_name}, {detail.branch}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(detail)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={detail.is_active ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleActive(detail.id, detail.is_active)}
                  >
                    {detail.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}