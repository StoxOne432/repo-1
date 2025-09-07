import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Shield, Zap, BarChart3, ArrowUpRight } from "lucide-react";

interface HeroProps {
  onGetStarted?: () => void;
  onLearnMore?: () => void;
}

export function Hero({ onGetStarted, onLearnMore }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-success/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Trade Smarter,
              <span className="block bg-gradient-primary bg-clip-text text-transparent">
                Invest Better
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Professional trading platform with real-time market data, advanced analytics, 
              and seamless portfolio management for modern investors.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              variant="trading"
              onClick={onGetStarted}
              className="text-lg px-8 py-6 glow-primary"
            >
              Start Trading Now
              <ArrowUpRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onLearnMore}
              className="text-lg px-8 py-6"
            >
              Watch Demo
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-primary">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-primary rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Real-Time Trading</h3>
                <p className="text-muted-foreground">
                  Execute trades instantly with real-time market data and advanced order types.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-success/20 hover:border-success/40 transition-all duration-300 hover:shadow-success">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-success rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-success-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure & Regulated</h3>
                <p className="text-muted-foreground">
                  Bank-grade security with full regulatory compliance and insurance protection.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-warning/20 hover:border-warning/40 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-br from-warning to-warning/80 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-warning-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
                <p className="text-muted-foreground">
                  Professional-grade charts, technical indicators, and market analysis tools.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 border-t border-border/50">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">2M+</div>
              <div className="text-sm text-muted-foreground">Active Traders</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-success">₹15T+</div>
              <div className="text-sm text-muted-foreground">Volume Traded</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-warning">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-destructive">0.05%</div>
              <div className="text-sm text-muted-foreground">Trading Fees</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}