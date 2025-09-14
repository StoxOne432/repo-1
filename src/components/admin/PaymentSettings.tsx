import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

export function PaymentSettings() {
  const [bankDetails, setBankDetails] = useState<BankDetail[]>([]);
  const [upiDetails, setUpiDetails] = useState<UpiDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [upiDialogOpen, setUpiDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankDetail | null>(null);
  const [editingUpi, setEditingUpi] = useState<UpiDetail | null>(null);
  const { toast } = useToast();

  const [bankForm, setBankForm] = useState({
    account_name: '',
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    branch: ''
  });

  const [upiForm, setUpiForm] = useState({
    upi_id: '',
    upi_name: '',
    description: ''
  });

  const fetchBankDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_details')
        .select('*')
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
    }
  };

  const fetchUpiDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('upi_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
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

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchBankDetails(), fetchUpiDetails()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingBank) {
        const { error } = await supabase
          .from('bank_details')
          .update(bankForm)
          .eq('id', editingBank.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Bank details updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('bank_details')
          .insert(bankForm);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Bank details added successfully",
        });
      }

      setBankForm({
        account_name: '',
        account_number: '',
        ifsc_code: '',
        bank_name: '',
        branch: ''
      });
      setEditingBank(null);
      setBankDialogOpen(false);
      fetchBankDetails();
    } catch (error) {
      console.error('Error saving bank details:', error);
      toast({
        title: "Error",
        description: "Failed to save bank details",
        variant: "destructive",
      });
    }
  };

  const handleUpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUpi) {
        const { error } = await supabase
          .from('upi_details')
          .update(upiForm)
          .eq('id', editingUpi.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "UPI details updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('upi_details')
          .insert(upiForm);

        if (error) throw error;
        toast({
          title: "Success",
          description: "UPI details added successfully",
        });
      }

      setUpiForm({
        upi_id: '',
        upi_name: '',
        description: ''
      });
      setEditingUpi(null);
      setUpiDialogOpen(false);
      fetchUpiDetails();
    } catch (error) {
      console.error('Error saving UPI details:', error);
      toast({
        title: "Error",
        description: "Failed to save UPI details",
        variant: "destructive",
      });
    }
  };

  const toggleBankActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('bank_details')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Bank account ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
      
      fetchBankDetails();
    } catch (error) {
      console.error('Error toggling bank status:', error);
      toast({
        title: "Error",
        description: "Failed to update bank status",
        variant: "destructive",
      });
    }
  };

  const toggleUpiActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('upi_details')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `UPI ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
      
      fetchUpiDetails();
    } catch (error) {
      console.error('Error toggling UPI status:', error);
      toast({
        title: "Error",
        description: "Failed to update UPI status",
        variant: "destructive",
      });
    }
  };

  const editBank = (bank: BankDetail) => {
    setBankForm({
      account_name: bank.account_name,
      account_number: bank.account_number,
      ifsc_code: bank.ifsc_code,
      bank_name: bank.bank_name,
      branch: bank.branch
    });
    setEditingBank(bank);
    setBankDialogOpen(true);
  };

  const editUpi = (upi: UpiDetail) => {
    setUpiForm({
      upi_id: upi.upi_id,
      upi_name: upi.upi_name,
      description: upi.description || ''
    });
    setEditingUpi(upi);
    setUpiDialogOpen(true);
  };

  const deleteUpi = async (id: string) => {
    try {
      const { error } = await supabase
        .from('upi_details')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "UPI details deleted successfully",
      });
      
      fetchUpiDetails();
    } catch (error) {
      console.error('Error deleting UPI details:', error);
      toast({
        title: "Error",
        description: "Failed to delete UPI details",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Settings</CardTitle>
        <CardDescription>
          Manage bank account and UPI payment methods for fund transfers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bank" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bank">Bank Accounts</TabsTrigger>
            <TabsTrigger value="upi">UPI Details</TabsTrigger>
          </TabsList>

          <TabsContent value="bank" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Bank Accounts</h3>
              <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setBankForm({
                      account_name: '',
                      account_number: '',
                      ifsc_code: '',
                      bank_name: '',
                      branch: ''
                    });
                    setEditingBank(null);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Bank Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingBank ? 'Edit Bank Account' : 'Add Bank Account'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleBankSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="account_name">Account Name</Label>
                      <Input
                        id="account_name"
                        value={bankForm.account_name}
                        onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="account_number">Account Number</Label>
                      <Input
                        id="account_number"
                        value={bankForm.account_number}
                        onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="ifsc_code">IFSC Code</Label>
                      <Input
                        id="ifsc_code"
                        value={bankForm.ifsc_code}
                        onChange={(e) => setBankForm({ ...bankForm, ifsc_code: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input
                        id="bank_name"
                        value={bankForm.bank_name}
                        onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="branch">Branch</Label>
                      <Input
                        id="branch"
                        value={bankForm.branch}
                        onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {editingBank ? 'Update' : 'Add'} Bank Account
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {bankDetails.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No bank accounts found</p>
              ) : (
                bankDetails.map((bank) => (
                  <div key={bank.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{bank.account_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {bank.account_number} • {bank.ifsc_code} • {bank.bank_name} • {bank.branch}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${bank.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {bank.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => editBank(bank)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleBankActive(bank.id, bank.is_active)}
                      >
                        {bank.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="upi" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">UPI Details</h3>
              <Dialog open={upiDialogOpen} onOpenChange={setUpiDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setUpiForm({
                      upi_id: '',
                      upi_name: '',
                      description: ''
                    });
                    setEditingUpi(null);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add UPI Details
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingUpi ? 'Edit UPI Details' : 'Add UPI Details'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpiSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="upi_id">UPI ID</Label>
                      <Input
                        id="upi_id"
                        value={upiForm.upi_id}
                        onChange={(e) => setUpiForm({ ...upiForm, upi_id: e.target.value })}
                        placeholder="example@paytm"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="upi_name">UPI Name</Label>
                      <Input
                        id="upi_name"
                        value={upiForm.upi_name}
                        onChange={(e) => setUpiForm({ ...upiForm, upi_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input
                        id="description"
                        value={upiForm.description}
                        onChange={(e) => setUpiForm({ ...upiForm, description: e.target.value })}
                        placeholder="PayTM, Google Pay, etc."
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {editingUpi ? 'Update' : 'Add'} UPI Details
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {upiDetails.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No UPI details found</p>
              ) : (
                upiDetails.map((upi) => (
                  <div key={upi.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{upi.upi_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {upi.upi_id} {upi.description && `• ${upi.description}`}
                      </p>
                    </div>
                     <div className="flex items-center gap-2">
                       <span className={`px-2 py-1 text-xs rounded ${upi.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                         {upi.is_active ? 'Active' : 'Inactive'}
                       </span>
                       <Button variant="outline" size="sm" onClick={() => editUpi(upi)}>
                         <Edit className="w-4 h-4" />
                       </Button>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => toggleUpiActive(upi.id, upi.is_active)}
                       >
                         {upi.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                       </Button>
                       <Button
                         variant="destructive"
                         size="sm"
                         onClick={() => deleteUpi(upi.id)}
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                     </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}