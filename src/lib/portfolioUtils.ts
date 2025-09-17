export const calculatePortfolioMetrics = (portfolios: any[]) => {
  // Filter out any entries with 0 or negative quantity
  const validPortfolios = portfolios.filter(portfolio => portfolio.quantity > 0);
  
  const totalValue = validPortfolios.reduce((sum, portfolio) => {
    return sum + (portfolio.current_price * portfolio.quantity);
  }, 0);

  const totalInvested = validPortfolios.reduce((sum, portfolio) => {
    return sum + (portfolio.avg_price * portfolio.quantity);
  }, 0);

  // Calculate P&L as current value minus invested value
  const totalProfitLoss = totalValue - totalInvested;

  return {
    totalValue,
    totalProfitLoss,
    totalInvested,
    totalHoldings: validPortfolios.length,
    totalProfitLossPercentage: totalInvested > 0 ? ((totalProfitLoss / totalInvested) * 100) : 0
  };
};

export const calculateDaysHeld = (purchaseDate: string): number => {
  const purchase = new Date(purchaseDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - purchase.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const calculateStockProfitLoss = (
  currentPrice: number, 
  purchasePrice: number, 
  quantity: number
): { profitLoss: number; profitLossPercentage: number } => {
  const profitLoss = (currentPrice - purchasePrice) * quantity;
  const profitLossPercentage = purchasePrice > 0 ? ((currentPrice - purchasePrice) / purchasePrice) * 100 : 0;
  
  return { profitLoss, profitLossPercentage };
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-IN').format(value);
};