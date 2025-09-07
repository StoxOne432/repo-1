import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export function FinTechHero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-primary rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-accent rounded-full filter blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-6">
            <Shield className="w-4 h-4 mr-2" />
            Bank-grade security & regulation
          </div>
          
          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 fintech-heading">
            Trade Smarter,
            <br />
            <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Invest Better
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/80 mb-8 fintech-body max-w-2xl mx-auto">
            Experience the future of trading with real-time market data, 
            advanced analytics, and seamless portfolio management.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/auth">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                Start Trading Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button 
                size="lg" 
                variant="secondary"
                className="font-semibold px-8 py-4 rounded-xl"
              >
                View Demo
              </Button>
            </Link>
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <TrendingUp className="w-6 h-6 text-accent mr-3" />
              <span className="text-white font-medium">Real-time Analytics</span>
            </div>
            <div className="flex items-center justify-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <Shield className="w-6 h-6 text-accent mr-3" />
              <span className="text-white font-medium">Secure Platform</span>
            </div>
            <div className="flex items-center justify-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <Zap className="w-6 h-6 text-accent mr-3" />
              <span className="text-white font-medium">Lightning Fast</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" fill="none" className="w-full h-auto">
          <path
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1200,160,1248,128,1296,112L1344,96L1344,200L1296,200C1248,200,1152,200,1056,200C960,200,864,200,768,200C672,200,576,200,480,200C384,200,288,200,192,200C96,200,48,200,24,200L0,200Z"
            fill="white"
          />
        </svg>
      </div>
    </div>
  );
}