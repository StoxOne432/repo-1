import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, TrendingUp, Shield, UserCheck, Settings, LogOut } from "lucide-react";
import { UserManagement } from "./UserManagement";
import { UserVerificationManagement } from "./UserVerificationManagement";
import { PaymentSettings } from "./PaymentSettings";
import { FundRequestManagement } from "./FundRequestManagement";
import { PortfolioManagement } from "./PortfolioManagement";
import { WithdrawalManagement } from "./WithdrawalManagement";
import { KYCManagement } from "./KYCManagement";
import { useAuth } from "@/contexts/AuthContext";

export function AdminDashboard() {
  const { signOut, profile } = useAuth();

  return (
    <div className="min-h-screen bg-background p-4 space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users and platform operations</p>
        </div>
        <Button variant="outline" size="sm" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Management Sections */}
      <div className="space-y-6">
        <UserVerificationManagement />
        <KYCManagement />
        <FundRequestManagement />
        <WithdrawalManagement />
        <PortfolioManagement />
        <UserManagement />
        <PaymentSettings />
      </div>
    </div>
  );
}