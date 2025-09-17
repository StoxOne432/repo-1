import { useState, useEffect } from 'react';
import { useWatchlist, WatchlistItem } from './useWatchlist';

export interface StockData {
  symbol: string;
  name: string;
  ltp: number;
  change: number;
  changePercent: number;
  volume: string;
  high: number;
  low: number;
  open: number;
}

export const useMarketData = () => {
  const { watchlist, isLoading: watchlistLoading, refreshWatchlist } = useWatchlist();
  const [marketData, setMarketData] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Convert watchlist to market data format
    const convertedData: StockData[] = watchlist.map((item: WatchlistItem) => ({
      symbol: item.stock_symbol,
      name: item.stock_name || item.stock_symbol,
      ltp: item.current_price || 0,
      change: parseFloat(item.net_change || '0'),
      changePercent: parseFloat(item.percent_change || '0'), // Add changePercent
      volume: '0', // Volume data not available from watchlist, return as string
      high: item.current_price || 0,
      low: item.current_price || 0,
      open: item.current_price || 0
    }));
    
    setMarketData(convertedData);
  }, [watchlist]);

  useEffect(() => {
    // Auto-refresh watchlist data every 30 seconds
    const interval = setInterval(() => {
      refreshWatchlist();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshWatchlist]);

  const getStockBySymbol = (symbol: string): StockData | undefined => {
    return marketData.find(stock => stock.symbol === symbol);
  };

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await refreshWatchlist();
    } catch (err) {
      setError('Failed to refresh market data');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    marketData,
    isLoading: isLoading || watchlistLoading,
    error,
    getStockBySymbol,
    refreshData
  };
};