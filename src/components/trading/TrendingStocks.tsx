import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useIndianStockAPI, TrendingStock } from '@/hooks/useIndianStockAPI';

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
                      {stock.name}
                    </p>
                  </div>
                  <div className={`flex items-center ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="text-xl font-bold text-foreground">
                    {formatCurrency(stock.ltp)}
                  </div>
                  <div className={`text-sm ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                  </div>
                  {stock.volume && (
                    <div className="text-xs text-muted-foreground">
                      Vol: {stock.volume}
                    </div>
                  )}
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}