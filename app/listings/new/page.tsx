'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ─── Constants ─────────────────────────────────────────── */

const LAGOS_AREAS = [
  'Ajah', 'Bariga', 'Chevron', 'Gbagada', 'Ikoyi',
  'Ikeja GRA', 'Ilupeju', 'Ketu', 'Lekki Phase 1', 'Lekki Phase 2',
  'Magodo', 'Maryland', 'Mende', 'Ogba', 'Ogudu',
  'Ojodu', 'Ojota', 'Oniru', 'Sangotedo', 'Shomolu',
  'Surulere', 'Victoria Island', 'Yaba',
];

const PROPERTY_TYPES = [
  { value: 'FLAT',      label: 'Flat / Apartment', icon: '🏢' },
  { value: 'DUPLEX',    label: 'Duplex',            icon: '🏠' },
  { value: 'ROOM',      label: 'Self-contain / Room', icon: '🛏' },
  { value: 'BUNGALOW',  label: 'Bungalow',          icon: '🏡' },
  { value: 'TERRACED',  label: 'Terraced House',    icon: '🏘' },
] as const;

const CATEGORIES = [
  {
    value: 'FOR_RENT',
    label: 'For Rent',
    desc: 'Annual or monthly tenancy',
    color: 'sl-green',
  },
  {
    value: 'FOR_SALE',
    label: 'For Sale',
    desc: 'Outright purchase',
    color: 'blue',
  },
  {
    value: 'SHORT_LET',
    label: 'Short Let',
    desc: 'Daily, weekly or monthly',
    color: 'purple',
  },
] as const;

const AMENITIES = [
  'Parking Space', 'Security (24/7)', 'Generator', 'Stable PHCN',
  'Borehole / Water', 'Serviced', 'Fully Furnished', 'Semi-Furnished',
  'Boys Quarters', 'Swimming Pool', 'Gym', 'Air Conditioning',
  'CCTV', 'Gated Estate', 'Elevator',
];

/* ─── Types ─────────────────────────────────────────────── */

type Category    = 'FOR_RENT' | 'FOR_SALE' | 'SHORT_LET' | '';
type PropType    = 'FLAT' | 'DUPLEX' | 'ROOM' | 'BUNGALOW' | 'TERRACED' | '';

interface ListingForm {
  category:              Category;
  propertyType:          PropType;
  title:                 string;
  description:           string;
  bedrooms:              number;
  bathrooms:             number;
  area:                  string;
  addressLine:           string;
  landmark:              string;
  photos:                File[];
  rentPerYear:           string;
  inspectionFee:         string;
  amenities:             string[];
  inspectionRefundable:  boolean | null;
}

const TOTAL_STEPS = 6;

/* ─── Step label map ────────────────────────────────────── */

const STEP_LABELS = [
  'Property Details',
  'Location',
  'Photos',
  'Pricing',
  'Amenities',
  'Review & Publish',
];

/* ─── Helpers ───────────────────────────────────────────── */

function formatNaira(val: string): string {
  const n = parseFloat(val.replace(/,/g, ''));
  if (isNaN(n)) return val;
  return n.toLocaleString('en-NG');
}

function parseMoney(val: string): number {
  return parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
}

/* ─── Success Screen ────────────────────────────────────── */

