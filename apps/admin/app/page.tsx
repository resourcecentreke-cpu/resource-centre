'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, login, logout, getToken } from '../lib/api';
import type { AnalyticsSummaryDTO, ReviewDTO, OrderDTO, OrderStatusWire } from '@rc/types';

type Tab = 'analytics' | 'orders' | 'sellers' | 'reviews' | 'products' | 'sponsored';

const btn = 'px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer border';
const primary = `${btn} bg-coral text-white border-coral hover:bg-coral-dark`;
const ghost = `${btn} bg-white text-ink border-[#E7DACd] hover:border-coral`;

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>('analytics');
  const [err, setErr] = useState('');

  useEffect(() => setAuthed(Boolean(getToken())), []);

  if (!authed) return <LoginView onDone={() => setAuthed(true)} />;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-coral" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber" />
            <span className="w-2.5 h-2.5 rounded-full bg-mint" />
          </span>
          <b className="text-lg">Resource Centre · Admin</b>
        </div>
        <button className={ghost} onClick={() => { logout(); setAuthed(false); }}>Sign out</button>
      </header>

      <nav className="flex gap-2 mb-5 flex-wrap">
        {(['analytics', 'orders', 'sellers', 'reviews', 'products', 'sponsored'] as Tab[]).map((t) => (
          <button key={t} onClick={() => { setErr(''); setTab(t); }}
            className={tab === t ? primary : ghost} style={{ textTransform: 'capitalize' }}>{t}</button>
        ))}
      </nav>

      {err && <div className="text-coral-dark text-sm mb-4">{err}</div>}

      <div className="bg-white border border-[#F1E7DC] rounded-2xl p-5 shadow-sm">
        {tab === 'analytics' && <Analytics onErr={setErr} />}
        {tab === 'orders' && <Orders onErr={setErr} />}
        {tab === 'sellers' && <Sellers onErr={setErr} />}
        {tab === 'reviews' && <Reviews onErr={setErr} />}
        {tab === 'products' && <Products onErr={setErr} />}
        {tab === 'sponsored' && <Sponsored onErr={setErr} />}
      </div>
    </div>
  );
}

function LoginView({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const submit = async () => {
    try { await login(email, password); onDone(); } catch (e) { setErr((e as Error).message); }
  };
  return (
    <div className="max-w-sm mx-auto mt-32 bg-white border border-[#F1E7DC] rounded-2xl p-6 shadow-sm">
      <h1 className="text-xl font-bold mb-1">Admin sign in</h1>
      <p className="text-mut text-sm mb-4">Use an account listed in ADMIN_EMAILS.</p>
      <input className="w-full border border-[#E7DACd] rounded-xl p-2.5 mb-2 text-sm" placeholder="email"
        value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="w-full border border-[#E7DACd] rounded-xl p-2.5 mb-3 text-sm" placeholder="password" type="password"
        value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      {err && <div className="text-coral-dark text-sm mb-2">{err}</div>}
      <button className={`${primary} w-full py-2.5`} onClick={submit}>Sign in</button>
    </div>
  );
}

function useLoad<T>(path: string, onErr: (m: string) => void): [T | null, () => void] {
  const [data, setData] = useState<T | null>(null);
  const load = useCallback(() => {
    api<T>(path).then(setData).catch((e) => onErr((e as Error).message));
  }, [path, onErr]);
  useEffect(() => { load(); }, [load]);
  return [data, load];
}

function Analytics({ onErr }: { onErr: (m: string) => void }) {
  const [a] = useLoad<AnalyticsSummaryDTO>('/admin/analytics', onErr);
  if (!a) return <p className="text-mut text-sm">Loading…</p>;
  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <div className="border border-[#F1E7DC] rounded-xl p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs uppercase tracking-wide text-mut font-bold">{label}</div>
    </div>
  );
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Searches" value={a.totals.searches} />
        <Stat label="Product views" value={a.totals.views} />
        <Stat label="Store clicks" value={a.totals.clicks} />
        <Stat label="Conversion" value={`${Math.round(a.conversionRate * 100)}%`} />
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        <Col title="Top searches" rows={a.topSearches.map((s) => [s.query, s.count])} />
        <Col title="Most-clicked stores" rows={a.topStores.map((s) => [s.seller, s.count])} />
        <Col title="Most viewed" rows={a.mostViewed.map((s) => [s.product, s.count])} />
      </div>
    </div>
  );
}
function Col({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div>
      <h3 className="font-bold text-sm mb-2">{title}</h3>
      {rows.length ? (
        <table><tbody>{rows.map((r, i) => (
          <tr key={i}><td>{r[0]}</td><td className="text-right font-bold">{r[1]}</td></tr>
        ))}</tbody></table>
      ) : <p className="text-mut text-xs">No data yet.</p>}
    </div>
  );
}

