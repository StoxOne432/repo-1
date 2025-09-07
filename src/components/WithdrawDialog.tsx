import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Banknote, CreditCard } from "lucide-react";

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WithdrawDialog({ open, onOpenChange }: WithdrawDialogProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWithdrawRequest = async () => {
    if (!user || !profile) return;

    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to withdraw",
        variant: "destructive",
      });
      return;
    }

    if (withdrawAmount > profile.funds) {
      toast({
        title: "Insufficient Funds",
        description: "Withdrawal amount cannot exceed available funds",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First, deduct the funds from user's account immediately
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          funds: profile.funds - withdrawAmount
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Then create the withdrawal request
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          amount: withdrawAmount,
          status: 'pending'
        });

      if (error) {
        // If request creation fails, restore the funds
        await supabase
          .from('profiles')
          .update({
            funds: profile.funds
          })
          .eq('user_id', user.id);
        throw error;
      }

      toast({
        title: "Withdrawal Request Submitted",
        description: "Funds have been deducted and request submitted for admin approval",
      });

      setAmount("");
      onOpenChange(false);
      // Refresh the profile data
      window.location.reload();
    } catch (error) {
      console.error('Error submitting withdrawal request:', error);
      toast({
        title: "Error",
        description: "Failed to submit withdrawal request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Withdraw Funds
          </DialogTitle>
          <DialogDescription>
            Request to withdraw funds from your account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available Balance</span>
              <span className="text-lg font-bold text-primary">₹{profile?.funds?.toLocaleString('en-IN') || '0'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="withdraw-amount">Withdrawal Amount</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                min="1"
                max={profile?.funds || 0}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum withdrawal: ₹1 | Maximum: ₹{profile?.funds?.toLocaleString('en-IN') || '0'}
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Withdrawal requests are subject to admin approval and may take 1-3 business days to process.
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
              onClick={handleWithdrawRequest}
              disabled={isSubmitting || !amount}
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}