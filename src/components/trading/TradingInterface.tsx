import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, Activity, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMarketData } from "@/hooks/useMarketData";
import { TrendingStocks } from "./TrendingStocks";
import { StockSearch } from "./StockSearch";
import { TradingModal } from "./TradingModal";
import { TrendingStock, SearchStock } from "@/hooks/useIndianStockAPI";

interface TradingInterfaceProps {
  selectedStock?: string;
}

interface Stock {
  symbol: string;
  name: string;
  ltp: number;
  change: number;
  changePercent: number;
  volume?: string;
  high?: number;
  low?: number;
}

// Helper function to convert SearchStock to Stock interface for trading
const convertToStock = (stock: TrendingStock | SearchStock | null): Stock | null => {
  if (!stock) return null;
  
  if ('ltp' in stock) {
    // This is a TrendingStock
    return stock as Stock;
  } else {
    // This is a SearchStock, convert it
    const nsePrice = parseFloat(stock.currentPrice.NSE) || 0;
    const percentChange = parseFloat(stock.percentChange) || 0;
    
    return {
      symbol: stock.symbol,
      name: stock.companyName,
      ltp: nsePrice,
      change: (nsePrice * percentChange) / 100,
      changePercent: percentChange,
      volume: '0',
      high: nsePrice,
      low: nsePrice,
    };
  }
};

