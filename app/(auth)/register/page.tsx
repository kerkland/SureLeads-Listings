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

      // Store access token
      localStorage.setItem('accessToken', data.data.accessToken);

      // Send OTP for verification
      await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone }),
      });

      router.push(`/verify?phone=${encodeURIComponent(form.phone)}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h1>
        <p className="text-gray-500 text-sm mb-6">Join Prop — Nigeria&apos;s trusted property platform</p>

        {/* Role toggle */}
        <div className="flex rounded-lg border border-gray-200 p-1 mb-6 bg-gray-50">
          {(['CLIENT', 'AGENT'] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                role === r
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-gray-600 hover:text-brand'
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
            <label className="label">Email Address</label>
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
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-brand font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
