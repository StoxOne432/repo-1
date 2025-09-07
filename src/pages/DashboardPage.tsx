import { Header } from "@/components/Header";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function DashboardPage() {
  const { user, profile, signOut, role, loading } = useAuth();

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

  // Redirect admin users to admin panel
  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const userData = {
    name: profile?.full_name || user.email?.split('@')[0] || "User",
    email: user.email || "",
    avatar: "",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={userData}
        onLogout={signOut}
      />
      <Dashboard />
    </div>
  );
}