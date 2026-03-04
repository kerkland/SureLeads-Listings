/* Auth layout — minimal shell, each page manages its own full-screen layout */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-sl-slate-50">{children}</div>;
}
