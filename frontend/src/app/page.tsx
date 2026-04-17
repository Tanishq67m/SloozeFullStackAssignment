'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ShieldCheck } from 'lucide-react';

const QUICK_LOGINS = [
  { label: '🕶️ Nick Fury', email: 'nick.fury@shield.com',       role: 'Admin · Global',     theme: 'border-ironman-red hover:bg-ironman-red/10 group-hover:text-ironman-red' },
  { label: '⭐ Capt. Marvel', email: 'captain.marvel@shield.com', role: 'Manager · India',    theme: 'border-cap-blue hover:bg-cap-blue/10 group-hover:text-cap-blue' },
  { label: '🛡️ Capt. America', email: 'captain.america@shield.com', role: 'Manager · America', theme: 'border-cap-blue hover:bg-cap-blue/10 group-hover:text-cap-blue' },
  { label: '💜 Thanos',       email: 'thanos@shield.com',         role: 'Member · India',     theme: 'border-purple-500 hover:bg-purple-500/10 group-hover:text-purple-400' },
  { label: '⚡ Thor',         email: 'thor@shield.com',           role: 'Member · India',     theme: 'border-ironman-gold hover:bg-ironman-gold/10 group-hover:text-ironman-gold' },
  { label: '🇺🇸 Travis',       email: 'travis@shield.com',         role: 'Member · America',   theme: 'border-cap-vibranium hover:bg-cap-vibranium/10 group-hover:text-cap-vibranium' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent | null, quickEmail?: string) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(quickEmail ?? email, 'password123');
      router.push('/restaurants');
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cosmic-glow px-4 overflow-hidden relative">
      {/* Background ambient light */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-cap-blue/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-ironman-red/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="p-4 glass-panel rounded-2xl flex items-center justify-center ironman-border">
              <ShieldCheck className="text-white" size={40} />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-widest uppercase neon-text">S.H.I.E.L.D.</h1>
          <p className="text-stark-neon/70 mt-2 tracking-[0.2em] text-sm font-light">FOOD COMMAND CENTER</p>
        </div>

        {/* Quick login grid */}
        <div className="glass-panel rounded-2xl p-6 mb-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Select Operative</p>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_LOGINS.map((q) => (
              <button
                key={q.email}
                onClick={() => handleLogin(null, q.email)}
                disabled={loading}
                className={`text-left px-4 py-3 rounded-xl border border-slate-700/50 bg-slate-800/40 transition-all group ${q.theme} backdrop-blur-sm`}
              >
                <p className={`text-sm font-bold text-slate-200 transition-colors ${q.theme.split(' ')[2]}`}>{q.label}</p>
                <p className="text-[10px] text-slate-400 tracking-wider mt-1 uppercase">{q.role}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Manual form */}
        <div className="glass-panel rounded-2xl p-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Manual Override</p>
          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <input
              type="email"
              placeholder="Operative Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-stark-neon focus:ring-1 focus:ring-stark-neon transition-all"
            />
            <input
              type="password"
              placeholder="Passcode"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-stark-neon focus:ring-1 focus:ring-stark-neon transition-all"
            />
            {error && <p className="text-sm text-ironman-red font-semibold">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 stark-button rounded-xl mt-2"
            >
              {loading ? 'Authenticating...' : 'Engage'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
