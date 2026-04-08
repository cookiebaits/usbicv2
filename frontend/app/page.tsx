"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  Shield,
  Smartphone,
  Zap,
  ChevronDown,
  ChevronUp,
  Lock,
  HeadphonesIcon,
  BadgeCheck,
  ShieldCheck,
  Clock,
  Award,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogo } from "@/app/logoContext";
import { fetchColors } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  checkItems: string[];
}

interface FaqItemProps {
  question: string;
  answer: string;
}

interface TrustBadgeProps {
  icon: LucideIcon;
  text: string;
}

function FeatureCard({ icon: Icon, title, description, checkItems }: FeatureCardProps) {
  return (
    <div data-testid={`feature-card-${title.toLowerCase().replace(/\s+/g, '-')}`} className="flex flex-col h-full p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-300 group">
      <div className="p-3 bg-slate-100 rounded-xl w-12 h-12 flex items-center justify-center mb-5">
        <Icon className="h-6 w-6 text-slate-700" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm flex-grow leading-relaxed">{description}</p>
      <ul className="mt-5 space-y-2.5">
        {checkItems.map((item, index) => (
          <li key={index} className="flex items-center text-slate-600">
            <CheckCircle className="h-4 w-4 text-emerald-500 mr-2.5 flex-shrink-0" />
            <span className="text-sm">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FaqItem({ question, answer }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div data-testid={`faq-item`} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-slate-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-slate-900 pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />
        )}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-5 pb-5">
          <p className="text-slate-500 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}

function TrustBadge({ icon: Icon, text }: TrustBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-emerald-600" />
      <span className="text-sm font-medium text-slate-600">{text}</span>
    </div>
  );
}

export default function Home() {
  const [settings, setSettings] = useState<any>(null);
  const { logoUrl } = useLogo();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/home");
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchColors();
  }, []);

  return (
    <div data-testid="landing-page" className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center">
            {settings?.logoUrl && (
              <img
                src={settings.logoUrl}
                alt="Site Logo"
                data-testid="header-logo"
                style={{
                  width: settings.logoWidth > 0 ? `${settings.logoWidth}px` : 'auto',
                  height: settings.logoHeight > 0 ? `${settings.logoHeight}px` : '28px',
                }}
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full font-medium"
              asChild
              data-testid="header-signin-btn"
            >
              <Link href="/login">Log In</Link>
            </Button>
            <Button
              className="bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white rounded-full font-medium px-6 shadow-none"
              asChild
              data-testid="header-register-btn"
            >
              <Link href="/register">Open Account</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section data-testid="hero-section" className="w-full py-16 md:py-24 lg:py-32 bg-slate-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-8">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-slate-900 leading-[1.1]">
                  Banking that works{" "}
                  <span className="text-[var(--primary-600)]">for you</span>
                </h1>
                <p className="text-lg text-slate-500 max-w-[520px] leading-relaxed">
                  No hidden fees. No minimum balance. Get paid up to two days early with free direct deposit.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    className="bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white rounded-full font-semibold px-8 shadow-none h-12"
                    asChild
                    data-testid="hero-cta-btn"
                  >
                    <Link href="/register">
                      Open Your Account <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full font-semibold px-8 border-slate-300 text-slate-700 hover:bg-slate-100 shadow-none h-12"
                    asChild
                    data-testid="hero-signin-btn"
                  >
                    <Link href="/login">Log In</Link>
                  </Button>
                </div>
              </div>
              <div className="relative mx-auto max-w-[480px] lg:max-w-none">
                <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-200">
                  <img
                    src="https://images.unsplash.com/photo-1769569893962-82621a7c7ff0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjB1c2luZyUyMHBob25lJTIwY29mZmVlJTIwc2hvcHxlbnwwfHx8fDE3NzU2Mjc3ODN8MA&ixlib=rb-4.1.0&q=85&w=800"
                    alt="Person using mobile banking"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <section data-testid="stats-section" className="w-full py-8 bg-white border-b border-slate-100">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold text-slate-900">Zelle</div>
                <div className="text-sm text-slate-500">Instant Transfers</div>
              </div>
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold text-slate-900">$0</div>
                <div className="text-sm text-slate-500">Monthly Fees</div>
              </div>
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold text-slate-900">2 Days</div>
                <div className="text-sm text-slate-500">Early Direct Deposit</div>
              </div>
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold text-emerald-600">AES-256</div>
                <div className="text-sm text-slate-500">Encryption Standard</div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section data-testid="trust-section" className="w-full py-6 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
              <TrustBadge icon={ShieldCheck} text="Bank-Level Security" />
              <TrustBadge icon={Lock} text="End-to-End Encryption" />
              <TrustBadge icon={BadgeCheck} text="FDIC Insured" />
              <TrustBadge icon={Clock} text="24/7 Monitoring" />
              <TrustBadge icon={Award} text="Award-Winning" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section data-testid="features-section" className="w-full py-16 md:py-24 bg-slate-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Everything you need in a bank</h2>
              <p className="mt-3 text-slate-500 max-w-lg mx-auto">Modern banking features designed to put you in control of your money.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={Shield}
                title="Secure Banking"
                description="Advanced security with two-factor authentication keeps your money safe at all times."
                checkItems={["End-to-end encryption", "Two-factor authentication", "Real-time fraud alerts"]}
              />
              <FeatureCard
                icon={Zap}
                title="Instant Transfers"
                description="Send money instantly to anyone with just a few taps. No waiting, no hidden fees."
                checkItems={["Real-time transfers", "No hidden fees", "Zelle enabled"]}
              />
              <FeatureCard
                icon={Smartphone}
                title="Simple & Intuitive"
                description="A clean interface that makes managing your finances straightforward and stress-free."
                checkItems={["Easy navigation", "5-day support", "2 min avg response"]}
              />
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section data-testid="security-section" className="w-full py-16 md:py-24 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-6">
                <span className="inline-block text-xs tracking-[0.1em] uppercase font-semibold text-[var(--primary-600)] bg-[var(--primary-50)] px-3 py-1.5 rounded-full">Security</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Your security is our top priority</h2>
                <p className="text-slate-500 leading-relaxed">We employ multiple layers of security to ensure your financial information and transactions remain protected.</p>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 rounded-xl flex-shrink-0"><Lock className="h-5 w-5 text-slate-700" /></div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Advanced Encryption</h3>
                      <p className="text-sm text-slate-500 mt-0.5">256-bit encryption protects all sensitive data and communications.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 rounded-xl flex-shrink-0"><ShieldCheck className="h-5 w-5 text-slate-700" /></div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Fraud Monitoring</h3>
                      <p className="text-sm text-slate-500 mt-0.5">Real-time monitoring detects and prevents suspicious activities instantly.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 rounded-xl flex-shrink-0"><BadgeCheck className="h-5 w-5 text-slate-700" /></div>
                    <div>
                      <h3 className="font-semibold text-slate-900">FDIC Insured</h3>
                      <p className="text-sm text-slate-500 mt-0.5">Your deposits are protected up to the maximum allowed by law.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100">
                <img src="/security-protection.jpg" alt="Security" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* Transparency Section */}
        <section data-testid="transparency-section" className="w-full py-16 md:py-24 bg-slate-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 order-2 lg:order-1">
                <img src="/transparency.jpg" alt="Transparent banking" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-6 order-1 lg:order-2">
                <span className="inline-block text-xs tracking-[0.1em] uppercase font-semibold text-[var(--primary-600)] bg-[var(--primary-50)] px-3 py-1.5 rounded-full">Transparency</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">No hidden fees, no surprises</h2>
                <p className="text-slate-500 leading-relaxed">All our fees and rates are clearly displayed. We believe in complete transparency with every transaction.</p>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 rounded-xl flex-shrink-0"><CheckCircle className="h-5 w-5 text-emerald-600" /></div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Clear Fee Structure</h3>
                      <p className="text-sm text-slate-500 mt-0.5">All fees displayed before you confirm any transaction.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 rounded-xl flex-shrink-0"><CheckCircle className="h-5 w-5 text-emerald-600" /></div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Real-Time Notifications</h3>
                      <p className="text-sm text-slate-500 mt-0.5">Instant alerts for all account activities and transactions.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 rounded-xl flex-shrink-0"><CheckCircle className="h-5 w-5 text-emerald-600" /></div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Detailed Statements</h3>
                      <p className="text-sm text-slate-500 mt-0.5">Comprehensive monthly statements with all transaction details.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section data-testid="support-section" className="w-full py-16 md:py-24 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-6">
                <span className="inline-block text-xs tracking-[0.1em] uppercase font-semibold text-[var(--primary-600)] bg-[var(--primary-50)] px-3 py-1.5 rounded-full">Support</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Customer support, 5 days a week</h2>
                <p className="text-slate-500 leading-relaxed">Our dedicated support team is available to help with any questions or concerns you may have.</p>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 rounded-xl flex-shrink-0"><HeadphonesIcon className="h-5 w-5 text-slate-700" /></div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Live Support</h3>
                      <p className="text-sm text-slate-500 mt-0.5">Connect with a support agent instantly through bot-free phone lines.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 rounded-xl flex-shrink-0"><Zap className="h-5 w-5 text-slate-700" /></div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Quick Response</h3>
                      <p className="text-sm text-slate-500 mt-0.5">Average response time under 2 minutes.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100">
                <img src="/customer-support.jpg" alt="Customer support" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section data-testid="faq-section" className="w-full py-16 md:py-24 bg-slate-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Frequently asked questions</h2>
              <p className="mt-3 text-slate-500 max-w-lg mx-auto">Find answers to common questions about our banking services.</p>
            </div>
            <div className="max-w-2xl mx-auto space-y-3">
              <FaqItem question="How do I open a new account?" answer="Opening a new account is simple. Click 'Open Account', fill out the required information, and follow the verification process. Once approved, you can immediately access your new account." />
              <FaqItem question="Is my money safe?" answer="Absolutely. We use industry-leading security measures including end-to-end encryption, two-factor authentication, and continuous monitoring. Deposits are insured up to the maximum allowed by law." />
              <FaqItem question="How quickly can I transfer money?" answer="Transfers between accounts happen instantly. Transfers to external accounts typically process within 1-2 business days, depending on the receiving bank." />
              <FaqItem question="Are there any fees?" answer="Basic accounts have no monthly fees. Certain premium services and international transfers may have nominal fees. View our complete fee schedule for details." />
              <FaqItem question="How do I access my crypto wallet?" answer="After logging in, navigate to the Accounts section and select the Crypto tab. From there you can view holdings, buy, sell, or transfer cryptocurrencies." />
              <FaqItem question="What if I forget my password?" answer="Click 'Forgot Password' on the login page. We'll send a secure reset link to your registered email address." />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section data-testid="cta-section" className="w-full py-16 md:py-24 bg-slate-900">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Ready to get started?</h2>
              <p className="text-slate-400 text-lg">Join thousands who have switched to smarter, fee-free banking.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-slate-100 rounded-full font-semibold px-8 shadow-none h-12"
                  asChild
                  data-testid="cta-register-btn"
                >
                  <Link href="/register">
                    Open Your Account <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full font-semibold px-8 border-slate-600 text-white hover:bg-slate-800 shadow-none h-12"
                  asChild
                  data-testid="cta-signin-btn"
                >
                  <Link href="/login">Log In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-white py-8">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-4">
              {logoUrl && (
                <img src={logoUrl} alt="Site Logo" className="h-7 w-auto opacity-80" loading="lazy" />
              )}
              <Link href="/admin/login" className="text-slate-400 text-sm hover:text-slate-300 transition-colors">
                &copy; {new Date().getFullYear()} All rights reserved.
              </Link>
            </div>
            <div className="flex space-x-5">
              {settings?.facebookUrl && (
                <Link href={settings.facebookUrl} className="text-slate-400 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                </Link>
              )}
              {settings?.twitterUrl && (
                <Link href={settings.twitterUrl} className="text-slate-400 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
                </Link>
              )}
              {settings?.instagramUrl && (
                <Link href={settings.instagramUrl} className="text-slate-400 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
