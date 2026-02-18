import {
  Navbar,
  HeroSection,
  ProblemSolution,
  FeaturesSection,
  SocialProof,
  PricingSection,
  FAQ,
  FinalCTA,
  Footer,
} from '@/components/landing'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <ProblemSolution />
      <FeaturesSection />
      <SocialProof />
      <PricingSection />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}
