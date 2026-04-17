'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { ManagerAndAbove } from '@/components/AccessGate';
import { gql, useQuery, useSubscription, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { Package, Clock, CheckCircle, XCircle, Bell, Activity } from 'lucide-react';

const GET_ORDERS = gql`
  query GetOrders {
    orders {
      id status totalAmount country createdAt notes
      user { id name role country }
      restaurant { id name cuisine }
      orderItems { id quantity unitPrice menuItem { name } }
      payment { id status transactionRef paymentMethod { provider last4 } }
    }
  }
`;

const CANCEL_ORDER = gql`
  mutation CancelOrder($orderId: String!) {
    cancelOrder(orderId: $orderId) { id status }
  }
`;

const ORDER_PLACED_SUB = gql`
  subscription {
    orderPlaced {
      id status totalAmount country
      user { name }
      restaurant { name }
    }
  }
`;

const STATUS_STYLES: Record<string, { color: string; icon: any }> = {
  PENDING:   { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50',  icon: Clock },
  CONFIRMED: { color: 'bg-stark-neon/10 text-stark-neon border-stark-neon/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]',      icon: CheckCircle },
  PREPARING: { color: 'bg-purple-500/10 text-purple-400 border-purple-500/50',  icon: Package },
  DELIVERED: { color: 'bg-hulk-green/10 text-green-400 border-hulk-green/50',    icon: CheckCircle },
  CANCELLED: { color: 'bg-ironman-red/10 text-ironman-red border-ironman-red/50',        icon: XCircle },
};

export default function OrdersPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => { if (!token) router.push('/'); }, [token]);

  const { data, loading, refetch } = useQuery(GET_ORDERS, { skip: !token });
  const [cancelOrder] = useMutation(CANCEL_ORDER, {
    onCompleted: () => { toast.success('OPERATIONAL ABORT SUCCESSFUL'); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  // Real-time subscription — only ADMIN and MANAGER roles get this
  useSubscription(ORDER_PLACED_SUB, {
    skip: !token || user?.role === 'MEMBER',
    onData: ({ data: subData }) => {
      const order = subData?.data?.orderPlaced;
      if (!order) return;
      toast.success(
        `🚨 NEW REQUEST SECURED IN ${order.country}`,
        { description: `${order.user.name} ordered from ${order.restaurant.name} · $${order.totalAmount}` }
      );
      refetch();
    },
  });

  if (!user) return null;

  const orders = data?.orders ?? [];

  return (
    <div className="min-h-screen bg-cosmic-glow text-slate-200">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 border-b border-slate-700/50 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-widest uppercase flex items-center gap-3">
              <Activity className="text-stark-neon" size={28} /> Intel Logs
            </h1>
            <p className="text-stark-neon/70 text-sm mt-2 tracking-widest uppercase font-semibold">
              {user.role === 'ADMIN' ? '[ GLOBAL CLASSIFIED DIRECTIVES ]' :
               user.role === 'MANAGER' ? `[ SECTOR DIRECTIVES: ${user.country} ]` :
               '[ PERSONAL OVERRIDES ]'}
            </p>
          </div>
          {user.role !== 'MEMBER' && (
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-stark-neon/10 text-stark-neon border border-stark-neon/30 px-4 py-2 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              <Bell size={14} className="animate-pulse" /> LIVE TELEMETRY STREAM
            </div>
          )}
        </div>

        {loading && (
          <div className="space-y-4">
            {[1,2,3].map((i) => <div key={i} className="h-32 glass-panel rounded-xl animate-pulse" />)}
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="text-center py-20 text-slate-500 border border-slate-700/50 rounded-xl bg-slate-900/40">
            <Package size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold tracking-widest uppercase">NO DIRECTIVES LOCATED</p>
            <button onClick={() => router.push('/restaurants')} className="mt-4 text-stark-neon text-sm font-bold hover:underline transition-all hover:drop-shadow-[0_0_5px_rgba(6,182,212,0.5)] uppercase tracking-wide">Return to map</button>
          </div>
        )}

        <div className="space-y-4">
          {orders.map((order: any) => {
            const st = STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING;
            const StatusIcon = st.icon;
            const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);
            const isCurrency = order.totalAmount < 100;

            return (
              <div key={order.id} className="glass-panel p-6 hover:border-slate-500 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-extrabold text-white text-lg tracking-wide">{order.restaurant.name}</p>
                    <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                      <span className="text-stark-neon">{new Date(order.createdAt).toLocaleString()}</span> // {order.country}
                      {user.role !== 'MEMBER' && ` // OPERATIVE: ${order.user.name} (${order.user.role})`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded border ${st.color}`}>
                      <StatusIcon size={12} strokeWidth={3} /> {order.status}
                    </span>
                  </div>
                </div>

                <div className="text-sm font-bold text-slate-300 mb-5 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                  {order.orderItems.map((oi: any) => (
                    <div key={oi.id} className="flex justify-between py-1 border-b border-slate-800 last:border-0">
                      <span className="tracking-wide text-slate-200">{oi.menuItem.name}</span>
                      <span className="text-ironman-gold px-2 bg-ironman-gold/10 rounded">× {oi.quantity}</span>
                    </div>
                  ))}
                  {order.notes && <p className="mt-3 text-xs text-stark-neon/70 italic border-l-2 border-stark-neon/50 pl-2">Note: {order.notes}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <p className="font-extrabold text-stark-neon text-lg drop-shadow-[0_0_5px_rgba(6,182,212,0.4)]">
                      {isCurrency ? `$${order.totalAmount.toFixed(2)}` : `₹${order.totalAmount.toFixed(0)}`}
                    </p>
                    {order.payment && (
                      <p className="text-[10px] uppercase font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">
                        Authorized: {order.payment.paymentMethod?.provider} •••• {order.payment.paymentMethod?.last4}
                      </p>
                    )}
                  </div>

                  {/* Cancel button — ADMIN/MANAGER only */}
                  <ManagerAndAbove>
                    {canCancel && (
                      <button
                        onClick={() => cancelOrder({ variables: { orderId: order.id } })}
                        className="text-[10px] font-black tracking-widest uppercase text-ironman-red border border-ironman-red/50 bg-ironman-red/10 px-4 py-2 rounded shadow-[0_0_8px_rgba(185,28,28,0.2)] hover:bg-ironman-red hover:text-white transition-all shadow-[0_0_15px_rgba(185,28,28,0.3)] hover:shadow-[0_0_20px_rgba(185,28,28,0.6)]"
                      >
                        Abort Protocol
                      </button>
                    )}
                  </ManagerAndAbove>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