interface SellerRow { id: string; name: string; status: string; isVerified: boolean; metric?: { trustScore: number } }
function Sellers({ onErr }: { onErr: (m: string) => void }) {
  const [rows, reload] = useLoad<SellerRow[]>('/admin/sellers', onErr);
  const act = async (id: string, body: object) => {
    try { await api(`/admin/sellers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }); reload(); }
    catch (e) { onErr((e as Error).message); }
  };
  if (!rows) return <p className="text-mut text-sm">Loading…</p>;
  return (
    <table><thead><tr><th>Seller</th><th>Status</th><th>Verified</th><th>Trust</th><th>Actions</th></tr></thead>
      <tbody>{rows.map((s) => (
        <tr key={s.id}>
          <td className="font-semibold">{s.name}</td>
          <td>{s.status}</td>
          <td>{s.isVerified ? '✓' : '—'}</td>
          <td>{s.metric?.trustScore ?? '—'}</td>
          <td className="flex gap-1.5 flex-wrap py-2">
            <button className={ghost} onClick={() => act(s.id, { status: 'active' })}>Approve</button>
            <button className={ghost} onClick={() => act(s.id, { status: 'suspended' })}>Suspend</button>
            <button className={ghost} onClick={() => act(s.id, { isVerified: !s.isVerified })}>{s.isVerified ? 'Unverify' : 'Verify'}</button>
          </td>
        </tr>
      ))}</tbody></table>
  );
}

function Reviews({ onErr }: { onErr: (m: string) => void }) {
  const [rows, reload] = useLoad<ReviewDTO[]>('/reviews/pending', onErr);
  const mod = async (id: string, status: 'approved' | 'rejected') => {
    try { await api(`/reviews/${id}/moderate`, { method: 'PATCH', body: JSON.stringify({ status }) }); reload(); }
    catch (e) { onErr((e as Error).message); }
  };
  if (!rows) return <p className="text-mut text-sm">Loading…</p>;
  if (!rows.length) return <p className="text-mut text-sm">No pending reviews. 🎉</p>;
  return (
    <table><thead><tr><th>Type</th><th>Rating</th><th>Review</th><th>By</th><th>Actions</th></tr></thead>
      <tbody>{rows.map((r) => (
        <tr key={r.id}>
          <td>{r.type}</td><td>{'★'.repeat(r.rating)}</td>
          <td><b>{r.title}</b><div className="text-mut">{r.body}</div></td>
          <td>{r.author}</td>
          <td className="flex gap-1.5 py-2">
            <button className={primary} onClick={() => mod(r.id, 'approved')}>Approve</button>
            <button className={ghost} onClick={() => mod(r.id, 'rejected')}>Reject</button>
          </td>
        </tr>
      ))}</tbody></table>
  );
}

interface ProductRow { id: string; name: string; brand: string; minPrice: number; isActive: boolean; category: { name: string } }
interface CatOpt { slug: string; name: string }
const blank = { name: '', brand: '', categorySlug: '', specSummary: '', imageSlug: '', isNew: false };
function Products({ onErr }: { onErr: (m: string) => void }) {
  const [rows, reload] = useLoad<ProductRow[]>('/admin/products', onErr);
  const [cats, setCats] = useState<CatOpt[]>([]);
  const [form, setForm] = useState({ ...blank });
  const [open, setOpen] = useState(false);
  const [ok, setOk] = useState('');
  const [pricesFor, setPricesFor] = useState<{ id: string; name: string } | null>(null);
  useEffect(() => { api<CatOpt[]>('/categories').then(setCats).catch(() => {}); }, []);
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = async (id: string, isActive: boolean) => {
    try { await api(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !isActive }) }); reload(); }
    catch (e) { onErr((e as Error).message); }
  };
  const create = async () => {
    if (!form.name || !form.brand || !form.categorySlug || !form.specSummary) { onErr('Fill in name, brand, category and spec summary.'); return; }
    try {
      await api('/admin/products', { method: 'POST', body: JSON.stringify({
        name: form.name, brand: form.brand, categorySlug: form.categorySlug,
        specSummary: form.specSummary, imageSlug: form.imageSlug || undefined, isNew: form.isNew,
      }) });
      setForm({ ...blank }); setOpen(false); setOk(`Added “${form.name}”. Add store prices to give it a price tag (see note).`); reload();
    } catch (e) { onErr((e as Error).message); }
  };
  if (!rows) return <p className="text-mut text-sm">Loading…</p>;
  const input = 'border border-[#E7DACd] rounded-lg p-2 text-sm w-full';
  return (
    <div>
      <button className={`${primary} mb-3`} onClick={() => setOpen((o) => !o)}>{open ? 'Cancel' : '+ Add product'}</button>
      {ok && <div className="text-[#0e8f68] text-sm mb-3">{ok}</div>}
      {open && (
        <div className="border border-[#F1E7DC] rounded-xl p-4 mb-4 grid gap-2 md:grid-cols-2 bg-[#FFFDF9]">
          <label className="text-xs font-bold text-mut">Name<input className={input} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Samsung Galaxy S27 Ultra" /></label>
          <label className="text-xs font-bold text-mut">Brand<input className={input} value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Samsung" /></label>
          <label className="text-xs font-bold text-mut">Category
            <select className={input} value={form.categorySlug} onChange={(e) => set('categorySlug', e.target.value)}>
              <option value="">Select…</option>
              {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-mut">Image slug (optional)<input className={input} value={form.imageSlug} onChange={(e) => set('imageSlug', e.target.value)} placeholder="samsung-galaxy-s27-ultra" /></label>
          <label className="text-xs font-bold text-mut md:col-span-2">Spec summary<input className={input} value={form.specSummary} onChange={(e) => set('specSummary', e.target.value)} placeholder='6.9" AMOLED · SD 8 Elite Gen6 · 200MP' /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isNew} onChange={(e) => set('isNew', e.target.checked)} /> Mark as new</label>
          <div className="md:col-span-2"><button className={primary} onClick={create}>Save product</button></div>
        </div>
      )}
      <table><thead><tr><th>Product</th><th>Brand</th><th>Category</th><th>Min price</th><th>Active</th><th></th></tr></thead>
        <tbody>{rows.map((p) => (
          <tr key={p.id}>
            <td className="font-semibold">{p.name}</td><td>{p.brand}</td><td>{p.category.name}</td>
            <td>KSh {p.minPrice.toLocaleString()}</td><td>{p.isActive ? '✓' : '—'}</td>
            <td className="flex gap-1.5 py-2">
              <button className={ghost} onClick={() => setPricesFor({ id: p.id, name: p.name })}>Prices</button>
              <button className={ghost} onClick={() => toggle(p.id, p.isActive)}>{p.isActive ? 'Hide' : 'Show'}</button>
            </td>
          </tr>
        ))}</tbody></table>
      {pricesFor && <OffersEditor product={pricesFor} onErr={onErr} onClose={() => setPricesFor(null)} onChange={reload} />}
    </div>
  );
}

interface OfferRow { id: string; price: number; deliveryFee: number; inStock: string; productUrl: string | null; seller: { name: string } }
const blankOffer = { sellerId: '', price: '', deliveryFee: '', inStock: 'in', productUrl: '' };
function OffersEditor({ product, onErr, onClose, onChange }: { product: { id: string; name: string }; onErr: (m: string) => void; onClose: () => void; onChange: () => void }) {
  const [offers, setOffers] = useState<OfferRow[] | null>(null);
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [f, setF] = useState({ ...blankOffer });
  const load = () => api<OfferRow[]>(`/admin/products/${product.id}/offers`).then(setOffers).catch((e) => onErr((e as Error).message));
  useEffect(() => { load(); api<{ id: string; name: string }[]>('/admin/sellers').then(setSellers).catch(() => {}); /* eslint-disable-next-line */ }, [product.id]);
  const save = async () => {
    if (!f.sellerId || !f.price) { onErr('Pick a store and enter a price.'); return; }
    try {
      await api(`/admin/products/${product.id}/offers`, { method: 'PUT', body: JSON.stringify({
        sellerId: f.sellerId, price: Number(f.price),
        deliveryFee: f.deliveryFee ? Number(f.deliveryFee) : undefined,
        inStock: f.inStock, productUrl: f.productUrl || undefined,
      }) });
      setF({ ...blankOffer }); load(); onChange();
    } catch (e) { onErr((e as Error).message); }
  };
  const del = async (id: string) => {
    try { await api(`/admin/offers/${id}`, { method: 'DELETE' }); load(); onChange(); } catch (e) { onErr((e as Error).message); }
  };
  const inp = 'border border-[#E7DACd] rounded-lg p-2 text-sm';
  return (
    <div className="mt-5 border border-coral/40 rounded-xl p-4 bg-[#FFF7F0]">
      <div className="flex items-center justify-between mb-3">
        <b>Store prices · {product.name}</b>
        <button className={ghost} onClick={onClose}>Close</button>
      </div>
      {!offers ? <p className="text-mut text-sm">Loading…</p> : (
        <table className="mb-3"><thead><tr><th>Store</th><th>Price</th><th>Delivery</th><th>Stock</th><th></th></tr></thead>
          <tbody>{offers.length ? offers.map((o) => (
            <tr key={o.id}><td className="font-semibold">{o.seller.name}</td><td>KSh {o.price.toLocaleString()}</td><td>{o.deliveryFee ? `KSh ${o.deliveryFee}` : 'Free'}</td><td>{o.inStock}</td>
              <td><button className={ghost} onClick={() => del(o.id)}>Delete</button></td></tr>
          )) : <tr><td colSpan={5} className="text-mut">No prices yet — add one below.</td></tr>}</tbody></table>
      )}
      <div className="flex gap-2 flex-wrap items-end">
        <label className="text-xs font-bold text-mut">Store<br /><select className={inp} value={f.sellerId} onChange={(e) => setF({ ...f, sellerId: e.target.value })}><option value="">Select…</option>{sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="text-xs font-bold text-mut">Price (KSh)<br /><input className={inp} type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></label>
        <label className="text-xs font-bold text-mut">Delivery<br /><input className={inp} type="number" value={f.deliveryFee} onChange={(e) => setF({ ...f, deliveryFee: e.target.value })} placeholder="0" /></label>
        <label className="text-xs font-bold text-mut">Stock<br /><select className={inp} value={f.inStock} onChange={(e) => setF({ ...f, inStock: e.target.value })}><option value="in">In stock</option><option value="low">Low</option><option value="out">Out</option></select></label>
        <button className={primary} onClick={save}>Save price</button>
      </div>
      <p className="text-xs text-mut mt-2">Adding a store that already has a price updates it. The product&apos;s best price recalculates automatically.</p>
    </div>
  );
}

interface SponsoredRow { id: string; placement: string; isActive: boolean; seller: { name: string }; product?: { name: string } | null; endsAt: string }
function Sponsored({ onErr }: { onErr: (m: string) => void }) {
  const [rows, reload] = useLoad<SponsoredRow[]>('/admin/sponsored', onErr);
  const toggle = async (id: string, isActive: boolean) => {
    try { await api(`/admin/sponsored/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !isActive }) }); reload(); }
    catch (e) { onErr((e as Error).message); }
  };
  const del = async (id: string) => {
    try { await api(`/admin/sponsored/${id}`, { method: 'DELETE' }); reload(); }
    catch (e) { onErr((e as Error).message); }
  };
  if (!rows) return <p className="text-mut text-sm">Loading…</p>;
  if (!rows.length) return <p className="text-mut text-sm">No sponsored listings.</p>;
  return (
    <table><thead><tr><th>Seller</th><th>Placement</th><th>Product</th><th>Active</th><th>Actions</th></tr></thead>
      <tbody>{rows.map((s) => (
        <tr key={s.id}>
          <td className="font-semibold">{s.seller.name}</td><td>{s.placement}</td><td>{s.product?.name ?? '—'}</td>
          <td>{s.isActive ? '✓' : '—'}</td>
          <td className="flex gap-1.5 py-2">
            <button className={ghost} onClick={() => toggle(s.id, s.isActive)}>{s.isActive ? 'Pause' : 'Activate'}</button>
            <button className={ghost} onClick={() => del(s.id)}>Delete</button>
          </td>
        </tr>
      ))}</tbody></table>
  );
}

