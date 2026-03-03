'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Role = 'CLIENT' | 'AGENT';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('CLIENT');
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(typeof data.error === 'string' ? data.error : 'Registration failed');
        return;
      }

      localStorage.setItem('accessToken', data.data.accessToken);

      await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone }),
      });

      const next = role === 'AGENT' ? '/onboarding/agent' : '/listings';
      router.push(
        `/verify?phone=${encodeURIComponent(form.phone)}&next=${encodeURIComponent(next)}`,
      );
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-sl-slate-900 mb-1">Create your account</h1>
        <p className="text-sl-slate-500 text-sm mb-6">
          Join SureLeads — Lagos&apos;s trusted property platform
        </p>

        {/* Role toggle */}
        <div className="flex rounded-xl border border-sl-slate-200 p-1 mb-6 bg-sl-slate-50">
          {(['CLIENT', 'AGENT'] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                role === r
                  ? 'bg-sl-green-600 text-white shadow-sm'
                  : 'text-sl-slate-600 hover:text-sl-slate-900'
              }`}
            >
              {r === 'CLIENT' ? '🏠 Find Property' : '🏢 List Property'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              className="input"
              placeholder="Chukwuemeka Obi"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Phone Number</label>
            <input
              type="tel"
              className="input"
              placeholder="+2348012345678"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">
              Email Address{' '}
              <span className="text-sl-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="email"
              className="input"
              placeholder="chukwuemeka@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <input
              type="password"
              className="input"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm
                            px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button type="submit" className="btn-md btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-sl-slate-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-sl-green-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
