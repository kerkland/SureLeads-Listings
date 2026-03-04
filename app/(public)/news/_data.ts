export interface Article {
  slug: string;
  category: string;
  categoryColor: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  featured: boolean;
  body: string[];
}

export const ARTICLES: Article[] = [
  {
    slug: 'lekki-rental-market-q1-2026',
    category: 'Market Report',
    categoryColor: 'text-sl-green-600 bg-sl-green-50',
    title: 'Lekki rental market holds steady in Q1 2026 despite inflation pressure',
    excerpt:
      "Despite broad economic headwinds, verified rental data from SureLeads shows median rents in Lekki Phase 1 rose just 4.2% year-on-year — well below general inflation. Here's what's driving the stability.",
    date: 'Feb 28, 2026',
    readTime: '5 min read',
    featured: true,
    body: [
      "The Lekki Phase 1 rental market has surprised many analysts in the first quarter of 2026. While Nigeria's headline inflation rate remains elevated at around 30%, median annual rents in Lekki Phase 1 rose by just 4.2% year-on-year according to SureLeads verified listing data — a significantly smaller increase than previous years.",
      'The key driver appears to be supply. A wave of new estate completions along the Lekki corridor over the past 18 months has added roughly 2,400 residential units to the market, providing renters with more choices and softening landlord pricing power.',
      'One-bedroom flats remain the most stable segment. Median annual rent sits at ₦2.1M, up from ₦2.0M in Q1 2025. Two-bedroom apartments have seen slightly more movement, moving from ₦3.4M to ₦3.6M at the median — a 5.9% rise. Three-bedroom flats continue to see the widest spread, ranging from ₦5.5M to ₦9.5M depending on estate quality and floor level.',
      'The verified reconfirmation data tells a particularly interesting story. Properties that have been consistently reconfirmed week-over-week are commanding a 6–8% premium compared to listings with gaps in their reconfirmation history. Renters are clearly beginning to associate listing consistency with agent professionalism — and paying for it.',
      'Outlook for Q2 and beyond: our data suggests the supply pipeline will continue to moderate price growth in Phase 1. However, the outer Lekki corridor — particularly Chevron and Sangotedo — is seeing stronger demand pressure. Expect those areas to outperform Phase 1 in percentage rent growth through mid-2026.',
    ],
  },
  {
    slug: 'victoria-island-prices-rising',
    category: 'Price Trends',
    categoryColor: 'text-blue-600 bg-blue-50',
    title: 'Victoria Island rents climb 11% as demand from multinationals grows',
    excerpt:
      "Demand for short-let and long-term lets on Victoria Island is outpacing supply. Our data shows P75 rents are now above ₦7M/yr for 2-bedroom flats.",
    date: 'Feb 20, 2026',
    readTime: '4 min read',
    featured: false,
    body: [
      "Victoria Island has emerged as Lagos's tightest rental market in early 2026. Verified listings data from SureLeads shows median annual rents for 2-bedroom flats hitting ₦5.8M — an 11% jump from the same period last year — while the upper quartile (P75) has crossed ₦7M per annum for the first time.",
      "The primary driver is an uptick in demand from multinationals and senior professionals relocating to Lagos. Several large financial institutions and tech firms have established or expanded Lagos offices in the past 12 months, generating consistent demand for high-quality furnished and semi-furnished accommodation within 15 minutes of key business districts.",
      "Supply on VI has not kept pace. The island's geography limits development density, and most premium buildings completed in the past 3 years have been absorbed into the short-let market, which commands a further 20–35% premium. This has created a squeeze in the traditional long-term rental segment.",
      'For renters priced out of Victoria Island, Ikoyi remains the closest viable alternative — with median 2-bedroom rents at ₦4.8M, though those too have risen 9% year-on-year. Properties in gated estates with 24/7 power and security are particularly sought-after and typically transact within days of being listed.',
      "Agents operating in this corridor report average time-to-let of under 8 days for correctly priced properties — the shortest we've recorded across all Lagos zones. Landlords who price above market by 15%+ are seeing their properties sit for 4–6 weeks, a meaningful carrying cost in a high-inflation environment.",
    ],
  },
  {
    slug: 'surulere-yaba-affordable-hotspots',
    category: 'Area Guide',
    categoryColor: 'text-purple-600 bg-purple-50',
    title: "Surulere and Yaba: Lagos mainland's most underrated rental hotspots in 2026",
    excerpt:
      'With median rents under ₦1.5M and improving infrastructure, mainland neighbourhoods are attracting a new wave of renters priced out of the Island.',
    date: 'Feb 12, 2026',
    readTime: '6 min read',
    featured: false,
    body: [
      "Ask most Lagos renters about the best value neighbourhoods and you'll hear Surulere and Yaba mentioned consistently. Both areas are seeing a notable influx of young professionals and remote workers who are trading island proximity for affordability and community — and the data backs it up.",
      "In Surulere, median annual rent for a self-contained (bedsitter) unit sits at ₦400K–₦550K. One-bedroom flats range from ₦600K to ₦950K annually, and 2-bedroom apartments are available from ₦1.1M to ₦1.8M depending on the street and building age. These figures represent a modest 3–5% year-on-year increase — well below inflation.",
      "Yaba tells a similar story, with the added pull of being Lagos's tech hub. Proximity to Yabacon Valley — the cluster of tech startups, co-working spaces, and innovation hubs around Herbert Macaulay Way — has made the area increasingly attractive to the startup community. One-bedroom flats in Yaba start at ₦700K/year, while 2-bedrooms average ₦1.3M. Notably, properties near the University of Lagos command a slight premium due to consistent demand from academic staff.",
      'Infrastructure is improving. The ongoing Eko Bridge and Third Mainland Bridge rehabilitation has had some short-term disruption impact, but the longer-term outlook for mainland connectivity to the Island is positive. Several new Bolt and Uber routes from Surulere to Lekki now take under 35 minutes in off-peak traffic.',
      'For investors and landlords, both areas offer yields that are hard to match on the Island. With purchase prices still relatively moderate and rental demand strengthening, gross yields of 8–11% are achievable — compared to 4–6% in Lekki Phase 1 and Victoria Island. The catch: tenant quality vetting is more variable, making agent selection critical.',
    ],
  },
  {
    slug: 'how-credibility-scores-work',
    category: 'Platform',
    categoryColor: 'text-sl-gold-700 bg-sl-gold-50',
    title: 'How SureLeads credibility scores actually work — and why they matter',
    excerpt:
      'Our agent scoring algorithm weighs inspection response rate, review history, and weekly reconfirmation compliance. Here\'s the full breakdown.',
    date: 'Feb 5, 2026',
    readTime: '7 min read',
    featured: false,
    body: [
      "Every agent on SureLeads has a public credibility score — a number between 0 and 1,000 that summarises their track record on the platform. We built this score because we believe renters deserve a single, trustworthy signal about who they're dealing with — not a pile of unverified claims. Here's exactly how it's calculated.",
      "The score is made up of four weighted components. Reconfirmation compliance accounts for 35% of the total. Agents must confirm each active listing every 7 days. Missing a reconfirmation window lowers the score; consistent weekly compliance raises it. This is the biggest single factor because it's the most operationally demanding — and the most directly linked to listing accuracy.",
      'Inspection response rate contributes 30%. When a renter books an inspection through the platform, agents are expected to respond within 24 hours. Agents who respond promptly and complete the scheduled inspections see a material score uplift. No-shows and late cancellations without renter notification are penalised.',
      "Review score (25%) is a weighted average of renter reviews received over the trailing 12 months. More recent reviews are weighted more heavily than older ones. A single poor review won't crater a score, but a consistent pattern of 2–3 star reviews will move the needle significantly downward.",
      'The remaining 10% comes from platform-verified credentials: CAC registration, valid ID verification, and professional certifications (e.g., NIESV membership). These are binary — you either have them or you don\'t.',
      'Scores are updated weekly, not in real time. This is intentional: it prevents gaming through burst-activity and rewards sustained, consistent behaviour. The floor is 0 and the ceiling is 1,000. New agents start at 500 — a neutral baseline — and earn or lose points with every interaction. Agents with scores above 800 are displayed with an "Excellent" badge; above 650 earns "Good"; below 650 displays "Building."',
    ],
  },
  {
    slug: 'avoid-ghost-properties-lagos',
    category: 'Renter Guide',
    categoryColor: 'text-red-600 bg-red-50',
    title: '5 red flags that tell you a Lagos listing is a ghost property',
    excerpt:
      "From recycled photos to vague addresses, ghost properties are common on unverified platforms. Here's how to spot them — and why they don't exist on SureLeads.",
    date: 'Jan 29, 2026',
    readTime: '4 min read',
    featured: false,
    body: [
      "Ghost properties — listings that don't exist, are already let, or are wildly misrepresented — are one of the biggest frustrations in the Lagos rental market. Estimates suggest that on unverified platforms, up to 40% of listings have some form of misrepresentation. Here are five warning signs to watch for.",
      "Red flag 1: The rent is suspiciously below market. If a 2-bedroom flat in Lekki is listed at ₦800K per year and every other verified listing in the area is at ₦2M+, it's almost certainly either a ghost property or bait-and-switch. Scammers use below-market pricing to generate a flood of inquiries, then claim \"it's just been let\" or demand an upfront \"inspection fee\" to see it.",
      'Red flag 2: The photos are stock images or recycled from other listings. A reverse image search (drag the photo into Google Images) takes 10 seconds and frequently reveals images pulled from other cities — or even other countries. Legitimate landlords and agents photograph the actual property.',
      'Red flag 3: The agent is reluctant to arrange an in-person inspection. Every genuine property can be viewed in person. Any agent who pushes for payment before a physical inspection, or keeps delaying viewings with vague excuses, should be avoided entirely.',
      'Red flag 4: The address is vague or unverifiable. "Lekki Phase 1, off Admiralty Way" is not a full address. Legitimate listings should include a street name and estate name at minimum — enough to confirm the location on Google Maps before you waste time travelling.',
      "Red flag 5: The listing has been up for months without any changes. Active, available properties move. If a listing has been sitting unchanged on a platform for 3–6 months, it's either already let, not actually available, or the agent has abandoned it. On SureLeads, listings that aren't reconfirmed within 7 days are automatically deactivated — so every live listing you see has been confirmed available this week.",
    ],
  },
  {
    slug: 'ajah-chevron-expansion',
    category: 'Area Guide',
    categoryColor: 'text-purple-600 bg-purple-50',
    title: "Ajah to Chevron: The Lekki corridor's fastest-growing rental belt",
    excerpt:
      'Infrastructure investment and new estate completions are making the outer Lekki corridor a serious alternative to Phase 1 and VI — at 40% lower rents.',
    date: 'Jan 22, 2026',
    readTime: '5 min read',
    featured: false,
    body: [
      "Five years ago, Ajah was considered too far out for most Lagos renters who worked on the Island. Today it's one of the fastest-growing rental zones in the state — and the data shows it. Active listings in the Ajah–Chevron–Sangotedo belt have grown 34% on SureLeads over the past 12 months, outpacing every other zone.",
      "The key catalyst is the Lekki–Epe Expressway corridor improvements and the growing cluster of residential estates in the Chevron and Sangotedo areas. Developers have delivered thousands of units of varying price points — from affordable 1-bedroom apartments at ₦900K per year to premium 4-bedroom townhouses at ₦8M+. This range has made the corridor attractive to a diverse renter base.",
      'Ajah itself remains the most affordable entry point. Median rents for 2-bedroom flats sit at ₦1.4M annually — approximately 40% below comparable units in Lekki Phase 1. For renters comfortable with the commute (typically 25–40 minutes to VI in off-peak traffic), the value proposition is significant.',
      'Chevron and Osapa London command slightly higher rents but offer more established estate infrastructure — steady power supply, security, and amenities. Median 2-bedroom rents in these micro-areas sit at ₦2.0M–₦2.5M annually. Sangotedo, the outer reach of the corridor, remains the most affordable option and is seeing the sharpest growth in new estate completions.',
      "Our agent credibility data shows that the Lekki corridor has some of the highest average agent scores on the platform — a reflection of the more formalised estate management structure in the area. If you're looking to relocate from the mainland to a coastal neighbourhood without paying Phase 1 prices, the Ajah–Chevron belt deserves serious consideration.",
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
