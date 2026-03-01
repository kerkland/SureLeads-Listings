import { redirect } from 'next/navigation';

export default function AdminDashboardPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard — SureLeads</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/admin/video-walkthroughs', label: 'Video Reviews', icon: '🎥' },
          { href: '/admin/complaints', label: 'Complaints', icon: '⚠️' },
          { href: '/admin/agents', label: 'Agents', icon: '👤' },
          { href: '/admin/listings', label: 'Listings', icon: '🏠' },
          { href: '/admin/audit-log', label: 'Audit Log', icon: '📋' },
        ].map((item) => (
          <a key={item.href} href={item.href}
            className="rounded-xl border bg-white p-6 hover:shadow-md transition text-center">
            <div className="text-3xl mb-2">{item.icon}</div>
            <div className="font-semibold text-gray-800 text-sm">{item.label}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
