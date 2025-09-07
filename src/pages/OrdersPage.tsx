import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrdersPage() {
  const { user, profile, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const userData = {
    name: profile?.full_name || user.email?.split('@')[0] || "User",
    email: user.email || "",
    avatar: "",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={userData} onLogout={signOut} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Your trading history and order status</p>
        </div>

        <Card className="fintech-card border-0 bg-gradient-card">
          <CardHeader>
            <CardTitle className="fintech-heading">Order History</CardTitle>
            <CardDescription>View all your buy and sell orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No orders found</p>
              <p className="text-sm text-muted-foreground mt-2">Your order history will appear here once you start trading</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}