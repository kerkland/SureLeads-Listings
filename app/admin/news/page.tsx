'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface PostRow {
  id:          string;
  slug:        string;
  title:       string;
  category:    string;
  coverImage:  string | null;
  featured:    boolean;
  published:   boolean;
  readTime:    string;
  publishedAt: string | null;
  createdAt:   string;
}

interface PostForm {
  title:      string;
  slug:       string;
  excerpt:    string;
  body:       string;   // textarea — paragraphs separated by blank lines
  category:   string;
  coverImage: string;   // base64 data URL
  featured:   boolean;
  readTime:   string;
}

const BLANK: PostForm = {
  title: '', slug: '', excerpt: '', body: '', category: 'Market Report',
  coverImage: '', featured: false, readTime: '5 min read',
};

const CATEGORIES = [
  'Market Report', 'Price Trends', 'Area Guide', 'Renter Guide', 'Platform',
];

const CAT_COLOR: Record<string, string> = {
  'Market Report': 'text-sl-green-600 bg-sl-green-50',
  'Price Trends':  'text-blue-600 bg-blue-50',
  'Area Guide':    'text-purple-600 bg-purple-50',
  'Renter Guide':  'text-red-600 bg-red-50',
  'Platform':      'text-sl-gold-700 bg-sl-gold-50',
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function autoReadTime(body: string) {
  const wc = wordCount(body);
  const mins = Math.max(1, Math.ceil(wc / 200));
  return `${mins} min read`;
}

async function compressImage(file: File): Promise<string> {
  const img = new Image();
  const url = URL.createObjectURL(file);
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error('Image load failed'));
    img.src = url;
  });
  const MAX_W = 1200;
  const ratio = Math.min(1, MAX_W / img.width);
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(url);
  return canvas.toDataURL('image/jpeg', 0.82);
}