export function TradingInterface({ selectedStock }: TradingInterfaceProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [orderMode, setOrderMode] = useState("MARKET");
  const [userPortfolios, setUserPortfolios] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tradingModalOpen, setTradingModalOpen] = useState(false);
  const [modalStock, setModalStock] = useState<TrendingStock | SearchStock | null>(null);
  const [modalOrderType, setModalOrderType] = useState<'BUY' | 'SELL'>('BUY');
  
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { marketData, isLoading, refreshData } = useMarketData();

  const filteredStocks = marketData.filter(stock =>
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [activeStock, setActiveStock] = useState<Stock | null>(
    selectedStock ? marketData.find(s => s.symbol === selectedStock) || marketData[0] || null : marketData[0] || null
  );

  useEffect(() => {
    if (user) {
      fetchUserPortfolios();
    }
  }, [user]);

  // Refresh portfolio data every 30 seconds to keep it updated
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        fetchUserPortfolios();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (selectedStock) {
      const stock = marketData.find(s => s.symbol === selectedStock);
      if (stock) setActiveStock(stock);
    }
  }, [selectedStock, marketData]);

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

  const handlePlaceOrder = async () => {
    if (!user || !profile) {
      toast({
        title: "Authentication Required",
        description: "Please log in to place orders.",
        variant: "destructive",
      });
      return;
    }

    if (!quantity || (!price && orderMode === "LIMIT")) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const orderValue = orderMode === "MARKET" 
      ? (activeStock?.ltp || 0) * parseInt(quantity)
      : parseFloat(price) * parseInt(quantity);

    const finalPrice = orderMode === "MARKET" ? (activeStock?.ltp || 0) : parseFloat(price);

    if (orderType === "BUY" && orderValue > profile.funds) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough funds to place this order.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (orderType === "BUY") {
        // Check if user already has this stock
        const existingPortfolio = userPortfolios.find(p => p.stock_symbol === activeStock?.symbol);
        
        if (existingPortfolio) {
          // Update existing portfolio
          const newQuantity = existingPortfolio.quantity + parseInt(quantity);
          const newAvgPrice = ((existingPortfolio.avg_price * existingPortfolio.quantity) + orderValue) / newQuantity;
          const newProfitLoss = ((activeStock?.ltp || 0) - newAvgPrice) * newQuantity;

          const { error } = await supabase
            .from('user_portfolios')
            .update({
              quantity: newQuantity,
              avg_price: newAvgPrice,
              current_price: activeStock?.ltp || 0,
              profit_loss: newProfitLoss,
            })
            .eq('id', existingPortfolio.id);

          if (error) throw error;
        } else {
          // Create new portfolio entry
          const { error } = await supabase
            .from('user_portfolios')
            .insert({
              user_id: user.id,
              stock_symbol: activeStock?.symbol || '',
              quantity: parseInt(quantity),
              avg_price: finalPrice,
              current_price: activeStock?.ltp || 0,
              profit_loss: ((activeStock?.ltp || 0) - finalPrice) * parseInt(quantity),
            });

          if (error) throw error;
        }

        // Deduct funds from user account
        const { error: fundsError } = await supabase
          .from('profiles')
          .update({
            funds: profile.funds - orderValue
          })
          .eq('user_id', user.id);

        if (fundsError) throw fundsError;

      } else { // SELL
        const existingPortfolio = userPortfolios.find(p => p.stock_symbol === activeStock?.symbol);
        
        if (!existingPortfolio || existingPortfolio.quantity < parseInt(quantity)) {
          toast({
            title: "Insufficient Shares",
            description: "You don't have enough shares to sell.",
            variant: "destructive",
          });
          return;
        }

        const newQuantity = existingPortfolio.quantity - parseInt(quantity);
        
        if (newQuantity === 0) {
          // Remove portfolio entry if no shares left
          const { error } = await supabase
            .from('user_portfolios')
            .delete()
            .eq('id', existingPortfolio.id);

          if (error) throw error;
        } else {
          // Update portfolio with remaining shares
          const newProfitLoss = ((activeStock?.ltp || 0) - existingPortfolio.avg_price) * newQuantity;

          const { error } = await supabase
            .from('user_portfolios')
            .update({
              quantity: newQuantity,
              current_price: activeStock?.ltp || 0,
              profit_loss: newProfitLoss,
            })
            .eq('id', existingPortfolio.id);

          if (error) throw error;
        }

        // Add funds to user account
        const { error: fundsError } = await supabase
          .from('profiles')
          .update({
            funds: profile.funds + orderValue
          })
          .eq('user_id', user.id);

        if (fundsError) throw fundsError;
      }

      toast({
        title: "Order Executed Successfully",
        description: `${orderType} order for ${quantity} shares of ${activeStock?.symbol || 'N/A'} worth ₹${orderValue.toLocaleString()}`,
      });

      // Reset form and refresh data
      setQuantity("");
      setPrice("");
      await fetchUserPortfolios();
      
      // Force refresh after successful transaction
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Failed",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get user's holdings for selected stock
  const getUserHolding = (symbol: string) => {
    return userPortfolios.find(p => p.stock_symbol === symbol);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleBuyStock = (stock: TrendingStock | SearchStock) => {
    setModalStock(stock);
    setModalOrderType('BUY');
    setTradingModalOpen(true);
  };

  const handleSellStock = (stock: TrendingStock | SearchStock) => {
    setModalStock(stock);
    setModalOrderType('SELL');
    setTradingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Trending Stocks Section */}
        <TrendingStocks onBuyStock={handleBuyStock} onSellStock={handleSellStock} />

        {/* Stock Search Section */}
        <StockSearch onBuyStock={handleBuyStock} onSellStock={handleSellStock} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stock Search & List */}
          <div className="lg:col-span-2">
            <Card className="shadow-card mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Market Watch</CardTitle>
                    <CardDescription>Live BSE stock prices and market data</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshData}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search stocks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredStocks.map((stock) => (
                    <div
                      key={stock.symbol}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${
                        activeStock?.symbol === stock.symbol 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border'
                      }`}
                      onClick={() => setActiveStock(stock)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{stock.symbol}</h3>
                          <p className="text-sm text-muted-foreground">{stock.name}</p>
                          {getUserHolding(stock.symbol) && (
                            <p className="text-xs text-primary">Holdings: {getUserHolding(stock.symbol)?.quantity}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold trading-mono">₹{stock.ltp.toFixed(2)}</p>
                          <p className={`text-sm trading-mono flex items-center justify-end ${
                            stock.change >= 0 ? 'text-success' : 'text-destructive'
                          }`}>
                            {stock.change >= 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {stock.change >= 0 ? '+' : ''}₹{stock.change.toFixed(2)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>Vol: {stock.volume}</span>
                        <span>H: ₹{stock.high}</span>
                        <span>L: ₹{stock.low}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading Panel */}
          <div className="lg:col-span-1">
            <Card className="shadow-card sticky top-6">
              <CardHeader>
                <CardTitle>Place Order</CardTitle>
                <CardDescription>
                  {activeStock ? `Trading ${activeStock.symbol} - ${activeStock.name}` : 'Select a stock to trade'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!activeStock ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>Please select a stock from the market watch to start trading</p>
                  </div>
                ) : (
                <div className="space-y-4">
                  {/* Order Type Toggle */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={orderType === "BUY" ? "success" : "outline"}
                      onClick={() => setOrderType("BUY")}
                      className="w-full"
                    >
                      BUY
                    </Button>
                    <Button
                      variant={orderType === "SELL" ? "danger" : "outline"}
                      onClick={() => setOrderType("SELL")}
                      className="w-full"
                    >
                      SELL
                    </Button>
                  </div>

                  {/* Order Mode */}
                  <div className="space-y-2">
                    <Label>Order Type</Label>
                    <Tabs value={orderMode} onValueChange={setOrderMode}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="MARKET">Market</TabsTrigger>
                        <TabsTrigger value="LIMIT">Limit</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Available Funds & Holdings Display */}
                  <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Available Funds</span>
                      <span className="font-bold trading-mono text-primary">₹{profile?.funds?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                    {getUserHolding(activeStock?.symbol || '') && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Your Holdings</span>
                        <span className="font-bold trading-mono">{getUserHolding(activeStock?.symbol || '')?.quantity} shares</span>
                      </div>
                    )}
                  </div>

                  {/* Current Price Display */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Current Price</span>
                      <span className="font-bold trading-mono">₹{(activeStock?.ltp || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-muted-foreground">Change</span>
                      <span className={`text-sm trading-mono ${
                        (activeStock?.change || 0) >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {(activeStock?.change || 0) >= 0 ? '+' : ''}₹{(activeStock?.change || 0).toFixed(2)} ({(activeStock?.changePercent || 0) >= 0 ? '+' : ''}{(activeStock?.changePercent || 0).toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="Enter quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="trading-mono"
                    />
                  </div>

                  {/* Price (for limit orders) */}
                  {orderMode === "LIMIT" && (
                    <div className="space-y-2">
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="Enter price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="trading-mono"
                      />
                    </div>
                  )}

                  {/* Order Value */}
                  {quantity && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Order Value</span>
                        <span className="font-bold trading-mono">
                          {formatCurrency(
                            orderMode === "MARKET" 
                              ? (activeStock?.ltp || 0) * parseInt(quantity)
                              : (price ? parseFloat(price) * parseInt(quantity) : 0)
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Order Validation Messages */}
                  {orderType === "BUY" && quantity && profile && (
                    <div className={`p-2 rounded text-xs ${
                      (orderMode === "MARKET" ? (activeStock?.ltp || 0) * parseInt(quantity) : (price ? parseFloat(price) * parseInt(quantity) : 0)) > profile.funds
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-success/10 text-success'
                    }`}>
                      {(orderMode === "MARKET" ? (activeStock?.ltp || 0) * parseInt(quantity) : (price ? parseFloat(price) * parseInt(quantity) : 0)) > profile.funds
                        ? 'Insufficient funds for this order'
                        : 'Order can be placed'
                      }
                    </div>
                  )}

                  {orderType === "SELL" && quantity && (
                    <div className={`p-2 rounded text-xs ${
                      !getUserHolding(activeStock?.symbol || '') || (getUserHolding(activeStock?.symbol || '')?.quantity || 0) < parseInt(quantity)
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-success/10 text-success'
                    }`}>
                      {!getUserHolding(activeStock?.symbol || '') || (getUserHolding(activeStock?.symbol || '')?.quantity || 0) < parseInt(quantity)
                        ? 'Insufficient shares to sell'
                        : 'Order can be placed'
                      }
                    </div>
                  )}

                  {/* Place Order Button */}
                  <Button
                    variant={orderType === "BUY" ? "default" : "destructive"}
                    className="w-full"
                    onClick={handlePlaceOrder}
                    disabled={!quantity || isSubmitting || 
                      (orderType === "BUY" && profile && (orderMode === "MARKET" ? (activeStock?.ltp || 0) * parseInt(quantity) : (price ? parseFloat(price) * parseInt(quantity) : 0)) > profile.funds) ||
                      (orderType === "SELL" && (!getUserHolding(activeStock?.symbol || '') || (getUserHolding(activeStock?.symbol || '')?.quantity || 0) < parseInt(quantity)))
                    }
                  >
                    {isSubmitting ? "Processing..." : `${orderType} ${activeStock?.symbol || 'N/A'}`}
                  </Button>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity("10")}
                    >
                      10
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity("50")}
                    >
                      50
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity("100")}
                    >
                      100
                    </Button>
                  </div>

                  {/* Market Status */}
                  <div className="flex items-center justify-center pt-4 border-t">
                    <Badge variant="default" className="flex items-center">
                      <Activity className="h-3 w-3 mr-1" />
                      Market Open
                    </Badge>
                  </div>
                </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trading Modal */}
        {modalStock && (
          <TradingModal
            isOpen={tradingModalOpen}
            onClose={() => setTradingModalOpen(false)}
            stock={convertToStock(modalStock)}
            orderType={modalOrderType}
          />
        )}
      </div>
    </div>
  );
}