// ── Concierge orders: customer paid us, we buy from the store & deliver ──
const ORDER_FLOW: OrderStatusWire[] = ['paid', 'purchasing', 'out_for_delivery', 'delivered'];
const ORDER_LABEL: Record<OrderStatusWire, string> = {
  pending_payment: '⏳ Awaiting payment',
  paid: '💰 Paid — buy it now',
  purchasing: '🛒 Purchasing',
  out_for_delivery: '🚚 Out for delivery',
  delivered: '✅ Delivered',
  cancelled: '✖ Cancelled',
};
const NEXT_LABEL: Record<string, string> = {
  paid: 'Mark purchasing',
  purchasing: 'Mark out for delivery',
  out_for_delivery: 'Mark delivered',
};

function Orders({ onErr }: { onErr: (m: string) => void }) {
  const [filter, setFilter] = useState<'' | OrderStatusWire>('');
  const [rows, reload] = useLoad<OrderDTO[]>(`/admin/orders${filter ? `?status=${filter}` : ''}`, onErr);

  const setStatus = async (id: string, status: OrderStatusWire) => {
    try { await api(`/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); reload(); }
    catch (e) { onErr((e as Error).message); }
  };

  if (!rows) return <p className="text-mut text-sm">Loading…</p>;

  const next = (s: OrderStatusWire): OrderStatusWire | null => {
    const i = ORDER_FLOW.indexOf(s);
    return i >= 0 && i < ORDER_FLOW.length - 1 ? ORDER_FLOW[i + 1]! : null;
  };

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-4">
        {(['', 'paid', 'purchasing', 'out_for_delivery', 'delivered', 'pending_payment', 'cancelled'] as const).map((f) => (
          <button key={f || 'all'} className={filter === f ? primary : ghost} onClick={() => setFilter(f)}>
            {f === '' ? 'All' : ORDER_LABEL[f]}
          </button>
        ))}
      </div>
      {!rows.length ? <p className="text-mut text-sm">No orders{filter ? ' with this status' : ' yet'}.</p> : (
        <table>
          <thead><tr><th>When</th><th>Customer</th><th>Product</th><th>Buy from</th><th>Totals</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{rows.map((o) => {
            const n = next(o.status);
            return (
              <tr key={o.id} className="align-top">
                <td className="whitespace-nowrap text-xs text-mut">{new Date(o.createdAt).toLocaleString('en-KE')}</td>
                <td>
                  <b>{o.customerName}</b>
                  <div className="text-xs text-mut">{o.phone}{o.email ? ` · ${o.email}` : ''}</div>
                  <div className="text-xs text-mut">{o.city} — {o.address}</div>
                  {o.notes && <div className="text-xs italic text-mut mt-0.5">“{o.notes}”</div>}
                </td>
                <td className="font-semibold">{o.productName}</td>
                <td>{o.sellerName ?? '—'}</td>
                <td className="whitespace-nowrap text-xs">
                  <div>Item: <b>KSh {o.unitPrice.toLocaleString()}</b></div>
                  <div>Fee: KSh {o.serviceFee.toLocaleString()}</div>
                  <div className="font-bold">Paid: KSh {o.total.toLocaleString()}</div>
                  {o.mpesaReceipt && <div className="text-mut">M-Pesa {o.mpesaReceipt}</div>}
                </td>
                <td className="whitespace-nowrap text-xs font-bold">{ORDER_LABEL[o.status]}</td>
                <td className="py-2">
                  <div className="flex gap-1.5 flex-wrap">
                    {n && <button className={primary} onClick={() => setStatus(o.id, n)}>{NEXT_LABEL[o.status]}</button>}
                    {o.status !== 'cancelled' && o.status !== 'delivered' && (
                      <button className={ghost} onClick={() => setStatus(o.id, 'cancelled')}>Cancel</button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}</tbody>
        </table>
      )}
      <p className="text-xs text-mut mt-3">
        Flow: customer pays → <b>Paid</b> (buy it from the store now, shipped to their address) →
        <b> Purchasing</b> → <b>Out for delivery</b> → <b>Delivered</b>. Cancelled orders need a manual M-Pesa refund.
      </p>
    </div>
  );
}
