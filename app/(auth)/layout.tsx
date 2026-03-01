import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 py-4 px-6">
        <Link href="/listings" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-xl font-bold text-brand">Prop</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        {children}
      </main>
    </div>
  );
}
