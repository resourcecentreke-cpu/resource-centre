'use client';
import { useEffect, useState } from 'react';
import { fmtKES } from '../../lib/format';

interface Cat { name: string; slug: string }
interface Row { id: string; name: string; slug: string; brand: string; category: string; minPrice: number; image: string | null; images: string[] }

const KEY_STORE = 'rc_manage_key';

async function call<T>(path: string, key: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/manage${path}`, {
    ...opts,
    headers: { 'x-manage-key': key, ...(opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error((b as { message?: string }).message || `Failed (${res.status})`);
  }
  return (res.status === 204 ? null : await res.json()) as T;
}

export default function AdminPage() {
  const [key, setKey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [cats, setCats] = useState<Cat[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // form state
  const [name, setName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [brand, setBrand] = useState('');
  const [spec, setSpec] = useState('');
  const [price, setPrice] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(KEY_STORE) : null;
    if (saved) { setKey(saved); void unlock(saved); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unlock(k: string) {
    setMsg('');
    try {
      const meta = await call<{ categories: Cat[] }>('/meta', k);
      setCats(meta.categories);
      setCategorySlug(meta.categories[0]?.slug ?? '');
      localStorage.setItem(KEY_STORE, k);
      setAuthed(true);
      await refresh(k);
    } catch (e) {
      setAuthed(false);
      setMsg((e as Error).message);
    }
  }

  async function refresh(k = key, q = query) {
    try { setRows(await call<Row[]>(`/products${q ? `?q=${encodeURIComponent(q)}` : ''}`, k)); } catch { /* ignore */ }
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg('');
    try {
      const created = await call<{ id: string; slug: string }>('/products', key, {
        method: 'POST',
        body: JSON.stringify({ name, categorySlug, brand, specSummary: spec, price: Number(price), isNew }),
      });
      if (files.length) await uploadImages(created.id, files);
      setMsg(`✅ Added "${name}".`);
      setName(''); setBrand(''); setSpec(''); setPrice(''); setIsNew(false); setFiles([]);
      await refresh();
    } catch (e) { setMsg((e as Error).message); }
    finally { setBusy(false); }
  }

  async function uploadImages(id: string, fl: File[]) {
    if (!fl.length) return;
    const fd = new FormData();
    fl.forEach((f) => fd.append('files', f));
    await call(`/products/${id}/images`, key, { method: 'POST', body: fd });
  }

  async function onRowAdd(id: string, fl: File[]) {
    if (!fl.length) return;
    setBusy(true); setMsg('');
    try { await uploadImages(id, fl); setMsg('✅ Photos added.'); await refresh(); }
    catch (e) { setMsg((e as Error).message); }
    finally { setBusy(false); }
  }

  async function setOrder(id: string, images: string[]) {
    setBusy(true); setMsg('');
    try { await call(`/products/${id}/images`, key, { method: 'PUT', body: JSON.stringify({ images }) }); await refresh(); }
    catch (e) { setMsg((e as Error).message); }
    finally { setBusy(false); }
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto px-5 py-16">
        <h1 className="font-display text-2xl font-bold mb-2">Admin</h1>
        <p className="text-mut text-sm mb-4">Enter your admin key to manage products and photos.</p>
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Admin key"
          className="w-full border-2 border-[#D5DAF0] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-coral" />
        <button onClick={() => unlock(key)} className="mt-3 w-full rounded-full bg-coral text-white font-bold text-sm py-3">Unlock</button>
        {msg && <p className="text-sm text-[#C0463F] mt-3">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Manage products</h1>
        <button onClick={() => { localStorage.removeItem(KEY_STORE); setAuthed(false); }} className="text-xs font-bold text-mut hover:text-coral">Sign out</button>
      </div>

      {msg && <div className="mb-4 rounded-xl border border-[#E3E6F4] bg-[#EEF1FB] px-4 py-2.5 text-sm">{msg}</div>}

      <form onSubmit={addProduct} className="rounded-2xl border border-[#E3E6F4] bg-white p-5 shadow-sm grid sm:grid-cols-2 gap-4 mb-8">
        <div className="sm:col-span-2 font-bold text-sm">Add a new product</div>
        <label className="text-sm">Name
          <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border-2 border-[#D5DAF0] rounded-lg px-3 py-2 text-sm outline-none focus:border-coral" placeholder="e.g. Dell XPS 13 (2025)" />
        </label>
        <label className="text-sm">Category
          <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} className="mt-1 w-full border-2 border-[#D5DAF0] rounded-lg px-3 py-2 text-sm outline-none focus:border-coral">
            {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <label className="text-sm">Brand
          <input value={brand} onChange={(e) => setBrand(e.target.value)} className="mt-1 w-full border-2 border-[#D5DAF0] rounded-lg px-3 py-2 text-sm outline-none focus:border-coral" placeholder="e.g. Dell (optional)" />
        </label>
        <label className="text-sm">Price (KSh)
          <input required type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 w-full border-2 border-[#D5DAF0] rounded-lg px-3 py-2 text-sm outline-none focus:border-coral" placeholder="e.g. 150000" />
        </label>
        <label className="text-sm sm:col-span-2">Short spec
          <input value={spec} onChange={(e) => setSpec(e.target.value)} className="mt-1 w-full border-2 border-[#D5DAF0] rounded-lg px-3 py-2 text-sm outline-none focus:border-coral" placeholder='e.g. 13.4" FHD+ · Core Ultra 7 · 16GB' />
        </label>
        <label className="text-sm sm:col-span-2">Photos (optional — you can pick several)
          <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} className="mt-1 w-full text-sm" />
          {files.length > 0 && <span className="text-xs text-mut">{files.length} photo(s) selected</span>}
        </label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} /> Mark as new arrival</label>
        <div className="sm:col-span-2">
          <button disabled={busy} className="rounded-full bg-coral text-white font-bold text-sm px-6 py-2.5 disabled:opacity-50">{busy ? 'Saving…' : 'Add product'}</button>
        </div>
      </form>

      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 className="font-display text-lg font-bold">Products</h2>
        <div className="flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && refresh(key, query)}
            placeholder="Search any product by name…"
            className="border-2 border-[#D5DAF0] rounded-full px-4 py-1.5 text-sm outline-none focus:border-coral w-64 max-w-full" />
          <button onClick={() => refresh(key, query)} className="rounded-full bg-coral text-white text-xs font-bold px-4">Search</button>
          {query && <button onClick={() => { setQuery(''); refresh(key, ''); }} className="text-xs font-bold text-mut hover:text-coral px-1">Clear</button>}
        </div>
      </div>
      <p className="text-xs text-mut mb-3">Search to find any of your products, then add or remove its photos. Showing {rows.length}.</p>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-[#E3E6F4] bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{r.name}</div>
                <div className="text-xs text-mut">{r.category} · {fmtKES(r.minPrice)} · {r.images.length} photo(s)</div>
              </div>
              <label className="text-xs font-bold text-coral cursor-pointer shrink-0">
                + Add photos
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onRowAdd(r.id, Array.from(e.target.files ?? []))} />
              </label>
            </div>
            {r.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {r.images.map((url, i) => (
                  <div key={url} className="relative w-16 h-16 rounded-lg border border-[#E3E6F4] bg-[#F4F6FD] overflow-hidden group">
                    <img src={url} alt="" className="w-full h-full object-contain" />
                    {i === 0 && <span className="absolute top-0 left-0 text-[9px] font-bold bg-coral text-white px-1 rounded-br">PRIMARY</span>}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/40 opacity-0 group-hover:opacity-100 transition">
                      {i !== 0 && <button title="Make primary" onClick={() => setOrder(r.id, [url, ...r.images.filter((u) => u !== url)])} className="text-white text-xs px-1">★</button>}
                      <button title="Remove" onClick={() => setOrder(r.id, r.images.filter((u) => u !== url))} className="text-white text-xs px-1 ml-auto">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {rows.length === 0 && <p className="text-mut text-sm">No products yet.</p>}
      </div>
    </div>
  );
}
