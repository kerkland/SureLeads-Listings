import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link href="/listings" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">P</span>
          </div>
          <span className="font-bold text-brand">Prop</span>
        </Link>
        <Link href="/listings" className="text-sm text-gray-500 hover:text-brand">
          Browse Properties →
        </Link>
      </header>
      <main>{children}</main>
    </div>
  );
}
