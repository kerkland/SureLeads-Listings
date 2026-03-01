import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-bold text-white">Prop</span>
            </div>
            <p className="text-sm text-gray-400 max-w-xs">
              Nigeria&apos;s trusted real estate inspection platform. Book inspections safely with escrow protection.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/listings" className="hover:text-white transition-colors">Browse Properties</Link></li>
              <li><Link href="/register?role=AGENT" className="hover:text-white transition-colors">List a Property</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:hello@prop.ng" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-gray-500 text-center">
          © {new Date().getFullYear()} Prop Technologies Ltd. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