function fmt(dt: string | null) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function AdminNewsPage() {
  const [posts,      setPosts]      = useState<PostRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [mode,       setMode]       = useState<'list' | 'create' | 'edit'>('list');
  const [editId,     setEditId]     = useState<string | null>(null);
  const [form,       setForm]       = useState<PostForm>(BLANK);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  /* ─── Load posts ── */
  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/news');
      const j = await r.json();
      if (j.success) setPosts(j.data);
    } catch { /* ignore */ }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  /* ─── Form helpers ── */
  const set = (k: keyof PostForm, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleTitleChange = (v: string) => {
    setForm((f) => ({
      ...f, title: v,
      // Only auto-update slug if user hasn't manually edited it
      slug: f.slug === toSlug(f.title) || f.slug === '' ? toSlug(v) : f.slug,
    }));
  };

  const handleBodyChange = (v: string) => {
    setForm((f) => ({ ...f, body: v, readTime: autoReadTime(v) }));
  };

  /* ─── Image upload ── */
  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgLoading(true);
    try {
      const compressed = await compressImage(file);
      set('coverImage', compressed);
    } catch { setError('Image compression failed — try a smaller file.'); }
    finally  { setImgLoading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  /* ─── Open edit ── */
  const openEdit = async (post: PostRow) => {
    setError(''); setSuccess('');
    // Fetch full post (including body + excerpt)
    const r = await fetch(`/api/admin/news/${post.id}`);
    if (!r.ok) { setError('Could not load post.'); return; }
    const j = await r.json();
    const p = j.data;
    setForm({
      title:      p.title,
      slug:       p.slug,
      excerpt:    p.excerpt,
      body:       (p.body as string[]).join('\n\n'),
      category:   p.category,
      coverImage: p.coverImage ?? '',
      featured:   p.featured,
      readTime:   p.readTime,
    });
    setEditId(post.id);
    setMode('edit');
  };

  /* ─── Save ── */
  const handleSave = async (publish: boolean) => {
    setError(''); setSaving(true);
    const paragraphs = form.body
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (!form.title.trim() || !form.slug.trim() || !form.excerpt.trim() || paragraphs.length === 0) {
      setError('Title, slug, excerpt, and body are required.');
      setSaving(false);
      return;
    }

    const payload = {
      title:      form.title.trim(),
      slug:       form.slug.trim(),
      excerpt:    form.excerpt.trim(),
      body:       paragraphs,
      category:   form.category,
      coverImage: form.coverImage || null,
      featured:   form.featured,
      readTime:   form.readTime,
      published:  publish,
    };

    const url    = mode === 'edit' ? `/api/admin/news/${editId}` : '/api/admin/news';
    const method = mode === 'edit' ? 'PUT' : 'POST';

    try {
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok || !j.success) {
        setError(typeof j.error === 'string' ? j.error : 'Save failed — check your inputs.');
      } else {
        setSuccess(mode === 'edit' ? 'Post updated.' : publish ? 'Post published!' : 'Draft saved.');
        setMode('list');
        setForm(BLANK);
        setEditId(null);
        loadPosts();
      }
    } catch { setError('Network error — please try again.'); }
    finally  { setSaving(false); }
  };

  /* ─── Delete ── */
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const r = await fetch(`/api/admin/news/${id}`, { method: 'DELETE' });
      const j = await r.json();
      if (j.success) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        setSuccess('Post deleted.');
        if (editId === id) { setMode('list'); setForm(BLANK); setEditId(null); }
      } else { setError('Delete failed.'); }
    } catch { setError('Network error.'); }
    finally  { setDeleting(null); }
  };

  const cancelForm = () => { setMode('list'); setForm(BLANK); setEditId(null); setError(''); };

  /* ─── Render ── */
  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-sl-slate-900">News &amp; Insights</h1>
          <p className="text-sm text-sl-slate-500 mt-0.5">
            {posts.length} post{posts.length !== 1 ? 's' : ''} · {posts.filter((p) => p.published).length} published
          </p>
        </div>
        {mode === 'list' ? (
          <button
            onClick={() => { setMode('create'); setForm(BLANK); setError(''); setSuccess(''); }}
            className="btn-md btn-primary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New post
          </button>
        ) : (
          <button onClick={cancelForm} className="btn-md btn-secondary">
            ← Back to posts
          </button>
        )}
      </div>

      {/* Global notices */}
      {error   && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
      {success && <div className="mb-4 bg-sl-green-50 border border-sl-green-200 text-sl-green-700 text-sm px-4 py-3 rounded-xl">{success}</div>}

      {mode === 'list' ? (
        /* ── Posts table ─────────────────────────────────────────────────── */
        loading ? (
          <div className="text-center py-20 text-sl-slate-400 text-sm">Loading posts…</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-sl-slate-200 rounded-2xl">
            <p className="text-sl-slate-500 text-sm mb-4">No posts yet. Create your first article.</p>
            <button
              onClick={() => { setMode('create'); setForm(BLANK); }}
              className="btn-md btn-primary"
            >
              New post
            </button>
          </div>
        ) : (
          <div className="bg-white border border-sl-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sl-slate-100 bg-sl-slate-50 text-xs font-semibold text-sl-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Post</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Category</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sl-slate-100">
                {posts.map((p) => (
                  <tr key={p.id} className="hover:bg-sl-slate-50 transition-colors">
                    {/* Cover + title */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-10 rounded-lg bg-sl-slate-100 overflow-hidden flex-shrink-0">
                          {p.coverImage ? (
                            <img src={p.coverImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-sl-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sl-slate-900 line-clamp-1">{p.title}</p>
                          <p className="text-xs text-sl-slate-400 mt-0.5">{p.readTime}{p.featured ? ' · ⭐ Featured' : ''}</p>
                        </div>
                      </div>
                    </td>
                    {/* Category */}
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${CAT_COLOR[p.category] ?? 'text-sl-slate-600 bg-sl-slate-100'}`}>
                        {p.category}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                        p.published
                          ? 'bg-sl-green-50 text-sl-green-700 border-sl-green-200'
                          : 'bg-sl-slate-100 text-sl-slate-600 border-sl-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.published ? 'bg-sl-green-500' : 'bg-sl-slate-400'}`} />
                        {p.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    {/* Date */}
                    <td className="px-4 py-4 hidden lg:table-cell text-xs text-sl-slate-500">
                      {fmt(p.publishedAt ?? p.createdAt)}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.published && (
                          <a
                            href={`/news/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-sl-slate-500 hover:text-sl-slate-800 transition-colors px-2 py-1 rounded border border-sl-slate-200 hover:border-sl-slate-300"
                          >
                            View
                          </a>
                        )}
                        <button
                          onClick={() => openEdit(p)}
                          className="text-xs text-sl-slate-600 hover:text-sl-green-700 transition-colors px-2 py-1 rounded border border-sl-slate-200 hover:border-sl-green-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deleting === p.id}
                          className="text-xs text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded border border-red-100 hover:border-red-300 disabled:opacity-40"
                        >
                          {deleting === p.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* ── Create / Edit form ──────────────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: main form ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Cover image */}
            <div className="bg-white border border-sl-slate-200 rounded-2xl overflow-hidden">
              <div
                className="relative aspect-[16/7] bg-sl-slate-100 cursor-pointer group"
                onClick={() => fileRef.current?.click()}
              >
                {imgLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-sl-green-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : form.coverImage ? (
                  <>
                    <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-3 py-1.5 rounded-lg">
                        Change image
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 group-hover:bg-sl-slate-200 transition-colors">
                    <svg className="w-8 h-8 text-sl-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-sl-slate-500 font-medium">Click to add cover image</p>
                    <p className="text-xs text-sl-slate-400">JPG, PNG — recommended 1200×630px</p>
                  </div>
                )}
              </div>
              {form.coverImage && (
                <div className="px-4 py-2 border-t border-sl-slate-100 flex items-center justify-between">
                  <span className="text-xs text-sl-slate-400">Cover image added</span>
                  <button onClick={() => set('coverImage', '')} className="text-xs text-red-500 hover:text-red-700 transition-colors">
                    Remove
                  </button>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </div>

            {/* Title */}
            <div className="bg-white border border-sl-slate-200 rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-sl-slate-700 mb-1.5">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Write a compelling headline…"
                  className="w-full px-4 py-2.5 text-sm border border-sl-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sl-green-500 text-sl-slate-900 placeholder-sl-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-sl-slate-700 mb-1.5">
                  Slug
                  <span className="ml-2 font-normal text-sl-slate-400">used in the URL: /news/your-slug</span>
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="article-slug"
                  className="w-full px-4 py-2.5 text-sm border border-sl-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sl-green-500 font-mono text-sl-slate-700 placeholder-sl-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-sl-slate-700 mb-1.5">
                  Excerpt
                  <span className="ml-2 font-normal text-sl-slate-400">short summary shown on the news listing page</span>
                </label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => set('excerpt', e.target.value)}
                  rows={3}
                  placeholder="A concise summary that draws readers in (max 600 characters)…"
                  className="w-full px-4 py-2.5 text-sm border border-sl-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sl-green-500 text-sl-slate-900 placeholder-sl-slate-400 resize-y"
                />
                <p className="text-xs text-sl-slate-400 mt-1 text-right">{form.excerpt.length}/600</p>
              </div>
            </div>

            {/* Body */}
            <div className="bg-white border border-sl-slate-200 rounded-2xl p-5">
              <label className="block text-xs font-semibold text-sl-slate-700 mb-1.5">
                Article body
                <span className="ml-2 font-normal text-sl-slate-400">separate paragraphs with a blank line</span>
              </label>
              <textarea
                value={form.body}
                onChange={(e) => handleBodyChange(e.target.value)}
                rows={16}
                placeholder={`Write your first paragraph here.\n\nAdd a blank line to start a new paragraph.\n\nEach paragraph will display as a separate block in the published article.`}
                className="w-full px-4 py-3 text-sm border border-sl-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sl-green-500 text-sl-slate-900 placeholder-sl-slate-400 resize-y leading-relaxed"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-sl-slate-400">
                  {wordCount(form.body)} words · ~{form.readTime}
                </p>
                <p className="text-xs text-sl-slate-400">
                  {form.body.split(/\n\n+/).filter((p) => p.trim()).length} paragraph{form.body.split(/\n\n+/).filter((p) => p.trim()).length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* ── Right: settings sidebar ── */}
          <div className="space-y-4">

            {/* Publish actions */}
            <div className="bg-white border border-sl-slate-200 rounded-2xl p-5">
              <p className="text-xs font-semibold text-sl-slate-700 uppercase tracking-wide mb-4">Publish</p>
              <div className="space-y-2">
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="w-full btn-md btn-primary justify-center disabled:opacity-60"
                >
                  {saving ? 'Saving…' : mode === 'edit' ? 'Update & publish' : 'Publish now'}
                </button>
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="w-full btn-md btn-secondary justify-center disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save as draft'}
                </button>
                <button
                  onClick={cancelForm}
                  disabled={saving}
                  className="w-full text-sm text-sl-slate-500 hover:text-sl-slate-800 transition-colors py-2"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Category */}
            <div className="bg-white border border-sl-slate-200 rounded-2xl p-5">
              <label className="block text-xs font-semibold text-sl-slate-700 mb-3">Category</label>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => (
                  <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      value={cat}
                      checked={form.category === cat}
                      onChange={() => set('category', cat)}
                      className="accent-sl-green-600"
                    />
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${CAT_COLOR[cat] ?? 'text-sl-slate-600 bg-sl-slate-100'}`}>
                      {cat}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white border border-sl-slate-200 rounded-2xl p-5 space-y-4">
              <p className="text-xs font-semibold text-sl-slate-700 uppercase tracking-wide">Settings</p>

              {/* Featured */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`relative w-9 h-5 rounded-full transition-colors ${form.featured ? 'bg-sl-green-500' : 'bg-sl-slate-300'}`}
                  onClick={() => set('featured', !form.featured)}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.featured ? 'translate-x-4' : ''}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-sl-slate-900">Featured article</p>
                  <p className="text-xs text-sl-slate-400">Shown first on the news page</p>
                </div>
              </label>

              {/* Read time */}
              <div>
                <label className="block text-xs font-semibold text-sl-slate-700 mb-1.5">Read time</label>
                <input
                  type="text"
                  value={form.readTime}
                  onChange={(e) => set('readTime', e.target.value)}
                  placeholder="5 min read"
                  className="w-full px-3 py-2 text-sm border border-sl-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sl-green-500 text-sl-slate-700"
                />
                <p className="text-xs text-sl-slate-400 mt-1">Auto-calculated from word count</p>
              </div>
            </div>

            {/* Delete (edit mode) */}
            {mode === 'edit' && editId && (
              <div className="bg-white border border-red-100 rounded-2xl p-5">
                <p className="text-xs font-semibold text-sl-slate-700 uppercase tracking-wide mb-3">Danger zone</p>
                <button
                  onClick={() => handleDelete(editId)}
                  disabled={!!deleting}
                  className="w-full text-sm font-medium text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 rounded-lg py-2.5 transition-colors disabled:opacity-40"
                >
                  {deleting === editId ? 'Deleting…' : 'Delete this post'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
