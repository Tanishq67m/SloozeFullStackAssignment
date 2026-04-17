'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { Star, MapPin, ShoppingCart, Plus, Minus, Search } from 'lucide-react';
import { toast } from 'sonner';

const GQL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql';

async function gqlFetch(query: string, token: string) {
  const res = await fetch(GQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query }),
  });
  const { data, errors } = await res.json();
  if (errors) throw new Error(errors[0].message);
  return data;
}

interface MenuItem { id: string; name: string; description: string; price: number; category: string; }
interface Restaurant { id: string; name: string; description: string; cuisine: string; country: string; rating: number; address: string; menuItems: MenuItem[]; }
type CartItem = MenuItem & { quantity: number; restaurantId: string; restaurantName: string; };

export default function RestaurantsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!token) { router.push('/'); return; }
    gqlFetch(`query { restaurants { id name description cuisine country rating address menuItems { id name description price category } } }`, token)
      .then((d) => setRestaurants(d.restaurants))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const addToCart = (item: MenuItem, restaurant: Restaurant) => {
    if (cart.length > 0 && cart[0].restaurantId !== restaurant.id) {
      toast.error('You can only order from one restaurant at a time. Clear your cart first.');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1, restaurantId: restaurant.id, restaurantName: restaurant.name }];
    });
    toast.success(`Acquired ${item.name}`);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const updated = prev.map((c) => c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c).filter((c) => c.quantity > 0);
      return updated;
    });
  };

  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  const goToCheckout = () => {
    sessionStorage.setItem('slooze_cart', JSON.stringify(cart));
    router.push('/checkout');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-cosmic-glow text-slate-200">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-widest uppercase flex items-center gap-3">
              <Search className="text-stark-neon" size={28} />
              Intel / Restaurants
            </h1>
            <p className="text-stark-neon/70 text-sm mt-2 tracking-widest uppercase font-semibold">
              {user.country ? `[ REGION SECURED: ${user.country} ]` : '[ GLOBAL S.H.I.E.L.D ACCESS GRANTED ]'}
            </p>
          </div>
          {cartCount > 0 && (
            <button onClick={goToCheckout} className="flex items-center gap-2 px-6 py-3 stark-button rounded-xl animate-pulse">
              <ShoppingCart size={18} />
              ENGAGE CART ({cartCount}) · {typeof cartTotal === 'number' && cartTotal < 100 ? `$${cartTotal.toFixed(2)}` : `₹${cartTotal.toFixed(0)}`}
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {[1,2,3].map((i) => <div key={i} className="h-56 glass-panel rounded-2xl animate-pulse border-slate-700/50 block" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {restaurants.map((r) => {
              const capBorder = r.country === 'AMERICA' ? 'border-cap-blue/40 shadow-[0_0_15px_rgba(29,78,216,0.15)]' : 'border-ironman-gold/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]';
              
              return (
              <div key={r.id} className={`glass-panel rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] ${capBorder}`}>
                <div className={`h-32 flex items-center justify-center relative overflow-hidden ${r.country === 'AMERICA' ? 'bg-gradient-to-r from-cap-blue/20 to-slate-900/40' : 'bg-gradient-to-r from-ironman-gold/20 to-slate-900/40'}`}>
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                  <span className="text-5xl drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] z-10">{r.cuisine.includes('Indian') || r.country === 'INDIA' ? '🍛' : r.cuisine.includes('BBQ') ? '🍖' : r.cuisine.includes('Pizza') ? '🍕' : '🍔'}</span>
                </div>
                <div className="p-5 relative z-10 bg-slate-900/80">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-extrabold tracking-wide text-white text-lg">{r.name}</h3>
                    <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded text-stark-neon text-xs font-bold border border-stark-neon/20 shadow-[0_0_5px_rgba(6,182,212,0.2)]">
                      <Star size={12} fill="currentColor" /> {r.rating}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3 bg-slate-800 inline-block px-2 py-0.5 rounded">{r.cuisine}</p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-5">
                    <MapPin size={12} className="text-ironman-red" /> {r.address}
                  </div>
                  <button
                    onClick={() => setSelected(selected?.id === r.id ? null : r)}
                    className="w-full py-2.5 text-xs tracking-widest font-bold uppercase border border-slate-600 rounded-lg hover:border-stark-neon hover:text-stark-neon hover:bg-stark-neon/10 transition-all"
                  >
                    {selected?.id === r.id ? 'CLOSE MANIFEST' : 'SCAN MENU'}
                  </button>
                </div>

                {selected?.id === r.id && (
                  <div className="border-t border-slate-700/50 px-5 pb-5 max-h-80 overflow-y-auto bg-slate-900/95 animate-slide-down">
                    {Array.from(new Set(r.menuItems.map((m) => m.category))).map((cat) => (
                      <div key={cat} className="mt-4">
                        <p className="text-[10px] font-black text-stark-neon uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-stark-neon animate-pulse"></span> {cat}
                        </p>
                        <div className="space-y-3">
                          {r.menuItems.filter((m) => m.category === cat).map((item) => {
                            const inCart = cart.find((c) => c.id === item.id);
                            return (
                              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-stark-neon/50 hover:bg-slate-800 hover:shadow-[0_5px_15px_rgba(6,182,212,0.15)] hover:-translate-y-0.5 transition-all duration-300">
                                <div className="flex-1 min-w-0 pr-3">
                                  <p className="text-sm font-bold text-slate-200">{item.name}</p>
                                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                                  <p className="text-sm font-black text-ironman-gold mt-1 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]">
                                    {item.price > 100 ? `₹${item.price}` : item.price < 50 ? `$${item.price.toFixed(2)}` : item.price < 200 ? `₹${item.price}` : `$${item.price.toFixed(2)}`}
                                  </p>
                                </div>
                                {inCart ? (
                                  <div className="flex items-center gap-3 bg-slate-900 border border-stark-neon/30 p-1.5 rounded-lg shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                                    <button onClick={() => removeFromCart(item.id)} className="p-1 rounded text-stark-neon hover:bg-stark-neon/20 transition-colors"><Minus size={14} strokeWidth={3} /></button>
                                    <span className="text-sm font-black text-white w-4 text-center">{inCart.quantity}</span>
                                    <button onClick={() => addToCart(item, r)} className="p-1 rounded text-stark-neon hover:bg-stark-neon/20 transition-colors"><Plus size={14} strokeWidth={3} /></button>
                                  </div>
                                ) : (
                                  <button onClick={() => addToCart(item, r)} className="p-2 rounded-lg border border-slate-600 text-slate-300 hover:border-stark-neon hover:text-stark-neon hover:bg-stark-neon/10 transition-all"><Plus size={16} strokeWidth={3} /></button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}
