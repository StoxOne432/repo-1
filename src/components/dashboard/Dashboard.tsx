import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WalletDialog } from "@/components/WalletDialog";
import { WithdrawDialog } from "@/components/WithdrawDialog";
import { KYCDialog } from "@/components/KYCDialog";
import { supabase } from "@/integrations/supabase/client";
import { 
  Wallet, 
  Users, 
  FileText, 
  Gift, 
  TrendingUp, 
  TrendingDown, 
  LogOut, 
  DollarSign, 
  PieChart,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";

interface UserPortfolio {
  id: string;
  stock_symbol: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  profit_loss: number;
}

export function Dashboard() {
  const { profile, signOut, user } = useAuth();
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isKYCDialogOpen, setIsKYCDialogOpen] = useState(false);
  const [userPortfolios, setUserPortfolios] = useState<UserPortfolio[]>([]);

  useEffect(() => {
    fetchBankDetails();
    if (user) {
      fetchUserPortfolios();
    }
  }, [user]);

  const fetchBankDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_details')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setBankDetails(data);
    } catch (error) {
      // Use fallback data if no active bank details found
      setBankDetails({
        account_name: "TradePro Finance Ltd",
        account_number: "123456789012",
        ifsc_code: "HDFC0001234",
        bank_name: "HDFC Bank",
        branch: "Mumbai Main Branch"
      });
    }
  };

  const fetchUserPortfolios = async () => {
    try {
      const { data, error } = await supabase
        .from('user_portfolios')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setUserPortfolios(data || []);
    } catch (error) {
      console.error('Error fetching user portfolios:', error);
    }
  };

  // Calculate total P&L from holdings
  const totalProfitLoss = userPortfolios.reduce((total, portfolio) => total + portfolio.profit_loss, 0);

  // Calculate total portfolio value (current value of all holdings)
  const totalPortfolioValue = userPortfolios.reduce((total, portfolio) => total + (portfolio.quantity * portfolio.current_price), 0);

  return (
    <div className="min-h-screen bg-background p-4 space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.full_name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2 md:mr-2" />
            <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="fintech-card border-0 bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Available Funds</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold fintech-heading">₹{profile?.funds?.toLocaleString('en-IN') || '0'}</div>
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsWithdrawDialogOpen(true)}
                className="text-xs"
              >
                <ArrowDownLeft className="h-3 w-3 mr-1" />
                Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="fintech-card border-0 bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Portfolio</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold fintech-heading">₹{totalPortfolioValue.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Current value of holdings
            </p>
          </CardContent>
        </Card>

        <Card className="fintech-card border-0 bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total P&L</CardTitle>
            <div className={`w-8 h-8 rounded-lg ${totalProfitLoss >= 0 ? 'bg-gradient-to-br from-success to-success/80' : 'bg-gradient-to-br from-destructive to-destructive/80'} flex items-center justify-center`}>
              {totalProfitLoss >= 0 ? <ArrowUpRight className="h-4 w-4 text-white" /> : <TrendingDown className="h-4 w-4 text-white" />}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold fintech-heading ${totalProfitLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
              {totalProfitLoss >= 0 ? '+' : ''}₹{totalProfitLoss.toLocaleString('en-IN')}
            </div>
            <p className={`text-xs mt-1 ${totalProfitLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
              From all holdings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Popular Stocks */}
      <Card className="fintech-card border-0 bg-gradient-card">
        <CardHeader>
          <CardTitle className="fintech-heading">Popular Stocks</CardTitle>
          <CardDescription>Most traded stocks today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Panel */}
            <div className="space-y-4">
              {[
                { name: "SUNPHARMA", fullName: "Sun Pharma", price: 1784.8, change: 0.02, logo: "🔶" },
                { name: "HDFCBANK", fullName: "HDFC Bank", price: 1800, change: 1.67, logo: "🏛️" },
                { name: "COALINDIA", fullName: "Coal India", price: 406, change: 0.15, logo: "⚫" },
              ].map((stock, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer border border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-lg shadow-sm">
                      {stock.logo}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{stock.name}</p>
                      <p className="text-sm text-muted-foreground">{stock.fullName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground fintech-mono">₹{stock.price.toLocaleString()}</p>
                    <p className={`text-sm font-medium ${stock.change > 0 ? 'text-success' : 'text-destructive'}`}>
                      {stock.change > 0 ? '+' : ''}{stock.change}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Right Panel */}
            <div className="space-y-4">
              {[
                { name: "TCS", fullName: "Tata Consultancy", price: 3650, change: 1.8, logo: "💼" },
                { name: "RELIANCE", fullName: "Reliance Industries", price: 2850, change: -0.5, logo: "🏢" },
                { name: "INFY", fullName: "Infosys Limited", price: 1420, change: 2.1, logo: "💻" },
              ].map((stock, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer border border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center text-lg shadow-sm">
                      {stock.logo}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{stock.name}</p>
                      <p className="text-sm text-muted-foreground">{stock.fullName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground fintech-mono">₹{stock.price.toLocaleString()}</p>
                    <p className={`text-sm font-medium ${stock.change > 0 ? 'text-success' : 'text-destructive'}`}>
                      {stock.change > 0 ? '+' : ''}{stock.change}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card
          className="fintech-card cursor-pointer hover:shadow-card-hover transition-all duration-300 group border-0 bg-gradient-card"
          onClick={() => setIsWalletDialogOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsWalletDialogOpen(true) }}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-3">
            <div className="p-4 bg-gradient-primary rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-card-foreground">Wallet</span>
          </CardContent>
        </Card>

        <Card className="fintech-card cursor-pointer hover:shadow-card-hover transition-all duration-300 group border-0 bg-gradient-card">
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-3">
            <div className="p-4 bg-gradient-accent rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <Users className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-card-foreground">Refer</span>
          </CardContent>
        </Card>

        <Card 
          className="fintech-card cursor-pointer hover:shadow-card-hover transition-all duration-300 group border-0 bg-gradient-card"
          onClick={() => setIsKYCDialogOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsKYCDialogOpen(true) }}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-3">
            <div className="p-4 bg-gradient-to-br from-primary to-accent rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-card-foreground">KYC</span>
          </CardContent>
        </Card>

        <Card className="fintech-card cursor-pointer hover:shadow-card-hover transition-all duration-300 group border-0 bg-gradient-card">
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-3">
            <div className="p-4 bg-gradient-to-br from-success to-success/80 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-card-foreground">Offer</span>
          </CardContent>
        </Card>
      </div>

      {/* Holdings and Watchlist */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="fintech-card border-0 bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="fintech-heading">Your Holdings</CardTitle>
              <CardDescription>Current stock positions</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/portfolio'}
              className="text-sm"
            >
              View all
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {userPortfolios.length > 0 ? (
              userPortfolios.map((portfolio) => (
                <div key={portfolio.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                  <div>
                    <p className="font-semibold text-foreground">{portfolio.stock_symbol}</p>
                    <p className="text-sm text-muted-foreground">{portfolio.quantity} shares</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold fintech-mono">₹{portfolio.current_price.toLocaleString()}</p>
                    <p className={`text-sm font-medium ${portfolio.profit_loss > 0 ? 'text-success' : 'text-destructive'}`}>
                      {portfolio.profit_loss > 0 ? '+' : ''}₹{portfolio.profit_loss.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No holdings found</p>
                <p className="text-sm text-muted-foreground mt-1">Your portfolio positions will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="fintech-card border-0 bg-gradient-card">
          <CardHeader>
            <CardTitle className="fintech-heading">Market Watchlist</CardTitle>
            <CardDescription>Stocks you're tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Tata Consultancy", symbol: "TCS", price: 3650, change: 1.8 },
              { name: "Asian Paints", symbol: "ASIANPAINT", price: 3200, change: -0.5 },
              { name: "Bajaj Finance", symbol: "BAJFINANCE", price: 7800, change: 2.1 },
            ].map((stock, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div>
                  <p className="font-semibold text-foreground">{stock.symbol}</p>
                  <p className="text-sm text-muted-foreground">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold fintech-mono">₹{stock.price.toLocaleString()}</p>
                  <p className={`text-sm font-medium ${stock.change > 0 ? 'text-success' : 'text-destructive'}`}>
                    {stock.change > 0 ? '+' : ''}{stock.change}%
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <WalletDialog 
        open={isWalletDialogOpen} 
        onOpenChange={setIsWalletDialogOpen} 
      />
      <WithdrawDialog 
        open={isWithdrawDialogOpen} 
        onOpenChange={setIsWithdrawDialogOpen} 
      />
      <KYCDialog 
        open={isKYCDialogOpen} 
        onOpenChange={setIsKYCDialogOpen} 
      />
    </div>
  );
}