import { useState, useEffect } from 'react';

interface StockData {
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

// Mock data for BSE stocks - in a real app, you'd integrate with an API
const mockMarketData: StockData[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", ltp: 2485.50, change: 12.50, changePercent: 0.51, volume: "12.3L", high: 2490, low: 2470, open: 2475 },
  { symbol: "TCS", name: "Tata Consultancy Services", ltp: 3180.25, change: -8.20, changePercent: -0.26, volume: "8.7L", high: 3195, low: 3175, open: 3185 },
  { symbol: "HDFCBANK", name: "HDFC Bank", ltp: 1595.75, change: 15.30, changePercent: 0.97, volume: "15.6L", high: 1602, low: 1580, open: 1585 },
  { symbol: "INFY", name: "Infosys Limited", ltp: 1435.80, change: 7.80, changePercent: 0.55, volume: "9.2L", high: 1445, low: 1425, open: 1430 },
  { symbol: "ITC", name: "ITC Limited", ltp: 248.45, change: -2.10, changePercent: -0.84, volume: "25.8L", high: 252, low: 246, open: 250 },
  { symbol: "ICICIBANK", name: "ICICI Bank", ltp: 1185.30, change: 18.50, changePercent: 1.59, volume: "13.2L", high: 1190, low: 1175, open: 1180 },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", ltp: 1520.60, change: -5.40, changePercent: -0.35, volume: "7.8L", high: 1535, low: 1515, open: 1525 },
  { symbol: "SBIN", name: "State Bank of India", ltp: 825.45, change: 12.25, changePercent: 1.51, volume: "18.5L", high: 830, low: 815, open: 820 },
  { symbol: "LT", name: "Larsen & Toubro", ltp: 3650.80, change: 28.90, changePercent: 0.80, volume: "4.2L", high: 3665, low: 3635, open: 3645 },
  { symbol: "WIPRO", name: "Wipro Limited", ltp: 540.25, change: -3.75, changePercent: -0.69, volume: "11.3L", high: 548, low: 538, open: 544 },
];

export function useMarketData() {
  const [marketData, setMarketData] = useState<StockData[]>(mockMarketData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prevData => 
        prevData.map(stock => {
          // Simulate small price changes
          const changeAmount = (Math.random() - 0.5) * 10; // Random change between -5 to +5
          const newLtp = Math.max(0, stock.ltp + changeAmount);
          const newChange = stock.change + changeAmount;
          const newChangePercent = ((newLtp - stock.open) / stock.open) * 100;
          
          return {
            ...stock,
            ltp: parseFloat(newLtp.toFixed(2)),
            change: parseFloat(newChange.toFixed(2)),
            changePercent: parseFloat(newChangePercent.toFixed(2)),
            high: Math.max(stock.high, newLtp),
            low: Math.min(stock.low, newLtp),
          };
        })
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getStockBySymbol = (symbol: string): StockData | undefined => {
    return marketData.find(stock => stock.symbol === symbol);
  };

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, you would fetch from an API here
      // For now, we'll just simulate a refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate API response with updated data
      setMarketData(mockMarketData.map(stock => ({
        ...stock,
        ltp: stock.ltp + (Math.random() - 0.5) * 20,
        change: stock.change + (Math.random() - 0.5) * 5,
      })));
    } catch (err) {
      setError('Failed to fetch market data');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    marketData,
    isLoading,
    error,
    getStockBySymbol,
    refreshData,
  };
}