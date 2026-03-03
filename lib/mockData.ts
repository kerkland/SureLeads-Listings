/**
 * Mock listings used for UI preview when no database is connected.
 * Each entry satisfies both ListingCard props and the listing detail shape.
 */

export interface MockListing {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  addressLine: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
  rentPerYear: string;   // kobo as string
  inspectionFee: string; // kobo as string
  photos: string[];
  status: string;
  isCrossPostFlagged: boolean;
  viewsCount: number;
  avgRating: number | null;
  agent: {
    id: string;
    fullName: string;
    agentProfile: {
      agencyName: string;
      profilePhoto: null;
      reputationScore: number;
      isVerifiedBadge: boolean;
      city: string;
      bio: string;
    };
  };
}

export const MOCK_LISTINGS: MockListing[] = [
  {
    id: 'mock-1',
    title: 'Spacious 3-Bedroom Flat in Lekki Phase 1',
    description:
      'A beautifully finished 3-bedroom flat with a fitted kitchen, en-suite master bedroom, 24-hour power supply, and secure estate access. Located minutes from the Lekki-Epe Expressway and major shopping centres. Perfect for families and professionals.',
    propertyType: 'FLAT',
    bedrooms: 3,
    bathrooms: 2,
    addressLine: '14 Admiralty Way, Lekki Phase 1',
    area: 'Lekki Phase 1',
    city: 'Lagos',
    latitude: 6.4281,
    longitude: 3.4219,
    rentPerYear: '320000000',   // ₦3,200,000
    inspectionFee: '5000000',   // ₦50,000
    photos: ['https://picsum.photos/seed/prop1/800/500'],
    status: 'AVAILABLE',
    isCrossPostFlagged: false,
    viewsCount: 142,
    avgRating: 4.6,
    agent: {
      id: 'agent-1',
      fullName: 'Chidi Okeke',
      agentProfile: {
        agencyName: 'Okeke Properties',
        profilePhoto: null,
        reputationScore: 820,
        isVerifiedBadge: true,
        city: 'Lagos',
        bio: 'Specialising in Lekki and Victoria Island properties for over 8 years. 200+ successful lettings.',
      },
    },
  },
  {
    id: 'mock-2',
    title: 'Modern 4-Bedroom Duplex in Ikeja GRA',
    description:
      'Exquisite 4-bedroom semi-detached duplex in the prestigious Ikeja GRA. Features a large living area, American kitchen, BQ, 2-car garage, and a well-maintained compound. Generator included.',
    propertyType: 'DUPLEX',
    bedrooms: 4,
    bathrooms: 3,
    addressLine: '7 Isaac John Street, Ikeja GRA',
    area: 'Ikeja GRA',
    city: 'Lagos',
    latitude: 6.5958,
    longitude: 3.3438,
    rentPerYear: '550000000',   // ₦5,500,000
    inspectionFee: '8000000',   // ₦80,000
    photos: ['https://picsum.photos/seed/prop2/800/500'],
    status: 'AVAILABLE',
    isCrossPostFlagged: false,
    viewsCount: 89,
    avgRating: 4.8,
    agent: {
      id: 'agent-2',
      fullName: 'Amaka Eze',
      agentProfile: {
        agencyName: 'Eze Homes',
        profilePhoto: null,
        reputationScore: 910,
        isVerifiedBadge: true,
        city: 'Lagos',
        bio: 'Award-winning agent with 12 years of experience across mainland and island Lagos.',
      },
    },
  },
  {
    id: 'mock-3',
    title: 'Self-Contained Room in Surulere',
    description:
      'A clean, newly renovated self-contained room with a private bathroom, wardrobe, and tiled floors. Borehole water, pre-paid electricity meter, and secure compound with CCTV. Great for young professionals.',
    propertyType: 'ROOM',
    bedrooms: 1,
    bathrooms: 1,
    addressLine: '22 Ogunlana Drive, Surulere',
    area: 'Surulere',
    city: 'Lagos',
    latitude: 6.5021,
    longitude: 3.3543,
    rentPerYear: '36000000',    // ₦360,000
    inspectionFee: '1500000',   // ₦15,000
    photos: ['https://picsum.photos/seed/prop3/800/500'],
    status: 'AVAILABLE',
    isCrossPostFlagged: false,
    viewsCount: 231,
    avgRating: 4.1,
    agent: {
      id: 'agent-3',
      fullName: 'Tunde Adeyemi',
      agentProfile: {
        agencyName: 'Adeyemi Realty',
        profilePhoto: null,
        reputationScore: 650,
        isVerifiedBadge: false,
        city: 'Lagos',
        bio: 'Focused on affordable Lagos mainland properties. Fast, transparent, and reliable.',
      },
    },
  },
  {
    id: 'mock-4',
    title: '2-Bedroom Flat in Yaba',
    description:
      'Tastefully finished 2-bedroom flat in the heart of Yaba. Tiled floors, fitted kitchen, pre-paid meter, borehole water, and 24-hour security. Close to UNILAG, tech hubs, and the rail station.',
    propertyType: 'FLAT',
    bedrooms: 2,
    bathrooms: 2,
    addressLine: '11 Herbert Macaulay Way, Yaba',
    area: 'Yaba',
    city: 'Lagos',
    latitude: 6.5095,
    longitude: 3.3711,
    rentPerYear: '120000000',   // ₦1,200,000
    inspectionFee: '2000000',   // ₦20,000
    photos: ['https://picsum.photos/seed/prop4/800/500'],
    status: 'AVAILABLE',
    isCrossPostFlagged: false,
    viewsCount: 76,
    avgRating: 4.3,
    agent: {
      id: 'agent-4',
      fullName: 'Seun Balogun',
      agentProfile: {
        agencyName: 'Mainland Realty',
        profilePhoto: null,
        reputationScore: 740,
        isVerifiedBadge: true,
        city: 'Lagos',
        bio: 'Mainland Lagos specialist — Yaba, Surulere, and Gbagada. Fast viewings, no ghost listings.',
      },
    },
  },
  {
    id: 'mock-5',
    title: '3-Bedroom Flat in Gbagada Phase 2',
    description:
      'Spacious 3-bedroom flat in a serene Gbagada Phase 2 estate. Features an American kitchen, large living room, BQ, and ample parking. Generator and borehole included.',
    propertyType: 'FLAT',
    bedrooms: 3,
    bathrooms: 2,
    addressLine: '4 Phase 2 Estate Road, Gbagada',
    area: 'Gbagada',
    city: 'Lagos',
    latitude: 6.5565,
    longitude: 3.3841,
    rentPerYear: '200000000',   // ₦2,000,000
    inspectionFee: '3000000',   // ₦30,000
    photos: ['https://picsum.photos/seed/prop5/800/500'],
    status: 'AVAILABLE',
    isCrossPostFlagged: false,
    viewsCount: 104,
    avgRating: 4.4,
    agent: {
      id: 'agent-4',
      fullName: 'Seun Balogun',
      agentProfile: {
        agencyName: 'Mainland Realty',
        profilePhoto: null,
        reputationScore: 740,
        isVerifiedBadge: true,
        city: 'Lagos',
        bio: 'Mainland Lagos specialist — Yaba, Surulere, and Gbagada. Fast viewings, no ghost listings.',
      },
    },
  },
  {
    id: 'mock-6',
    title: '5-Bedroom Terraced House in Banana Island',
    description:
      'Premium 5-bedroom terraced house on Nigeria\'s most exclusive island. Floor-to-ceiling windows, private pool, smart home system, and access to the gated estate\'s private beach. Fully furnished option available.',
    propertyType: 'TERRACED',
    bedrooms: 5,
    bathrooms: 5,
    addressLine: '3 Bourdillon Court, Banana Island',
    area: 'Banana Island',
    city: 'Lagos',
    latitude: 6.4355,
    longitude: 3.4372,
    rentPerYear: '2500000000',  // ₦25,000,000
    inspectionFee: '30000000',  // ₦300,000
    photos: ['https://picsum.photos/seed/prop6/800/500'],
    status: 'AVAILABLE',
    isCrossPostFlagged: false,
    viewsCount: 318,
    avgRating: 4.9,
    agent: {
      id: 'agent-2',
      fullName: 'Amaka Eze',
      agentProfile: {
        agencyName: 'Eze Homes',
        profilePhoto: null,
        reputationScore: 910,
        isVerifiedBadge: true,
        city: 'Lagos',
        bio: 'Award-winning agent with 12 years of experience across mainland and island Lagos.',
      },
    },
  },
];

export function getMockListingById(id: string): MockListing | undefined {
  return MOCK_LISTINGS.find((l) => l.id === id);
}
