import { Navbar } from '@/components/marketing/navbar';
import { HeroSection } from '@/components/marketing/hero-section';
import { PartnersSection } from '@/components/marketing/partners-section';
import { SolutionSection } from '@/components/marketing/solution-section';
import { FeaturesSection } from '@/components/marketing/features-section';
import { CaseStudiesSection } from '@/components/marketing/case-studies-section';
import { StepsSection } from '@/components/marketing/steps-section';
import { NotificationSection } from '@/components/marketing/notification-section';
import { PermissionLayerSection } from '@/components/marketing/permission-layer-section';
import { IntegrationsSection } from '@/components/marketing/integrations-section';
import { PricingSection } from '@/components/marketing/pricing-section';
import { FaqSection } from '@/components/marketing/faq-section';
import { CtaSection } from '@/components/marketing/cta-section';
import { FooterSection } from '@/components/marketing/footer-section';

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <PartnersSection />
      <SolutionSection />
      <FeaturesSection />
      <CaseStudiesSection />
      <StepsSection />
      <NotificationSection />
      <PermissionLayerSection />
      <IntegrationsSection />
      <PricingSection />
      <FaqSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}
