import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface Stock {
  symbol: string;
  name: string;
  ltp: number;
  change: number;
  changePercent: number;
}

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: Stock | null;
  orderType: 'BUY' | 'SELL';
}

export function TradingModal({ isOpen, onClose, stock, orderType }: TradingModalProps) {
  const [orderMode, setOrderMode] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userFunds, setUserFunds] = useState(0);
  const [userHolding, setUserHolding] = useState(0);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user && stock) {
      fetchUserData();
      setPrice(stock.ltp.toString());
    }
  }, [isOpen, user, stock]);

  const fetchUserData = async () => {
    if (!user || !stock) return;

    try {
      // Fetch user funds
      const { data: profileData } = await supabase
        .from('profiles')
        .select('funds')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setUserFunds(profileData.funds || 0);
      }

      // Fetch user holding for this stock
      const { data: portfolioData } = await supabase
        .from('user_portfolios')
        .select('quantity')
        .eq('user_id', user.id)
        .eq('stock_symbol', stock.symbol)
        .maybeSingle();

      if (portfolioData) {
        setUserHolding(portfolioData.quantity || 0);
      } else {
        setUserHolding(0);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleClose = () => {
    setQuantity('');
    setPrice('');
    setOrderMode('MARKET');
    setIsSubmitting(false);
    onClose();
  };

  const handlePlaceOrder = async () => {
    if (!user || !stock || !quantity) return;

    const qty = parseInt(quantity);
    const orderPrice = orderMode === 'MARKET' ? stock.ltp : parseFloat(price);
    const totalAmount = qty * orderPrice;

    // Validation
    if (qty <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    if (orderType === 'BUY' && totalAmount > userFunds) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough funds for this order",
        variant: "destructive",
      });
      return;
    }

    if (orderType === 'SELL' && qty > userHolding) {
      toast({
        title: "Insufficient Shares",
        description: "You don't have enough shares to sell",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order record
      const { error: orderError } = await supabase.from('orders').insert({
        user_id: user.id,
        stock_symbol: stock.symbol,
        order_type: orderType.toLowerCase(),
        quantity: qty,
        price: orderPrice,
        total_amount: totalAmount,
        status: 'completed'
      });

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw orderError;
      }

      console.log(`Processing ${orderType} order for ${qty} shares of ${stock.symbol}`);

      if (orderType === 'BUY') {
        // Update user funds
        const { error: fundsError } = await supabase
          .from('profiles')
          .update({ funds: userFunds - totalAmount })
          .eq('user_id', user.id);

        if (fundsError) throw fundsError;

        // Update or create portfolio entry
        const { data: existingPortfolio } = await supabase
          .from('user_portfolios')
          .select('*')
          .eq('user_id', user.id)
          .eq('stock_symbol', stock.symbol)
          .maybeSingle();

        if (existingPortfolio) {
          const newQuantity = existingPortfolio.quantity + qty;
          const newAvgPrice = ((existingPortfolio.avg_price * existingPortfolio.quantity) + totalAmount) / newQuantity;

          const { error: updateError } = await supabase
            .from('user_portfolios')
            .update({
              quantity: newQuantity,
              avg_price: newAvgPrice,
              current_price: stock.ltp,
              profit_loss: (stock.ltp - newAvgPrice) * newQuantity
            })
            .eq('user_id', user.id)
            .eq('stock_symbol', stock.symbol);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('user_portfolios')
            .insert({
              user_id: user.id,
              stock_symbol: stock.symbol,
              quantity: qty,
              avg_price: orderPrice,
              current_price: stock.ltp,
              profit_loss: (stock.ltp - orderPrice) * qty
            });

          if (insertError) throw insertError;
        }
      } else { // SELL
        console.log(`Selling ${qty} shares, user has ${userHolding} shares`);
        
        // Update user funds
        const { error: fundsError } = await supabase
          .from('profiles')
          .update({ funds: userFunds + totalAmount })
          .eq('user_id', user.id);

        if (fundsError) {
          console.error('Funds update error:', fundsError);
          throw fundsError;
        }

        // Update portfolio
        const newQuantity = userHolding - qty;
        console.log(`New quantity after sell: ${newQuantity}`);
        
        if (newQuantity === 0) {
          console.log('Deleting portfolio entry as quantity is 0');
          const { error: deleteError } = await supabase
            .from('user_portfolios')
            .delete()
            .eq('user_id', user.id)
            .eq('stock_symbol', stock.symbol);

          if (deleteError) {
            console.error('Portfolio delete error:', deleteError);
            throw deleteError;
          }
        } else {
          console.log('Updating portfolio with new quantity');
          const { data: portfolioData } = await supabase
            .from('user_portfolios')
            .select('avg_price')
            .eq('user_id', user.id)
            .eq('stock_symbol', stock.symbol)
            .maybeSingle();

          const avgPrice = portfolioData?.avg_price || orderPrice;

          const { error: updateError } = await supabase
            .from('user_portfolios')
            .update({
              quantity: newQuantity,
              current_price: stock.ltp,
              profit_loss: (stock.ltp - avgPrice) * newQuantity
            })
            .eq('user_id', user.id)
            .eq('stock_symbol', stock.symbol);

          if (updateError) {
            console.error('Portfolio update error:', updateError);
            throw updateError;
          }
        }
      }

      toast({
        title: "Order Placed Successfully",
        description: `${orderType} order for ${qty} shares of ${stock.symbol} has been executed`,
      });

      // Refresh user data after successful order
      await fetchUserData();
      
      // Trigger a page refresh to update all portfolio displays
      setTimeout(() => {
        window.location.reload();
      }, 1000);

      handleClose();
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const orderValue = quantity && price ? parseInt(quantity) * parseFloat(price) : 0;

  if (!stock) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {orderType === 'BUY' ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            {orderType} {stock.symbol}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stock Info */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{stock.symbol}</h3>
                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {stock.name}
                </p>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatCurrency(stock.ltp)}</div>
                <div className={`text-sm ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>
          </div>

          {/* Order Mode */}
          <div className="space-y-2">
            <Label>Order Type</Label>
            <RadioGroup value={orderMode} onValueChange={(value: 'MARKET' | 'LIMIT') => setOrderMode(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="MARKET" id="market" />
                <Label htmlFor="market">Market Order</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="LIMIT" id="limit" />
                <Label htmlFor="limit">Limit Order</Label>
              </div>
            </RadioGroup>
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
              min="1"
            />
            <div className="flex gap-2">
              {[10, 25, 50, 100].map((qty) => (
                <Button
                  key={qty}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(qty.toString())}
                >
                  {qty}
                </Button>
              ))}
            </div>
          </div>

          {/* Price */}
          {orderMode === 'LIMIT' && (
            <div className="space-y-2">
              <Label htmlFor="price">Price per Share</Label>
              <Input
                id="price"
                type="number"
                placeholder="Enter price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
              />
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Order Value:</span>
              <span className="font-medium">{formatCurrency(orderValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <Wallet className="w-4 h-4" />
                Available Funds:
              </span>
              <Badge variant={userFunds >= orderValue ? "default" : "destructive"}>
                {formatCurrency(userFunds)}
              </Badge>
            </div>
            {orderType === 'SELL' && (
              <div className="flex justify-between items-center">
                <span>Available Shares:</span>
                <Badge variant={userHolding >= parseInt(quantity || '0') ? "default" : "destructive"}>
                  {userHolding}
                </Badge>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handlePlaceOrder}
              disabled={isSubmitting || !quantity || (orderMode === 'LIMIT' && !price)}
              className={`flex-1 ${orderType === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isSubmitting ? 'Processing...' : `${orderType} ${quantity || '0'} Shares`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}