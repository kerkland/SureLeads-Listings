import Link from 'next/link';
import Logo from '@/components/ui/Logo';

const LINKS = {
  Platform: [
    { href: '/listings',            label: 'Browse listings' },
    { href: '/price-insights',      label: 'Market insights' },
    { href: '/register?role=AGENT', label: 'List a property' },
  ],
  Agents: [
    { href: '/register?role=AGENT',    label: 'Join as agent' },
    { href: '/dashboard',              label: 'Agent dashboard' },
    { href: '/dashboard/credibility',  label: 'Credibility score' },
    { href: '/dashboard/reconfirmations', label: 'Reconfirmations' },
  ],
  Company: [
    { href: '/about',                      label: 'About SureLeads' },
    { href: 'mailto:hello@sureleads.ng',   label: 'Contact us' },
    { href: '/terms',                      label: 'Terms of service' },
    { href: '/privacy',                    label: 'Privacy policy' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-sl-slate-200 bg-sl-slate-50 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">

          {/* Brand */}
          <div className="col-span-2">
            <Logo size="sm" className="mb-4" />
            <p className="text-sm text-sl-slate-500 leading-relaxed max-w-xs">
              Property infrastructure for Nigeria. Structured listings, verified agents,
              and data-driven market insights.
            </p>
            <p className="text-xs text-sl-slate-400 mt-4">
              All listings are reconfirmed weekly by the posting agent.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-xs font-semibold text-sl-slate-900 uppercase tracking-wide mb-3">
                {section}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-sl-slate-500 hover:text-sl-slate-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-sl-slate-200 pt-6 flex flex-col sm:flex-row
                        items-center justify-between gap-3">
          <p className="text-xs text-sl-slate-400">
            © {new Date().getFullYear()} SureLeads Technologies Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-sl-slate-400">
            <span className="w-1.5 h-1.5 bg-sl-green-500 rounded-full animate-pulse-slow" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