function SuccessScreen({ router }: { router: ReturnType<typeof useRouter> }) {
  const [count, setCount] = useState(3);
  useEffect(() => {
    const t = setInterval(() => {
      setCount((n) => {
        if (n <= 1) { clearInterval(t); router.push('/dashboard'); }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [router]);
  return (
    <div className="min-h-screen bg-sl-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-sl-green-100 rounded-2xl flex items-center
                         justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-sl-green-600" fill="none"
               stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-sl-slate-900 mb-2">
          Listing submitted!
        </h1>
        <p className="text-sm text-sl-slate-500 mb-6">
          Your listing has been received and will appear on your dashboard.
        </p>
        <p className="text-xs text-sl-slate-400">
          Redirecting to dashboard in {count}s…
        </p>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */

export default function NewListingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef  = useRef<HTMLDivElement>(null);

  const [step,        setStep]        = useState(1);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [done,        setDone]        = useState(false);
  const [dragOver,    setDragOver]    = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const [form, setForm] = useState<ListingForm>({
    category:             '',
    propertyType:         '',
    title:                '',
    description:          '',
    bedrooms:             1,
    bathrooms:            1,
    area:                 '',
    addressLine:          '',
    landmark:             '',
    photos:               [],
    rentPerYear:          '',
    inspectionFee:        '',
    amenities:            [],
    inspectionRefundable: null,
  });

  /* ── Photo helpers ── */
  function addFiles(files: FileList | null) {
    if (!files) return;
    const allowed = 15 - form.photos.length;
    const newFiles = Array.from(files).slice(0, allowed);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setForm((f) => ({ ...f, photos: [...f.photos, ...newFiles] }));
    setPhotoPreviews((p) => [...p, ...newPreviews]);
  }

  function removePhoto(idx: number) {
    URL.revokeObjectURL(photoPreviews[idx]);
    setForm((f) => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }));
    setPhotoPreviews((p) => p.filter((_, i) => i !== idx));
  }

  /* ── Amenity toggle ── */
  function toggleAmenity(a: string) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }));
  }

  /* ── Step validation ── */
  function validate(): string | null {
    if (step === 1) {
      if (!form.category)     return 'Please select a listing category.';
      if (!form.propertyType) return 'Please select a property type.';
      if (form.title.trim().length < 5)       return 'Title must be at least 5 characters.';
      if (form.description.trim().length < 20) return 'Description must be at least 20 characters.';
      if (form.bedrooms < 1)  return 'At least 1 bedroom is required.';
      if (form.bathrooms < 1) return 'At least 1 bathroom is required.';
    }
    if (step === 2) {
      if (!form.area)                         return 'Please select an area.';
      if (form.addressLine.trim().length < 5) return 'Please enter a street address (min 5 characters).';
    }
    if (step === 3) {
      if (form.photos.length < 4) return `Please upload at least 4 photos (${form.photos.length} added so far).`;
    }
    if (step === 4) {
      if (parseMoney(form.rentPerYear) <= 0)  return 'Please enter a valid annual price.';
      if (parseMoney(form.inspectionFee) <= 0) return 'Please enter a valid inspection fee.';
    }
    if (step === 6) {
      if (form.inspectionRefundable === null) return 'Please confirm the inspection fee policy.';
    }
    return null;
  }

  function next() {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function back() {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  }

  /* ── Submit ── */
  async function submit() {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');

      // Build photo URLs (blob:// in dev — will be real CDN URLs in production)
      const photoUrls = photoPreviews.length > 0
        ? photoPreviews
        : form.photos.map((f) => URL.createObjectURL(f));

      const amenityNote = form.amenities.length > 0
        ? `\n\nAmenities: ${form.amenities.join(', ')}`
        : '';

      const refundNote = form.inspectionRefundable !== null
        ? `\n\nInspection fee: ${form.inspectionRefundable ? 'Refundable' : 'Non-refundable'}`
        : '';

      const addressFull = form.landmark.trim()
        ? `${form.addressLine} (Near: ${form.landmark})`
        : form.addressLine;

      const payload = {
        category:     form.category,
        title:        form.title.trim(),
        description:  form.description.trim() + amenityNote + refundNote,
        propertyType: form.propertyType,
        bedrooms:     form.bedrooms,
        bathrooms:    form.bathrooms,
        addressLine:  addressFull,
        area:         form.area,
        city:         'Lagos',
        rentPerYear:  Math.round(parseMoney(form.rentPerYear) * 100),
        inspectionFee: Math.round(parseMoney(form.inspectionFee) * 100),
        photos:       photoUrls,
        photoHashes:  [],
        tier:         'BASIC',
      };

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        setError(typeof data.error === 'string' ? data.error : 'Submission failed. Please try again.');
        return;
      }
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (done) return <SuccessScreen router={router} />;

  const progress = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="min-h-screen bg-sl-slate-50">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-sl-slate-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/dashboard"
                className="flex items-center gap-1.5 text-sl-slate-400
                           hover:text-sl-slate-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-xs font-medium">Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-sl-slate-400">
              Step {step} of {TOTAL_STEPS}
            </span>
            <span className="text-xs font-semibold text-sl-slate-700">
              {STEP_LABELS[step - 1]}
            </span>
          </div>
          <div className="w-16 h-1.5 bg-sl-slate-100 rounded-full overflow-hidden">
            <div
              className="h-1.5 bg-sl-green-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Form area ── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* ════ STEP 1: Property Details ════ */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-sl-slate-900">Property details</h1>
              <p className="text-sm text-sl-slate-500 mt-1">
                Tell us about the property you{"'"}re listing.
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-sl-slate-700 mb-3">
                Listing category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => {
                  const sel = form.category === cat.value;
                  const colors: Record<string, string> = {
                    'sl-green': sel
                      ? 'border-sl-green-500 bg-sl-green-50 text-sl-green-700'
                      : 'border-sl-slate-200 bg-white text-sl-slate-700 hover:border-sl-green-300',
                    blue: sel
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-sl-slate-200 bg-white text-sl-slate-700 hover:border-blue-300',
                    purple: sel
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-sl-slate-200 bg-white text-sl-slate-700 hover:border-purple-300',
                  };
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                      className={`border-2 rounded-xl px-3 py-4 text-left transition-all ${colors[cat.color]}`}
                    >
                      <p className="font-semibold text-sm">{cat.label}</p>
                      <p className="text-xs mt-0.5 opacity-70">{cat.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Property type */}
            <div>
              <label className="block text-sm font-semibold text-sl-slate-700 mb-3">
                Property type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PROPERTY_TYPES.map((pt, i) => {
                  const sel = form.propertyType === pt.value;
                  const isLastOdd = i === PROPERTY_TYPES.length - 1 && PROPERTY_TYPES.length % 2 !== 0;
                  return (
                    <button
                      key={pt.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, propertyType: pt.value }))}
                      className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3
                                  transition-all text-left ${isLastOdd ? 'col-span-2 sm:col-span-1' : ''} ${
                        sel
                          ? 'border-sl-green-500 bg-sl-green-50'
                          : 'border-sl-slate-200 bg-white hover:border-sl-green-300'
                      }`}
                    >
                      <span className="text-xl">{pt.icon}</span>
                      <span className={`text-sm font-medium ${sel ? 'text-sl-green-700' : 'text-sl-slate-700'}`}>
                        {pt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Beds & Baths */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Bedrooms', key: 'bedrooms' as const },
                { label: 'Bathrooms', key: 'bathrooms' as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-sl-slate-700 mb-2">
                    {label} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, [key]: Math.max(0, f[key] - 1) }))}
                      className="w-9 h-9 rounded-lg border border-sl-slate-200 bg-white
                                 flex items-center justify-center text-sl-slate-600
                                 hover:border-sl-green-300 transition-colors font-semibold"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-bold text-sl-slate-900">
                      {form[key]}
                    </span>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, [key]: Math.min(20, f[key] + 1) }))}
                      className="w-9 h-9 rounded-lg border border-sl-slate-200 bg-white
                                 flex items-center justify-center text-sl-slate-600
                                 hover:border-sl-green-300 transition-colors font-semibold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-sl-slate-700 mb-1.5">
                Listing title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={200}
                placeholder="e.g. Spacious 3-bedroom flat in Lekki Phase 1"
                className="w-full border border-sl-slate-200 rounded-xl px-4 py-3 text-sm
                           text-sl-slate-900 placeholder-sl-slate-400 focus:outline-none
                           focus:ring-2 focus:ring-sl-green-500 focus:border-transparent"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
              <p className="text-xs text-sl-slate-400 mt-1 text-right">
                {form.title.length} / 200
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-sl-slate-700 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                maxLength={2000}
                placeholder="Describe the property — layout, condition, neighbourhood, what makes it stand out…"
                className="w-full border border-sl-slate-200 rounded-xl px-4 py-3 text-sm
                           text-sl-slate-900 placeholder-sl-slate-400 focus:outline-none
                           focus:ring-2 focus:ring-sl-green-500 focus:border-transparent resize-none"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <p className="text-xs text-sl-slate-400 mt-1 text-right">
                {form.description.length} / 2000
              </p>
            </div>
          </div>
        )}

        {/* ════ STEP 2: Location ════ */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-sl-slate-900">Location</h1>
              <p className="text-sm text-sl-slate-500 mt-1">
                Where is the property located in Lagos?
              </p>
            </div>

            {/* Area */}
            <div>
              <label className="block text-sm font-semibold text-sl-slate-700 mb-1.5">
                Area / Neighbourhood <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border border-sl-slate-200 rounded-xl px-4 py-3 text-sm
                           text-sl-slate-900 bg-white focus:outline-none focus:ring-2
                           focus:ring-sl-green-500 focus:border-transparent"
                value={form.area}
                onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              >
                <option value="">Select area…</option>
                {LAGOS_AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Street address */}
            <div>
              <label className="block text-sm font-semibold text-sl-slate-700 mb-1.5">
                Street address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={300}
                placeholder="e.g. 12 Admiralty Way"
                className="w-full border border-sl-slate-200 rounded-xl px-4 py-3 text-sm
                           text-sl-slate-900 placeholder-sl-slate-400 focus:outline-none
                           focus:ring-2 focus:ring-sl-green-500 focus:border-transparent"
                value={form.addressLine}
                onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))}
              />
            </div>

            {/* Landmark */}
            <div>
              <label className="block text-sm font-semibold text-sl-slate-700 mb-1.5">
                Nearest landmark
                <span className="text-sl-slate-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                type="text"
                maxLength={200}
                placeholder="e.g. Opposite Shoprite, Near Lekki Toll Gate"
                className="w-full border border-sl-slate-200 rounded-xl px-4 py-3 text-sm
                           text-sl-slate-900 placeholder-sl-slate-400 focus:outline-none
                           focus:ring-2 focus:ring-sl-green-500 focus:border-transparent"
                value={form.landmark}
                onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))}
              />
              <p className="text-xs text-sl-slate-400 mt-1">
                Helps renters find the property more easily.
              </p>
            </div>

            {/* City lock */}
            <div className="flex items-center gap-3 bg-sl-slate-50 border border-sl-slate-200
                             rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-sl-slate-400 flex-shrink-0" fill="none"
                   stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-xs text-sl-slate-500">
                SureLeads is currently Lagos-only. City is set to <strong>Lagos</strong>.
              </p>
            </div>
          </div>
        )}

        {/* ════ STEP 3: Photos ════ */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-sl-slate-900">Photos</h1>
              <p className="text-sm text-sl-slate-500 mt-1">
                Upload clear photos of the property. Minimum 4, up to 15.
              </p>
            </div>

            {/* Drop zone */}
            <div
              ref={dropZoneRef}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                addFiles(e.dataTransfer.files);
              }}
              className={`border-2 border-dashed rounded-2xl px-6 py-10 text-center cursor-pointer
                          transition-colors ${
                dragOver
                  ? 'border-sl-green-400 bg-sl-green-50'
                  : 'border-sl-slate-300 bg-white hover:border-sl-green-300 hover:bg-sl-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
              <svg className="w-10 h-10 text-sl-slate-300 mx-auto mb-3" fill="none"
                   stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-semibold text-sl-slate-700 mb-1">
                {dragOver ? 'Drop photos here' : 'Click or drag photos here'}
              </p>
              <p className="text-xs text-sl-slate-400">
                JPG, PNG or WEBP · Max 5 MB each
              </p>
            </div>

            {/* Counter */}
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${
                form.photos.length >= 4 ? 'text-sl-green-600' : 'text-sl-slate-400'
              }`}>
                {form.photos.length} / 15 photos
                {form.photos.length < 4 && (
                  <span className="text-xs font-normal text-sl-slate-400 ml-1">
                    ({4 - form.photos.length} more required)
                  </span>
                )}
              </span>
              {form.photos.length > 0 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-sl-green-600 hover:underline"
                >
                  + Add more
                </button>
              )}
            </div>

            {/* Photo grid */}
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden
                                           bg-sl-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Photo ${i + 1}`}
                         className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-xs bg-sl-green-600
                                        text-white px-1.5 py-0.5 rounded-md font-medium">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80
                                  text-white rounded-full text-xs flex items-center justify-center
                                  opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ STEP 4: Pricing ════ */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-sl-slate-900">Pricing & fees</h1>
              <p className="text-sm text-sl-slate-500 mt-1">
                Enter amounts in Naira (₦). We{"'"}ll handle the conversion.
              </p>
            </div>

            {/* Annual rent */}
            <div>
              <label className="block text-sm font-semibold text-sl-slate-700 mb-1.5">
                {form.category === 'FOR_SALE' ? 'Sale price' : 'Annual rent'}
                {' '}<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm
                                  font-semibold text-sl-slate-500">
                  ₦
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  className="w-full border border-sl-slate-200 rounded-xl pl-8 pr-4 py-3
                             text-sm text-sl-slate-900 placeholder-sl-slate-400 focus:outline-none
                             focus:ring-2 focus:ring-sl-green-500 focus:border-transparent"
                  value={form.rentPerYear}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, rentPerYear: e.target.value.replace(/[^0-9]/g, '') }))
                  }
                />
              </div>
              {parseMoney(form.rentPerYear) > 0 && (
                <p className="text-xs text-sl-slate-500 mt-1">
                  ₦{formatNaira(form.rentPerYear)}
                  {form.category === 'FOR_RENT' && ' per year'}
                </p>
              )}
            </div>

            {/* Inspection fee */}
            <div>
              <label className="block text-sm font-semibold text-sl-slate-700 mb-1.5">
                Inspection fee <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm
                                  font-semibold text-sl-slate-500">
                  ₦
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  className="w-full border border-sl-slate-200 rounded-xl pl-8 pr-4 py-3
                             text-sm text-sl-slate-900 placeholder-sl-slate-400 focus:outline-none
                             focus:ring-2 focus:ring-sl-green-500 focus:border-transparent"
                  value={form.inspectionFee}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, inspectionFee: e.target.value.replace(/[^0-9]/g, '') }))
                  }
                />
              </div>
              {parseMoney(form.inspectionFee) > 0 && (
                <p className="text-xs text-sl-slate-500 mt-1">
                  ₦{formatNaira(form.inspectionFee)}
                </p>
              )}
              <p className="text-xs text-sl-slate-400 mt-1.5">
                Fee charged to prospective tenants to book an inspection.
                You{"'"}ll confirm whether it{"'"}s refundable on the next step.
              </p>
            </div>

            {/* Price guidance */}
            <div className="bg-sl-green-50 border border-sl-green-200 rounded-xl px-4 py-3">
              <p className="text-xs text-sl-green-700 leading-relaxed">
                <span className="font-semibold">Pricing tip:</span> Use SureLeads{' '}
                <Link href="/price-insights" className="underline hover:text-sl-green-900">
                  Price Insights
                </Link>{' '}
                to see median rents for your area.
              </p>
            </div>
          </div>
        )}

        {/* ════ STEP 5: Amenities ════ */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-sl-slate-900">Amenities</h1>
              <p className="text-sm text-sl-slate-500 mt-1">
                Select all features available at this property.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => {
                const sel = form.amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      sel
                        ? 'bg-sl-green-50 border-sl-green-300 text-sl-green-700'
                        : 'bg-white border-sl-slate-200 text-sl-slate-600 hover:border-sl-green-300'
                    }`}
                  >
                    {sel && <span className="mr-1.5">✓</span>}{a}
                  </button>
                );
              })}
            </div>

            {form.amenities.length > 0 && (
              <p className="text-xs text-sl-slate-400">
                {form.amenities.length} amenit{form.amenities.length !== 1 ? 'ies' : 'y'} selected
              </p>
            )}
          </div>
        )}

        {/* ════ STEP 6: Review & Publish ════ */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-sl-slate-900">Review & publish</h1>
              <p className="text-sm text-sl-slate-500 mt-1">
                Check everything before your listing goes live.
              </p>
            </div>

            {/* Summary card */}
            <div className="bg-white border border-sl-slate-200 rounded-2xl overflow-hidden">

              {/* Photos strip */}
              {photoPreviews.length > 0 && (
                <div className="flex gap-1 p-3 overflow-x-auto">
                  {photoPreviews.slice(0, 5).map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt=""
                         className="w-24 h-16 object-cover rounded-lg flex-shrink-0" />
                  ))}
                  {photoPreviews.length > 5 && (
                    <div className="w-24 h-16 rounded-lg bg-sl-slate-100 flex items-center
                                     justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-sl-slate-500">
                        +{photoPreviews.length - 5}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="px-5 py-4 space-y-4 border-t border-sl-slate-100">

                {/* Category + Type badges */}
                <div className="flex flex-wrap gap-2">
                  {form.category && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold
                                      bg-sl-green-50 text-sl-green-700 border border-sl-green-200">
                      {form.category === 'FOR_RENT' ? 'For Rent' :
                       form.category === 'FOR_SALE' ? 'For Sale' : 'Short Let'}
                    </span>
                  )}
                  {form.propertyType && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold
                                      bg-sl-slate-100 text-sl-slate-600 border border-sl-slate-200">
                      {PROPERTY_TYPES.find((p) => p.value === form.propertyType)?.label}
                    </span>
                  )}
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold
                                    bg-sl-slate-100 text-sl-slate-600 border border-sl-slate-200">
                    {form.bedrooms} bed · {form.bathrooms} bath
                  </span>
                </div>

                <div>
                  <p className="text-xs text-sl-slate-400 mb-0.5">Title</p>
                  <p className="text-sm font-semibold text-sl-slate-900">{form.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-sl-slate-400 mb-0.5">Location</p>
                    <p className="text-sm text-sl-slate-700">
                      {form.area}, Lagos
                    </p>
                    <p className="text-xs text-sl-slate-500 mt-0.5 line-clamp-1">
                      {form.addressLine}
                      {form.landmark && ` · Near ${form.landmark}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-sl-slate-400 mb-0.5">
                      {form.category === 'FOR_SALE' ? 'Sale price' : 'Annual rent'}
                    </p>
                    <p className="text-sm font-bold text-sl-green-600">
                      ₦{formatNaira(form.rentPerYear)}
                    </p>
                    <p className="text-xs text-sl-slate-500 mt-0.5">
                      Inspection fee: ₦{formatNaira(form.inspectionFee)}
                    </p>
                  </div>
                </div>

                {form.amenities.length > 0 && (
                  <div>
                    <p className="text-xs text-sl-slate-400 mb-1.5">Amenities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.amenities.map((a) => (
                        <span key={a}
                              className="text-xs px-2 py-0.5 bg-sl-slate-100
                                          text-sl-slate-600 rounded-md">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-sl-slate-400 mb-0.5">Photos</p>
                  <p className="text-sm text-sl-slate-700">{form.photos.length} photos uploaded</p>
                </div>

              </div>
            </div>

            {/* Inspection fee disclosure */}
            <div className="bg-white border border-sl-slate-200 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-sl-slate-900 mb-3">
                Inspection fee disclosure <span className="text-red-500">*</span>
              </h3>
              <p className="text-xs text-sl-slate-500 mb-4 leading-relaxed">
                Is the inspection fee of{' '}
                <strong>₦{formatNaira(form.inspectionFee)}</strong>{' '}
                refundable if the tenant does not proceed?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, inspectionRefundable: true }))}
                  className={`border-2 rounded-xl px-4 py-3 text-center transition-all ${
                    form.inspectionRefundable === true
                      ? 'border-sl-green-500 bg-sl-green-50'
                      : 'border-sl-slate-200 bg-white hover:border-sl-green-300'
                  }`}
                >
                  <p className={`text-sm font-semibold ${
                    form.inspectionRefundable === true ? 'text-sl-green-700' : 'text-sl-slate-700'
                  }`}>
                    Refundable
                  </p>
                  <p className="text-xs text-sl-slate-400 mt-0.5">
                    Returned if no deal
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, inspectionRefundable: false }))}
                  className={`border-2 rounded-xl px-4 py-3 text-center transition-all ${
                    form.inspectionRefundable === false
                      ? 'border-sl-slate-700 bg-sl-slate-50'
                      : 'border-sl-slate-200 bg-white hover:border-sl-slate-400'
                  }`}
                >
                  <p className={`text-sm font-semibold ${
                    form.inspectionRefundable === false ? 'text-sl-slate-800' : 'text-sl-slate-700'
                  }`}>
                    Non-refundable
                  </p>
                  <p className="text-xs text-sl-slate-400 mt-0.5">
                    Kept regardless
                  </p>
                </button>
              </div>
            </div>

            {/* Edit links */}
            <div className="flex flex-wrap gap-3">
              {['Details', 'Location', 'Photos', 'Pricing', 'Amenities'].map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => { setError(''); setStep(i + 1); }}
                  className="text-xs text-sl-slate-500 hover:text-sl-green-600 underline
                               transition-colors"
                >
                  Edit {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm
                           px-4 py-3 rounded-xl leading-relaxed">
            {error}
          </div>
        )}

        {/* ── Navigation ── */}
        <div className={`mt-8 flex ${step > 1 ? 'justify-between' : 'justify-end'}`}>
          {step > 1 && (
            <button
              type="button"
              onClick={back}
              className="btn-md btn-secondary"
            >
              ← Back
            </button>
          )}

          {step < TOTAL_STEPS ? (
            <button type="button" onClick={next} className="btn-md btn-primary">
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="btn-md btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Publishing…' : 'Publish listing →'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
