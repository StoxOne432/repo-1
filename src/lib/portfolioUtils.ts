export const calculatePortfolioMetrics = (portfolios: any[]) => {
  const totalValue = portfolios.reduce((sum, portfolio) => {
    return sum + (portfolio.current_price * portfolio.quantity);
  }, 0);

  const totalProfitLoss = portfolios.reduce((sum, portfolio) => {
    return sum + portfolio.profit_loss;
  }, 0);

  const totalInvested = portfolios.reduce((sum, portfolio) => {
    return sum + (portfolio.avg_price * portfolio.quantity);
  }, 0);

  return {
    totalValue,
    totalProfitLoss,
    totalInvested,
    totalHoldings: portfolios.length
  };
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