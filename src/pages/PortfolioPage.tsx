import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown } from "lucide-react";
import { calculatePortfolioMetrics, formatCurrency, formatNumber } from "@/lib/portfolioUtils";

interface UserPortfolio {
  id: string;
  stock_symbol: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  profit_loss: number;
}

export default function PortfolioPage() {
  const { user, profile, signOut, loading } = useAuth();
  const [userPortfolios, setUserPortfolios] = useState<UserPortfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserPortfolios();
    }
  }, [user]);

  // Add interval to refresh portfolio data every 30 seconds
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        fetchUserPortfolios();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUserPortfolios = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_portfolios')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Portfolio fetch error:', error);
        throw error;
      }
      
      console.log('Fetched portfolios:', data);
      setUserPortfolios(data || []);
    } catch (error) {
      console.error('Error fetching user portfolios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const userData = {
    name: profile?.full_name || user.email?.split('@')[0] || "User",
    email: user.email || "",
    avatar: "",
  };

  const portfolioMetrics = calculatePortfolioMetrics(userPortfolios);

  return (
    <div className="min-h-screen bg-background">
      <Header user={userData} onLogout={signOut} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground">Your complete stock portfolio</p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="fintech-card border-0 bg-gradient-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold fintech-mono">{formatCurrency(portfolioMetrics.totalValue)}</div>
            </CardContent>
          </Card>

          <Card className="fintech-card border-0 bg-gradient-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold fintech-mono flex items-center gap-2 ${
                portfolioMetrics.totalProfitLoss >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                {portfolioMetrics.totalProfitLoss >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                {portfolioMetrics.totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(portfolioMetrics.totalProfitLoss)}
              </div>
            </CardContent>
          </Card>

          <Card className="fintech-card border-0 bg-gradient-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold fintech-mono">{portfolioMetrics.totalHoldings}</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Holdings */}
        <Card className="fintech-card border-0 bg-gradient-card">
          <CardHeader>
            <CardTitle className="fintech-heading">Your Holdings</CardTitle>
            <CardDescription>Detailed view of all your stock positions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : userPortfolios.length > 0 ? (
              <div className="space-y-4">
                {userPortfolios.map((portfolio) => (
                  <div key={portfolio.id} className="flex items-center justify-between p-6 rounded-xl bg-muted/30 border">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground">{portfolio.stock_symbol}</h3>
                      <p className="text-sm text-muted-foreground">{portfolio.quantity} shares</p>
                      <p className="text-sm text-muted-foreground">Avg. Price: ₹{portfolio.avg_price.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg fintech-mono">₹{portfolio.current_price.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Current Price</p>
                      <p className={`text-sm font-medium ${portfolio.profit_loss >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {portfolio.profit_loss >= 0 ? '+' : ''}₹{portfolio.profit_loss.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right ml-6">
                      <p className="font-bold text-lg fintech-mono">₹{(portfolio.quantity * portfolio.current_price).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Total Value</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No holdings found</p>
                <p className="text-sm text-muted-foreground mt-2">Your portfolio positions will appear here once you start trading</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}