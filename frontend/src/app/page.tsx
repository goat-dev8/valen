import { Navbar } from '@/components/marketing/navbar';
import { HeroSection } from '@/components/marketing/hero-section';
import { PartnersSection } from '@/components/marketing/partners-section';
import { SolutionSection } from '@/components/marketing/solution-section';
import { ModulesSection } from '@/components/marketing/modules-section';
import { PermissionLayerSection } from '@/components/marketing/permission-layer-section';
import { JourneySection } from '@/components/marketing/journey-section';
import { FeaturesSection } from '@/components/marketing/features-section';
import { CaseStudiesSection } from '@/components/marketing/case-studies-section';
import { IntegrationsSection } from '@/components/marketing/integrations-section';
import { AudienceSection } from '@/components/marketing/audience-section';
import { NotificationSection } from '@/components/marketing/notification-section';
import { FaqSection } from '@/components/marketing/faq-section';
import { CtaSection } from '@/components/marketing/cta-section';
import { LiveProofEmbed } from '@/components/marketing/live-proof-embed';
import { FooterSection } from '@/components/marketing/footer-section';

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <LiveProofEmbed />
      <PartnersSection />
      <SolutionSection />
      <ModulesSection />
      <PermissionLayerSection />
      <JourneySection />
      <FeaturesSection />
      <CaseStudiesSection />
      <IntegrationsSection />
      <AudienceSection />
      <NotificationSection />
      <FaqSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}
