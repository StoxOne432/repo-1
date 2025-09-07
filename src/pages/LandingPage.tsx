import { FinTechHero } from "@/components/FinTechHero";
import { FinTechFeatures } from "@/components/FinTechFeatures";
import { MobileNavigation } from "@/components/MobileNavigation";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <FinTechHero />
      <FinTechFeatures />
      <MobileNavigation />
    </div>
  );
}