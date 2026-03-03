import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sl-slate-50 flex flex-col">
      <header className="bg-white border-b border-sl-slate-100 py-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="flex gap-0.5">
            <div className="w-3.5 h-3.5 bg-sl-green-600 rounded-sm" />
            <div className="w-3.5 h-3.5 bg-sl-gold-400 rounded-sm opacity-70" />
          </div>
          <span className="font-bold text-sl-slate-900 text-sm">
            SureLeads{' '}
            <span className="font-normal text-sl-slate-400">Listings</span>
          </span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center py-10 px-4">
        {children}
      </main>
    </div>
  );
}
