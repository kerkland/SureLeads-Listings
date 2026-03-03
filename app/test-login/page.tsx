'use client';

import { useRouter } from 'next/navigation';

const TEST_ACCOUNTS = [
  {
    label: 'Agent — Chidi Okeke',
    desc: 'Okeke Properties · Lekki/VI specialist',
    color: 'btn-primary',
    user: {
      id: 'test-agent-001',
      role: 'AGENT',
      fullName: 'Chidi Okeke',
      email: 'chidi@okekeproperties.com',
    },
    redirect: '/dashboard',
  },
  {
    label: 'Agent — Amaka Eze',
    desc: 'Eze Homes · Ikeja/Gbagada specialist',
    color: 'btn-primary',
    user: {
      id: 'test-agent-002',
      role: 'AGENT',
      fullName: 'Amaka Eze',
      email: 'amaka@ezehomes.com',
    },
    redirect: '/dashboard',
  },
  {
    label: 'Client — Tunde',
    desc: 'Regular renter account',
    color: 'btn-secondary',
    user: {
      id: 'test-client-001',
      role: 'CLIENT',
      fullName: 'Tunde Adeyemi',
      email: 'tunde@gmail.com',
    },
    redirect: '/dashboard',
  },
];

export default function TestLoginPage() {
  const router = useRouter();

  function signIn(account: (typeof TEST_ACCOUNTS)[0]) {
    localStorage.setItem('user', JSON.stringify(account.user));
    // Fake access token so API calls send an Authorization header
    localStorage.setItem(
      'accessToken',
      'test-token-' + account.user.id,
    );
    router.push(account.redirect);
  }

  function signOut() {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-sl-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex gap-0.5 justify-center mb-4">
            <div className="w-4 h-4 bg-sl-green-600 rounded-sm" />
            <div className="w-4 h-4 bg-sl-gold-400 rounded-sm opacity-70" />
          </div>
          <h1 className="text-xl font-bold text-sl-slate-900">Test Login</h1>
          <p className="text-sm text-sl-slate-500 mt-1">
            Dev-only — sets mock credentials in localStorage
          </p>
        </div>

        {/* Accounts */}
        <div className="space-y-3">
          {TEST_ACCOUNTS.map((account) => (
            <button
              key={account.user.id}
              onClick={() => signIn(account)}
              className={`w-full text-left border rounded-xl px-5 py-4
                          hover:shadow-card transition-all ${
                account.color === 'btn-primary'
                  ? 'bg-sl-green-600 border-sl-green-600 text-white hover:bg-sl-green-700'
                  : 'bg-white border-sl-slate-200 text-sl-slate-900 hover:border-sl-slate-300'
              }`}
            >
              <p className="font-semibold text-sm">{account.label}</p>
              <p className={`text-xs mt-0.5 ${
                account.color === 'btn-primary' ? 'text-sl-green-100' : 'text-sl-slate-500'
              }`}>
                {account.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full mt-4 text-sm text-sl-slate-400 hover:text-sl-slate-600
                     transition-colors py-2"
        >
          Clear session
        </button>

        {/* Warning */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-semibold">Dev only.</span> API calls requiring a
            database will fail (no DATABASE_URL). UI and navigation work fully.
          </p>
        </div>
      </div>
    </div>
  );
}
