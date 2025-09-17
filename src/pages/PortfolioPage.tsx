import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { calculatePortfolioMetrics, formatCurrency, calculateDaysHeld, calculateStockProfitLoss } from "@/lib/portfolioUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Navigate } from "react-router-dom";

interface UserPortfolio {
  id: string;
  stock_symbol: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  profit_loss: number;
  purchase_date: string;
  purchase_price: number;
  created_at: string;
  updated_at: string;
}

export default function PortfolioPage() {
  const { user, profile, loading, signOut } = useAuth();
  const [userPortfolios, setUserPortfolios] = useState<UserPortfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserPortfolios = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_portfolios')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching portfolios:', error);
        return;
      }

      setUserPortfolios(data || []);
    } catch (error) {
      console.error('Error fetching user portfolios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserPortfolios();
    }
  }, [user]);

  useEffect(() => {
    // Auto-refresh every 30 seconds to get updated prices
    if (user) {
      const interval = setInterval(() => {
        fetchUserPortfolios();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">My Portfolio</h1>
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>

          {/* Portfolio Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="fintech-card border-0 bg-gradient-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold fintech-mono">{formatCurrency(portfolioMetrics.totalValue)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="fintech-card border-0 bg-gradient-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Invested</p>
                    <p className="text-2xl font-bold fintech-mono">{formatCurrency(portfolioMetrics.totalInvested)}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="fintech-card border-0 bg-gradient-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total P&L</p>
                    <p className={`text-2xl font-bold fintech-mono ${portfolioMetrics.totalProfitLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {portfolioMetrics.totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(portfolioMetrics.totalProfitLoss)}
                    </p>
                    <p className={`text-xs fintech-mono ${portfolioMetrics.totalProfitLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
                      ({portfolioMetrics.totalProfitLossPercentage >= 0 ? '+' : ''}{portfolioMetrics.totalProfitLossPercentage.toFixed(2)}%)
                    </p>
                  </div>
                  {portfolioMetrics.totalProfitLoss >= 0 ? (
                    <TrendingUp className="h-8 w-8 text-success" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-destructive" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="fintech-card border-0 bg-gradient-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Holdings</p>
                    <p className="text-2xl font-bold fintech-mono">{portfolioMetrics.totalHoldings}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{portfolioMetrics.totalHoldings}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Holdings List */}
          <Card className="fintech-card border-0 bg-gradient-card">
            <CardHeader>
              <CardTitle className="fintech-heading">Your Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : userPortfolios.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No holdings found. Start trading to build your portfolio!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPortfolios.map((portfolio) => {
                    const daysHeld = calculateDaysHeld(portfolio.purchase_date);
                    const { profitLoss, profitLossPercentage } = calculateStockProfitLoss(
                      portfolio.current_price,
                      portfolio.purchase_price || portfolio.avg_price,
                      portfolio.quantity
                    );
                    
                    return (
                      <div key={portfolio.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{portfolio.stock_symbol}</h3>
                            <Badge variant="outline">{portfolio.quantity} shares</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>Purchase: {formatCurrency(portfolio.purchase_price || portfolio.avg_price)} on {new Date(portfolio.purchase_date).toLocaleDateString()}</div>
                            <div>Current: {formatCurrency(portfolio.current_price)} • {daysHeld} days held</div>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-1">
                          <div className="text-lg font-bold fintech-mono">
                            {formatCurrency(portfolio.current_price * portfolio.quantity)}
                          </div>
                          <div className={`text-sm fintech-mono ${profitLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
                          </div>
                          <div className={`text-xs fintech-mono ${profitLossPercentage >= 0 ? 'text-success' : 'text-destructive'}`}>
                            ({profitLossPercentage >= 0 ? '+' : ''}{profitLossPercentage.toFixed(2)}%)
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}