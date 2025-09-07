import { Header } from "@/components/Header";
import { TradingInterface } from "@/components/trading/TradingInterface";

export default function TradingPage() {
  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "",
  };

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user}
        onLogout={handleLogout}
      />
      <TradingInterface />
    </div>
  );
}