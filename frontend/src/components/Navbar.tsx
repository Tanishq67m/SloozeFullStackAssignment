'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ShieldCheck, ChevronDown, LogOut, Users, Navigation } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

const TEAM = [
  { email: 'nick.fury@shield.com',       name: 'Nick Fury',        role: 'ADMIN',   country: null,      emoji: '🕶️' },
  { email: 'captain.marvel@shield.com',  name: 'Captain Marvel',   role: 'MANAGER', country: 'INDIA',   emoji: '⭐' },
  { email: 'captain.america@shield.com', name: 'Captain America',  role: 'MANAGER', country: 'AMERICA', emoji: '🛡️' },
  { email: 'thanos@shield.com',          name: 'Thanos',           role: 'MEMBER',  country: 'INDIA',   emoji: '💜' },
  { email: 'thor@shield.com',            name: 'Thor',             role: 'MEMBER',  country: 'INDIA',   emoji: '⚡' },
  { email: 'travis@shield.com',          name: 'Travis',           role: 'MEMBER',  country: 'AMERICA', emoji: '🇺🇸' },
];

const roleBadgeColor: Record<string, string> = {
  ADMIN:   'bg-ironman-red/20 border border-ironman-red text-ironman-red shadow-[0_0_8px_rgba(185,28,28,0.3)]',
  MANAGER: 'bg-cap-blue/20 border border-cap-blue text-cap-blue shadow-[0_0_8px_rgba(29,78,216,0.3)]',
  MEMBER:  'bg-slate-700/50 border border-slate-600 text-slate-300',
};

export function Navbar() {
  const { user, switchUser, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleSwitch = async (email: string) => {
    setSwitching(true);
    setOpen(false);
    await switchUser(email);
    setSwitching(false);
    window.location.href = '/restaurants';
  };

  if (!user) return null;

  const current = TEAM.find((t) => t.email === user.email);

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-shield-obsidian border border-slate-700 shadow-[0_0_10px_rgba(4,10,21,0.5)]">
          <ShieldCheck className="text-white drop-shadow-md" size={24} />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-white text-lg tracking-widest uppercase flex items-center gap-2">
            S.H.I.E.L.D 
            <span className="w-1.5 h-1.5 rounded-full bg-stark-neon animate-pulse shadow-[0_0_5px_rgba(6,182,212,0.8)]" />
          </span>
          <span className="text-[10px] text-stark-neon tracking-wider">COMMAND CENTER</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
         <button onClick={() => router.push('/restaurants')} className={`text-sm font-semibold tracking-wider transition-colors ${pathname.includes('restaurants') ? 'text-stark-neon text-shadow-glow' : 'text-slate-400 hover:text-slate-200'}`}>RESTAURANTS</button>
         <button onClick={() => router.push('/orders')} className={`text-sm font-semibold tracking-wider transition-colors ${pathname.includes('orders') ? 'text-stark-neon text-shadow-glow' : 'text-slate-400 hover:text-slate-200'}`}>INTEL (ORDERS)</button>
         <button onClick={() => router.push('/payments')} className={`text-sm font-semibold tracking-wider transition-colors ${pathname.includes('payments') ? 'text-stark-neon text-shadow-glow' : 'text-slate-400 hover:text-slate-200'}`}>CLEARANCE (PAY)</button>
      </div>

      <div className="flex items-center gap-6">
        {/* Current user badge */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex flex-col items-end">
            <span className="font-bold text-white tracking-wide">{user.name}</span>
            <div className="flex gap-1.5 mt-0.5">
              <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${roleBadgeColor[user.role]}`}>
                {user.role}
              </span>
              {user.country ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded border border-orange-500/50 bg-orange-500/10 text-orange-400 font-bold uppercase tracking-wider">
                  {user.country}
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 rounded border border-hulk-green/50 bg-hulk-green/10 text-green-400 font-bold uppercase tracking-wider">
                  GLOBAL
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shadow-inner">
            {current?.emoji}
          </div>
        </div>

        {/* Identity switcher */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            disabled={switching}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold tracking-wider uppercase border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors text-slate-300"
          >
            <Users size={14} className="text-stark-neon" />
            <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-shield-obsidian border border-slate-700 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] overflow-hidden z-50">
              <div className="px-4 py-2 bg-slate-900 border-b border-slate-800">
                <p className="text-[10px] font-bold text-stark-neon uppercase tracking-widest flex items-center gap-1">
                  <Navigation size={10} /> Active Operatives
                </p>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {TEAM.map((member) => (
                  <button
                    key={member.email}
                    onClick={() => handleSwitch(member.email)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left border-b border-slate-800/50 last:border-0
                      ${user.email === member.email ? 'bg-slate-800 border-l-2 border-l-stark-neon' : ''}`}
                  >
                    <span className="text-xl drop-shadow-md">{member.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-200">{member.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{member.email}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-800 px-4 py-2 bg-slate-900">
                <button onClick={logout} className="w-full flex items-center gap-2 text-xs font-bold tracking-wider text-ironman-red hover:text-red-400 py-1.5 transition-colors uppercase">
                  <LogOut size={14} /> Terminate Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
