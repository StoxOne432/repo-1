import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useIndianStockAPI, TrendingStock } from '@/hooks/useIndianStockAPI';
import { WatchlistButton } from '@/components/WatchlistButton';

interface TrendingStocksProps {
  onBuyStock: (stock: TrendingStock) => void;
  onSellStock: (stock: TrendingStock) => void;
}

export function TrendingStocks({ onBuyStock, onSellStock }: TrendingStocksProps) {
  const [trendingStocks, setTrendingStocks] = useState<TrendingStock[]>([]);
  const { fetchTrendingStocks, isLoading, error } = useIndianStockAPI();

  const loadTrendingStocks = async () => {
    const stocks = await fetchTrendingStocks();
    setTrendingStocks(stocks);
  };

  useEffect(() => {
    loadTrendingStocks();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (isLoading && trendingStocks.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Trending Stocks</h2>
          <Skeleton className="h-8 w-8" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="min-w-[280px] flex-shrink-0">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-3 w-32 mb-4" />
                <Skeleton className="h-6 w-16 mb-2" />
                <Skeleton className="h-4 w-24 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Trending Stocks</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={loadTrendingStocks}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          {error}
        </div>
      )}

      {trendingStocks.length === 0 && !isLoading ? (
        <div className="text-center text-muted-foreground py-8">
          No trending stocks available at the moment.
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {trendingStocks.map((stock) => (
            <Card key={stock.symbol} className="min-w-[280px] flex-shrink-0 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{stock.symbol}</h3>
                    <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                      {stock.company_name}
                    </p>
                  </div>
                  <div className={`flex items-center ${stock.net_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.net_change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold text-foreground">
                      {formatCurrency(stock.price)}
                    </div>
                    {stock.category && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        stock.category === 'gainer' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {stock.category}
                      </span>
                    )}
                  </div>
                  <div className={`text-sm ${stock.net_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.net_change >= 0 ? '+' : ''}{stock.net_change.toFixed(2)} ({stock.percent_change >= 0 ? '+' : ''}{stock.percent_change.toFixed(2)}%)
                  </div>
                  {stock.volume && (
                    <div className="text-xs text-muted-foreground">
                      Vol: {parseFloat(stock.volume).toLocaleString()}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    H: {formatCurrency(stock.high || 0)} L: {formatCurrency(stock.low || 0)}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onBuyStock(stock)}
                    className="flex-1"
                    variant="default"
                  >
                    Buy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSellStock(stock)}
                    className="flex-1"
                  >
                    Sell
                  </Button>
                </div>
                <div className="mt-2">
                  <WatchlistButton 
                    symbol={stock.ticker_id} 
                    name={stock.company_name}
                    variant="ghost"
                    size="sm"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}