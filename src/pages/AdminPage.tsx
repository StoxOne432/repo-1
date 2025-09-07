import { Header } from "@/components/Header";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function AdminPage() {
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

  // Redirect non-admin users to regular dashboard
  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const userData = {
    name: profile?.full_name || user.email?.split('@')[0] || "Admin",
    email: user.email || "",
    avatar: "",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={userData}
        onLogout={signOut}
      />
      <AdminDashboard />
    </div>
  );
}