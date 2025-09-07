import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Shield, Smartphone, BarChart3, Users, Zap, DollarSign, Globe } from "lucide-react";

export function FinTechFeatures() {
  const features = [
    {
      icon: TrendingUp,
      title: "Advanced Analytics",
      description: "Real-time market insights, technical indicators, and AI-powered trading signals to make informed decisions.",
      gradient: "from-primary to-primary-light"
    },
    {
      icon: Shield,
      title: "Bank-Grade Security",
      description: "Your funds and data are protected with 256-bit encryption, two-factor authentication, and regulatory compliance.",
      gradient: "from-accent to-accent-light"
    },
    {
      icon: Smartphone,
      title: "Mobile Trading",
      description: "Trade on the go with our responsive mobile platform. Never miss a market opportunity again.",
      gradient: "from-success to-success/80"
    },
    {
      icon: BarChart3,
      title: "Portfolio Management",
      description: "Comprehensive portfolio tracking with performance analytics, risk assessment, and automated rebalancing.",
      gradient: "from-primary to-accent"
    },
    {
      icon: Users,
      title: "Social Trading",
      description: "Follow successful traders, copy their strategies, and learn from the community of experienced investors.",
      gradient: "from-accent to-primary"
    },
    {
      icon: Zap,
      title: "Lightning Execution",
      description: "Ultra-low latency trading with instant order execution and real-time market data feeds.",
      gradient: "from-warning to-warning/80"
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Globe className="w-4 h-4 mr-2" />
            Why Choose TradePro
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 fintech-heading">
            Everything you need to
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              trade with confidence
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto fintech-body">
            Our comprehensive platform combines cutting-edge technology with user-friendly design 
            to deliver the ultimate trading experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="fintech-card group cursor-pointer border-0 bg-gradient-card hover:shadow-card-hover"
              >
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-card-foreground">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "$2.5B+", label: "Assets Under Management" },
            { value: "500K+", label: "Active Traders" },
            { value: "99.9%", label: "Uptime Guarantee" },
            { value: "24/7", label: "Customer Support" }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}