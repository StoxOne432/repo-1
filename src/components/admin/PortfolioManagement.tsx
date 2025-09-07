import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Edit, Plus, TrendingUp, TrendingDown } from "lucide-react";

interface Portfolio {
  id: string;
  user_id: string;
  stock_symbol: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  profit_loss: number;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface PortfolioForm {
  stock_symbol: string;
  quantity: number;
  avg_price: number;
  current_price: number;
}

export function PortfolioManagement() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<PortfolioForm>({
    stock_symbol: "",
    quantity: 0,
    avg_price: 0,
    current_price: 0,
  });
  const [selectedUserId, setSelectedUserId] = useState("");
  const [users, setUsers] = useState<Array<{ user_id: string; full_name: string; email: string }>>([]);
  const { toast } = useToast();

  const fetchPortfolios = async () => {
    try {
      const { data: portfolios, error: portfoliosError } = await supabase
        .from('user_portfolios')
        .select('*')
        .order('created_at', { ascending: false });

      if (portfoliosError) throw portfoliosError;

      // Fetch user profiles separately
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');

      if (profilesError) throw profilesError;

      // Match portfolios with profiles
      const portfoliosWithProfiles = portfolios?.map(portfolio => {
        const profile = profiles?.find(p => p.user_id === portfolio.user_id);
        return {
          ...portfolio,
          profiles: {
            full_name: profile?.full_name || 'Unknown User',
            email: profile?.email || 'No Email'
          }
        };
      }) || [];

      setPortfolios(portfoliosWithProfiles as Portfolio[]);
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      toast({
        title: "Error",
        description: "Failed to fetch portfolios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const calculateProfitLoss = (quantity: number, avgPrice: number, currentPrice: number) => {
    return (currentPrice - avgPrice) * quantity;
  };

  const handleSubmit = async () => {
    try {
      const profitLoss = calculateProfitLoss(formData.quantity, formData.avg_price, formData.current_price);
      
      const portfolioData = {
        stock_symbol: formData.stock_symbol,
        quantity: formData.quantity,
        avg_price: formData.avg_price,
        current_price: formData.current_price,
        profit_loss: profitLoss
      };

      let error;
      if (isEditing && selectedPortfolio) {
        ({ error } = await supabase
          .from('user_portfolios')
          .update(portfolioData)
          .eq('id', selectedPortfolio.id));
      } else {
        if (!selectedUserId) {
          throw new Error("User ID is required for new portfolio");
        }
        ({ error } = await supabase
          .from('user_portfolios')
          .insert({
            stock_symbol: formData.stock_symbol,
            quantity: formData.quantity,
            avg_price: formData.avg_price,
            current_price: formData.current_price,
            profit_loss: profitLoss,
            user_id: selectedUserId
          }));
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Portfolio ${isEditing ? 'updated' : 'created'} successfully`,
      });

      fetchPortfolios();
      resetForm();
    } catch (error) {
      console.error('Error saving portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to save portfolio",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      stock_symbol: "",
      quantity: 0,
      avg_price: 0,
      current_price: 0,
    });
    setSelectedPortfolio(null);
    setSelectedUserId("");
    setIsEditing(false);
    setShowDialog(false);
  };

  const handleEdit = (portfolio: Portfolio) => {
    setFormData({
      stock_symbol: portfolio.stock_symbol,
      quantity: portfolio.quantity,
      avg_price: portfolio.avg_price,
      current_price: portfolio.current_price,
    });
    setSelectedPortfolio(portfolio);
    setIsEditing(true);
    setShowDialog(true);
  };

  const handleAdd = () => {
    resetForm();
    setShowDialog(true);
  };

  useEffect(() => {
    fetchPortfolios();
    fetchUsers();
  }, []);

  const filteredPortfolios = portfolios.filter(portfolio =>
    portfolio.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    portfolio.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    portfolio.stock_symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProfitLossColor = (profitLoss: number) => {
    if (profitLoss > 0) return "text-success";
    if (profitLoss < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const getProfitLossIcon = (profitLoss: number) => {
    if (profitLoss > 0) return <TrendingUp className="h-3 w-3" />;
    if (profitLoss < 0) return <TrendingDown className="h-3 w-3" />;
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Portfolio Management</CardTitle>
              <CardDescription>
                Manage user portfolios and P&L
              </CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Portfolio
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user name, email, or stock symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPortfolios.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No portfolios found.
              </p>
            ) : (
              filteredPortfolios.map((portfolio) => (
                <div key={portfolio.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{portfolio.profiles.full_name}</h4>
                      <p className="text-sm text-muted-foreground">{portfolio.profiles.email}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(portfolio)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Stock:</span>
                      <p className="text-lg font-bold">{portfolio.stock_symbol}</p>
                    </div>
                    <div>
                      <span className="font-medium">Quantity:</span>
                      <p>{portfolio.quantity.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="font-medium">Avg Price:</span>
                      <p>₹{portfolio.avg_price.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Current Price:</span>
                      <p>₹{portfolio.current_price.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="font-medium">P&L:</span>
                      <div className={`flex items-center gap-1 ${getProfitLossColor(portfolio.profit_loss)}`}>
                        {getProfitLossIcon(portfolio.profit_loss)}
                        <p className="font-bold">₹{portfolio.profit_loss.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Portfolio Dialog */}
      <Dialog open={showDialog} onOpenChange={() => resetForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Portfolio' : 'Add New Portfolio'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!isEditing && (
              <div>
                <Label htmlFor="user">User</Label>
                <select
                  id="user"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.full_name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <Label htmlFor="stock_symbol">Stock Symbol</Label>
              <Input
                id="stock_symbol"
                value={formData.stock_symbol}
                onChange={(e) => setFormData({ ...formData, stock_symbol: e.target.value.toUpperCase() })}
                placeholder="e.g., AAPL, GOOGL"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                min="1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="avg_price">Average Price (₹)</Label>
              <Input
                id="avg_price"
                type="number"
                step="0.01"
                value={formData.avg_price}
                onChange={(e) => setFormData({ ...formData, avg_price: parseFloat(e.target.value) || 0 })}
                min="0"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="current_price">Current Price (₹)</Label>
              <Input
                id="current_price"
                type="number"
                step="0.01"
                value={formData.current_price}
                onChange={(e) => setFormData({ ...formData, current_price: parseFloat(e.target.value) || 0 })}
                min="0"
                required
              />
            </div>
            
            <div className="bg-muted p-3 rounded">
              <Label className="text-sm font-medium">Calculated P&L:</Label>
              <p className={`text-lg font-bold ${getProfitLossColor(calculateProfitLoss(formData.quantity, formData.avg_price, formData.current_price))}`}>
                ₹{calculateProfitLoss(formData.quantity, formData.avg_price, formData.current_price).toFixed(2)}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={resetForm} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1"
                disabled={!formData.stock_symbol || (!isEditing && !selectedUserId)}
              >
                {isEditing ? 'Update' : 'Add'} Portfolio
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}