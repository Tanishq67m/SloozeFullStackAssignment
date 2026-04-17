'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { ManagerAndAbove } from '@/components/AccessGate';
import { ShoppingBag, CreditCard, Lock, Cpu, Rocket } from 'lucide-react';
import { toast } from 'sonner';

const GQL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql';

async function gqlFetch(query: string, variables: any, token: string) {
  const res = await fetch(GQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables }),
  });
  const { data, errors } = await res.json();
  if (errors) throw new Error(errors[0].message);
  return data;
}

export default function CheckoutPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPM, setSelectedPM] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!token) { router.push('/'); return; }
    const saved = sessionStorage.getItem('slooze_cart');
    if (!saved) { router.push('/restaurants'); return; }
    setCart(JSON.parse(saved));

    gqlFetch(`query { myPaymentMethods { id type last4 provider isDefault } }`, {}, token)
      .then((d) => {
        setPaymentMethods(d.myPaymentMethods);
        const def = d.myPaymentMethods.find((p: any) => p.isDefault);
        if (def) setSelectedPM(def.id);
      })
      .catch((e) => toast.error(e.message));
  }, [token]);

  const total = cart.reduce((s: number, c: any) => s + c.price * c.quantity, 0);
  const restaurantId = cart[0]?.restaurantId;

  const createAndPlace = async () => {
    if (!selectedPM && user?.role !== 'MEMBER') { toast.error('Select a payment method authorization'); return; }
    if (!user) return;
    setLoading(true);
    try {
      // Step 1: Create the order
      const items = cart.map((c: any) => ({ menuItemId: c.id, quantity: c.quantity }));
      const { createOrder } = await gqlFetch(
        `mutation CreateOrder($restaurantId: String!, $items: [OrderItemInput!]!, $notes: String) {
          createOrder(restaurantId: $restaurantId, items: $items, notes: $notes) { id }
        }`,
        { restaurantId, items, notes },
        token!,
      );

      // Step 2: Place the order (checkout) — only if ADMIN or MANAGER
      if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        await gqlFetch(
          `mutation PlaceOrder($orderId: String!, $paymentMethodId: String!) {
            placeOrder(orderId: $orderId, paymentMethodId: $paymentMethodId) { id status }
          }`,
          { orderId: createOrder.id, paymentMethodId: selectedPM },
          token!,
        );
        toast.success('SUPPLY REQUEST SECURED & FUNDED');
      } else {
        toast.success('SUPPLY REQUEST LOGGED. AWAITING MANAGER AUTHORIZATION.');
      }

      sessionStorage.removeItem('slooze_cart');
      router.push('/orders');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-cosmic-glow text-slate-200">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-extrabold text-white tracking-widest uppercase mb-8 flex items-center gap-3">
          <Cpu className="text-stark-neon" size={28} />
          Finalize Manifest
        </h1>

        {/* Order summary */}
        <div className="glass-panel p-6 mb-6">
          <div className="flex items-center gap-3 mb-6 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
            <ShoppingBag size={20} className="text-stark-neon animate-pulse" />
            <h2 className="font-extrabold tracking-widest uppercase text-white">Supply Details</h2>
            {cart[0] && <span className="text-xs font-bold text-stark-neon ml-auto uppercase border border-stark-neon px-2 py-1 bg-stark-neon/10 rounded">Source: {cart[0].restaurantName}</span>}
          </div>
          <div className="space-y-3">
            {cart.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center text-sm bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 hover:border-slate-500 transition-colors">
                <span className="font-bold text-slate-200 tracking-wide">{item.name} <span className="text-stark-neon border border-stark-neon/30 px-1.5 py-0.5 rounded ml-2 text-xs">× {item.quantity}</span></span>
                <span className="font-black text-ironman-gold text-base drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]">
                  {item.price > 100 ? `₹${(item.price * item.quantity).toFixed(0)}` : `$${(item.price * item.quantity).toFixed(2)}`}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-700 mt-5 pt-5 flex justify-between items-center font-black">
            <span className="tracking-widest uppercase text-slate-400">Total Authorization</span>
            <span className="text-xl text-stark-neon drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">{total > 100 ? `₹${total.toFixed(0)}` : `$${total.toFixed(2)}`}</span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Log special operational instructions..."
            className="mt-6 w-full text-sm bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 resize-none text-white focus:outline-none focus:border-stark-neon focus:ring-1 focus:ring-stark-neon transition-all"
            rows={3}
          />
        </div>

        {/* Payment method - only ADMIN/MANAGER can pay */}
        <ManagerAndAbove>
          <div className="glass-panel p-6 mb-8">
            <div className="flex items-center gap-3 mb-6 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
              <CreditCard size={20} className="text-iconman-red text-ironman-red" />
              <h2 className="font-extrabold tracking-widest uppercase text-white">Stark Clearance (Wallet)</h2>
            </div>
            <div className="space-y-3">
              {paymentMethods.map((pm: any) => (
                <label key={pm.id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
                  ${selectedPM === pm.id ? 'border-stark-neon bg-stark-neon/10 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/60'}`}>
                  <input type="radio" name="pm" value={pm.id} checked={selectedPM === pm.id}
                    onChange={() => setSelectedPM(pm.id)} className="accent-stark-neon w-4 h-4" />
                  <div>
                    <p className="text-sm font-bold text-white tracking-wide">{pm.provider} •••• {pm.last4}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">{pm.type}{pm.isDefault ? ' // DEFAULT' : ''}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </ManagerAndAbove>

        {/* MEMBER sees a notice */}
        {user.role === 'MEMBER' && (
          <div className="bg-ironman-gold/10 border border-ironman-gold rounded-xl p-5 mb-8 flex items-start gap-4 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Lock size={20} className="text-ironman-gold mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-extrabold text-ironman-gold uppercase tracking-wider">Level 3 Clearance Required</p>
              <p className="text-xs text-ironman-gold/80 mt-1 font-semibold">Your manifest will be logged centrally. Await Level 4 (Manager) authorization and funding transfer.</p>
            </div>
          </div>
        )}

        <button
          onClick={createAndPlace}
          disabled={loading}
          className="w-full py-4 stark-button rounded-xl text-sm flex items-center justify-center gap-2 group"
        >
          {loading ? 'Initializing Interface...' : user.role === 'MEMBER' ? <><Rocket size={18} className="group-hover:-translate-y-1 transition-transform" /> LOG REQUEST</> : <><Rocket size={18} className="group-hover:-translate-y-1 transition-transform" /> AUTHORIZE FUNDS & DISPATCH</>}
        </button>
      </div>
    </div>
  );
}
