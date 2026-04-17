'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { gql, useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { CreditCard, Plus, Star, Trash2, Lock, ShieldAlert } from 'lucide-react';

const GET_PAYMENT_METHODS = gql`query { myPaymentMethods { id type last4 provider isDefault } }`;
const ADD_PAYMENT_METHOD = gql`
  mutation AddPM($type: String!, $last4: String!, $provider: String!, $isDefault: Boolean!) {
    addPaymentMethod(type: $type, last4: $last4, provider: $provider, isDefault: $isDefault) { id }
  }
`;
const REMOVE_PAYMENT_METHOD = gql`mutation RemovePM($id: String!) { removePaymentMethod(id: $id) { id } }`;
const SET_DEFAULT = gql`mutation SetDefault($id: String!) { setDefaultPaymentMethod(id: $id) { id isDefault } }`;

export default function PaymentsPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => { if (!token) router.push('/'); }, [token]);

  const { data, refetch } = useQuery(GET_PAYMENT_METHODS, { skip: !token });
  const [addPM] = useMutation(ADD_PAYMENT_METHOD, { onCompleted: () => { toast.success('AUTHORIZATION LOGGED'); refetch(); }, onError: (e) => toast.error(e.message) });
  const [removePM] = useMutation(REMOVE_PAYMENT_METHOD, { onCompleted: () => { toast.success('CREDENTIAL REVOKED'); refetch(); }, onError: (e) => toast.error(e.message) });
  const [setDefault] = useMutation(SET_DEFAULT, { onCompleted: () => { toast.success('PRIMARY OVERRIDE SUCCESSFUL'); refetch(); }, onError: (e) => toast.error(e.message) });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'CREDIT_CARD', last4: '', provider: '', isDefault: false });

  if (!user) return null;

  // Non-admins see a locked page
  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-cosmic-glow flex flex-col text-slate-200">
        <Navbar />
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <div className="w-20 h-20 bg-ironman-red/10 border-2 border-ironman-red rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(185,28,28,0.3)]">
            <ShieldAlert size={34} className="text-ironman-red drop-shadow-[0_0_8px_rgba(185,28,28,0.8)]" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2 uppercase tracking-widest text-ironman-red">Access Denied</h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-6">Security Clearance Level Inadequate. Admins Only.</p>
          <div className="inline-block bg-slate-900 border border-slate-700 rounded-lg py-3 px-6 shadow-inner">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
              Current Rank: <span className="text-stark-neon">{user.role}</span> // Region: <span className="text-stark-neon">{user.country ?? 'Global'}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const methods = data?.myPaymentMethods ?? [];

  return (
    <div className="min-h-screen bg-cosmic-glow text-slate-200">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-700/50">
          <h1 className="text-2xl font-extrabold text-white tracking-widest uppercase flex items-center gap-3">
            <CreditCard className="text-stark-neon" size={24} /> Clearance Vault
          </h1>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 stark-button px-5 py-2.5 rounded-lg text-xs">
            <Plus size={16} strokeWidth={3} /> Inject Code
          </button>
        </div>

        {showForm && (
          <div className="glass-panel rounded-xl p-6 mb-8 border-stark-neon/30 animate-in fade-in slide-in-from-top-4 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <h3 className="font-black text-stark-neon uppercase tracking-widest text-xs mb-5">Override Authorization Form</h3>
            <div className="space-y-4">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-stark-neon transition-colors font-semibold uppercase tracking-wider">
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="UPI">UPI</option>
                <option value="PAYPAL">PayPal</option>
              </select>
              <input placeholder="Provider Entity (e.g. Stark Industries, Visa)" value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-stark-neon transition-colors" />
              <input placeholder="Termination Digits (Last 4) or ID" value={form.last4}
                onChange={(e) => setForm({ ...form, last4: e.target.value })}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-stark-neon transition-colors" />
              <label className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer mt-2 pl-1">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="accent-stark-neon w-4 h-4" />
                <span className={form.isDefault ? 'text-stark-neon' : ''}>Designate as Primary Override</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button onClick={() => addPM({ variables: form })}
                  className="flex-1 py-3 bg-stark-neon hover:bg-cyan-400 text-slate-900 font-extrabold uppercase tracking-widest rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_20px_rgba(6,182,212,0.7)] group">
                  Compile
                </button>
                <button onClick={() => setShowForm(false)}
                  className="flex-1 py-3 border border-slate-600 hover:bg-slate-800 text-slate-300 font-bold uppercase tracking-widest rounded-lg text-sm transition-colors">
                  Abort
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {methods.length === 0 && !showForm && (
            <div className="text-center py-16 text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800 border-dashed">
              <CreditCard size={40} className="mx-auto mb-4 opacity-30" />
              <p className="font-bold tracking-widest uppercase text-sm">NO CAPITALS ALLOCATED</p>
            </div>
          )}
          {methods.map((pm: any) => (
            <div key={pm.id} className={`glass-panel rounded-xl p-5 flex items-center gap-5 transition-all
              ${pm.isDefault ? 'border-stark-neon/50 bg-stark-neon/5 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'border-slate-700 bg-slate-800/40'}`}>
              <div className={`p-3 rounded-lg border ${pm.isDefault ? 'bg-stark-neon/10 border-stark-neon/40 text-stark-neon' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                <CreditCard size={24} />
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-white tracking-wide text-lg">{pm.provider} <span className="opacity-50">••••</span> {pm.last4}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest mt-0.5 text-slate-400">
                  {pm.type} {pm.isDefault && <span className="text-stark-neon ml-2 drop-shadow-[0_0_3px_rgba(6,182,212,0.8)]">/// PRIMARY OVERRIDE</span>}
                </p>
              </div>
              <div className="flex gap-2">
                {!pm.isDefault && (
                  <button onClick={() => setDefault({ variables: { id: pm.id } })}
                    className="p-2.5 rounded border border-slate-600 bg-slate-800 hover:bg-stark-neon/20 hover:border-stark-neon text-slate-300 hover:text-stark-neon transition-all" title="Make Primary">
                    <Star size={16} strokeWidth={3} />
                  </button>
                )}
                <button onClick={() => removePM({ variables: { id: pm.id } })}
                  className="p-2.5 rounded border border-slate-600 bg-slate-800 hover:bg-ironman-red/20 hover:border-ironman-red text-slate-300 hover:text-ironman-red transition-all" title="Revoke">
                  <Trash2 size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
