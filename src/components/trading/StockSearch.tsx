import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import { useIndianStockAPI, SearchStock } from '@/hooks/useIndianStockAPI';

interface StockSearchProps {
  onBuyStock: (stock: SearchStock) => void;
  onSellStock: (stock: SearchStock) => void;
}

export function StockSearch({ onBuyStock, onSellStock }: StockSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchStock[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { searchStocks, isLoading, error } = useIndianStockAPI();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setHasSearched(true);
    const results = await searchStocks(searchQuery);
    setSearchResults(results);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Search Stocks</h2>
      </div>

      {/* Search Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Search stocks (e.g., tata, reliance, hdfc...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={isLoading || !searchQuery.trim()}>
          <Search className="w-4 h-4" />
          Search
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
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
      )}

      {/* Search Results */}
      {hasSearched && !isLoading && (
        <div>
          {searchResults.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 bg-muted/20 rounded-lg">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-sm">
                Try searching with a different company name or stock symbol.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((stock) => (
                <Card key={stock.symbol} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{stock.symbol}</h3>
                      <span className={`text-sm font-medium ${
                        parseFloat(stock.percentChange) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {parseFloat(stock.percentChange) >= 0 ? '+' : ''}{stock.percentChange}%
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">{stock.companyName}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">NSE: </span>
                        <span className="font-semibold">₹{stock.currentPrice.NSE}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">BSE: </span>
                        <span className="font-semibold">₹{stock.currentPrice.BSE}</span>
                      </div>
                    </div>
                    {stock.industry && (
                      <p className="text-xs text-muted-foreground">
                        Industry: {stock.industry}
                      </p>
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
      )}
    </div>
  );
}