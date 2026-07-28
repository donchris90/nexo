import { GiftItem, LiveStream, GameRoom, ShoppingProduct, DigitalProduct, CreatorService, TicketedEvent, AIAvatar } from '../types';

export const MOCK_GIFTS: GiftItem[] = [
  {
    id: 'gift_dragon',
    name: 'Mythic Flying Dragon',
    icon: '🐉',
    coinPrice: 10000,
    diamondValue: 7000,
    category: 'AR_PREMIUM',
    animationType: 'DRAGON',
    description: 'Summons an interactive fire-breathing dragon across the stream!',
    soundEffect: 'Roar & Flames'
  },
  {
    id: 'gift_car',
    name: 'Cyber Sports Car',
    icon: '🏎️',
    coinPrice: 5000,
    diamondValue: 3500,
    category: 'AR_PREMIUM',
    animationType: 'SPORTS_CAR',
    description: 'Drives a high-speed neon supercar across the stream view.',
    soundEffect: 'Engine Rev'
  },
  {
    id: 'gift_castle',
    name: 'Crystal Castle',
    icon: '🏰',
    coinPrice: 2500,
    diamondValue: 1750,
    category: 'AR_PREMIUM',
    animationType: 'CASTLE',
    description: 'Erects a sparkling floating castle with magic starlight.',
    soundEffect: 'Chime Starlight'
  },
  {
    id: 'gift_rocket',
    name: 'Space Shuttle',
    icon: '🚀',
    coinPrice: 1000,
    diamondValue: 700,
    category: 'AR_PREMIUM',
    animationType: 'SPACESHIP',
    description: 'Launches a space rocket with smoke plume and cosmic rays.',
    soundEffect: 'Rocket Blast'
  },
  {
    id: 'gift_portal',
    name: 'Magic Portal',
    icon: '🌀',
    coinPrice: 500,
    diamondValue: 350,
    category: 'SPECIAL',
    animationType: 'PORTAL',
    description: 'Swirling energy portal with glowing particles.',
    soundEffect: 'Portal Sound'
  },
  {
    id: 'gift_fireworks',
    name: 'Fireworks Sky',
    icon: '🎆',
    coinPrice: 100,
    diamondValue: 70,
    category: 'SPECIAL',
    animationType: 'FIREWORKS',
    description: 'Multi-burst colorful fireworks celebration.',
    soundEffect: 'Fireworks Pop'
  },
  {
    id: 'gift_confetti',
    name: 'Party Confetti',
    icon: '🎉',
    coinPrice: 10,
    diamondValue: 7,
    category: 'REGULAR',
    animationType: 'CONFETTI',
    description: 'High-density festive party confetti rain.',
    soundEffect: 'Cheer'
  }
];

export const MOCK_STREAMS: LiveStream[] = [
  {
    id: 'stream_party_1',
    creatorId: 'c1',
    creatorName: 'Aria Nova (Host)',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    creatorVerified: true,
    creatorLevel: 58,
    location: '🇺🇸 Los Angeles',
    title: '🎙️ VIP 9-Seat Party Room • Singing, Chat & Gifting War!',
    category: 'PARTY_ROOM',
    viewersCount: 3890,
    likesCount: 68400,
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    tags: ['PartyRoom', 'MultiGuest', 'PoppoVibe', 'LiveVoice'],
    isLive: true,
    isPartyRoom: true,
    seatGridSize: 9,
    seats: [
      { seatNumber: 1, userName: 'Aria Nova', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', userLevel: 58, isMuted: false, isCameraOn: true, seatGiftsCoins: 125000, isHost: true },
      { seatNumber: 2, userName: 'GamerGod99', userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80', userLevel: 42, isMuted: false, isCameraOn: true, seatGiftsCoins: 48000 },
      { seatNumber: 3, userName: 'CyberKnight', userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80', userLevel: 31, isMuted: true, isCameraOn: true, seatGiftsCoins: 19500 },
      { seatNumber: 4, userName: 'AriaFanatic', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', userLevel: 25, isMuted: false, isCameraOn: false, seatGiftsCoins: 8200 },
      { seatNumber: 5, userName: 'Alex Rivers (You)', userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80', userLevel: 18, isMuted: false, isCameraOn: true, seatGiftsCoins: 3500 },
      { seatNumber: 6, userName: undefined },
      { seatNumber: 7, userName: 'DragonKing', userAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&q=80', userLevel: 39, isMuted: false, isCameraOn: true, seatGiftsCoins: 31000 },
      { seatNumber: 8, userName: undefined },
      { seatNumber: 9, userName: undefined }
    ],
    aiCohostEnabled: true,
    aiCohostMode: 'MODERATOR'
  },
  {
    id: 'stream_pk_1',
    creatorId: 'c1',
    creatorName: 'Aria Nova',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    creatorVerified: true,
    creatorLevel: 58,
    location: '🇩🇪 Berlin',
    title: '⚔️ 1v1 LIVE PK BATTLE: Aria Nova vs DJ Kairos! Send Dragons to Win!',
    category: 'PK_BATTLE',
    viewersCount: 5420,
    likesCount: 112000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    tags: ['PKBattle', 'BigoStyle', 'DragonGift', 'RedVsBlue'],
    isLive: true,
    pkBattle: {
      isPkActive: true,
      opponentName: 'DJ Kairos',
      opponentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      opponentLevel: 51,
      selfScore: 84500,
      opponentScore: 62100,
      timeRemainingSeconds: 165,
      winningTeam: 'RED'
    },
    aiCohostEnabled: true,
    aiCohostMode: 'TRIVIA'
  },
  {
    id: 'stream_1',
    creatorId: 'c1',
    creatorName: 'Aria Nova',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    creatorVerified: true,
    creatorLevel: 58,
    location: '🇺🇸 Los Angeles',
    title: '🔥 High Stakes Ludo & Uno Championship + Live Q&A!',
    category: 'GAMING',
    viewersCount: 1420,
    likesCount: 18900,
    thumbnailUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    tags: ['Ludo', 'Interactive', 'PointsGamer', 'AI-Cohost'],
    isLive: true,
    aiCohostEnabled: true,
    aiCohostMode: 'MODERATOR',
    pinnedProducts: [
      {
        id: 'p1',
        title: 'Pro Gaming Mechanical Keyboard (Custom RGB)',
        priceCoins: 1200,
        priceUsd: 59.99,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80',
        description: 'Ultra-fast tactile mechanical switches with custom macro keys.',
        stock: 24,
        salesCount: 180,
        rating: 4.9,
        creatorName: 'Aria Nova'
      }
    ]
  },
  {
    id: 'stream_2',
    creatorId: 'c2',
    creatorName: 'DJ Kairos',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    creatorVerified: true,
    creatorLevel: 51,
    location: '🇯🇵 Tokyo',
    title: '🎧 Cyberpunk Electronic Synth Live Set & Song Requests',
    category: 'MUSIC',
    viewersCount: 2890,
    likesCount: 43200,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    tags: ['DJ', 'Synthwave', 'LiveBeats', 'MusicRoom'],
    isLive: true,
    aiCohostEnabled: true,
    aiCohostMode: 'RECOMMENDER'
  },
  {
    id: 'stream_3',
    creatorId: 'c3',
    creatorName: 'Elena Rostova',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    creatorVerified: true,
    creatorLevel: 44,
    location: '🇬🇧 London',
    title: '🛍️ Exclusive Live Shopping: Designer Presets & Gear Showcase',
    category: 'SHOPPING',
    viewersCount: 850,
    likesCount: 9400,
    thumbnailUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
    tags: ['LiveShopping', 'Deals', 'CreatorMarket'],
    isLive: true,
    aiCohostEnabled: true,
    aiCohostMode: 'QA',
    pinnedProducts: [
      {
        id: 'p2',
        title: 'Masterclass Video Editing Preset Pack v4',
        priceCoins: 350,
        priceUsd: 18.00,
        image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=400&q=80',
        description: 'Cinematic color grading presets for Premiere & DaVinci.',
        stock: 999,
        salesCount: 420,
        rating: 5.0,
        creatorName: 'Elena Rostova'
      }
    ]
  }
];

export const MOCK_GAMES: GameRoom[] = [
  {
    id: 'room_ludo_1',
    gameId: 'LUDO',
    gameName: 'Ludo Master Arena',
    hostName: 'Aria Nova',
    minWagerPoints: 500,
    maxPlayers: 4,
    currentPlayers: 3,
    isPrivate: false,
    status: 'WAITING'
  },
  {
    id: 'room_wheel_1',
    gameId: 'LUCKY_WHEEL',
    gameName: 'Lucky Spin Wheel Jackpot',
    hostName: 'System Casino',
    minWagerPoints: 100,
    maxPlayers: 1,
    currentPlayers: 1,
    isPrivate: false,
    status: 'IN_PROGRESS'
  },
  {
    id: 'room_quiz_1',
    gameId: 'QUIZ_BATTLE',
    gameName: 'AI Speed Trivia Showdown',
    hostName: 'AI Co-Host Alpha',
    minWagerPoints: 250,
    maxPlayers: 8,
    currentPlayers: 5,
    isPrivate: false,
    status: 'WAITING'
  },
  {
    id: 'room_uno_1',
    gameId: 'UNO',
    gameName: 'Uno Color Blitz',
    hostName: 'GamerX',
    minWagerPoints: 300,
    maxPlayers: 4,
    currentPlayers: 2,
    isPrivate: false,
    status: 'WAITING'
  },
  {
    id: 'room_chess_1',
    gameId: 'CHESS',
    gameName: 'Grandmaster Chess Dual',
    hostName: 'KasparovBot',
    minWagerPoints: 1000,
    maxPlayers: 2,
    currentPlayers: 1,
    isPrivate: false,
    status: 'WAITING'
  }
];

export const MOCK_SHOPPING_PRODUCTS: ShoppingProduct[] = [
  {
    id: 'sp_1',
    title: 'NexEconomy Pro Streaming Ring Light & Tripod',
    priceCoins: 850,
    priceUsd: 42.50,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80',
    description: '18-inch dimmable LED ring light with wireless remote control.',
    stock: 45,
    salesCount: 310,
    rating: 4.8,
    creatorName: 'Aria Nova'
  },
  {
    id: 'sp_2',
    title: 'Studio Condenser Microphone & Arm',
    priceCoins: 1500,
    priceUsd: 75.00,
    image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80',
    description: 'XLR/USB dual mode studio microphone with zero latency monitoring.',
    stock: 12,
    salesCount: 540,
    rating: 4.9,
    creatorName: 'DJ Kairos'
  },
  {
    id: 'sp_3',
    title: 'Smart Green Screen Backstage Panel',
    priceCoins: 600,
    priceUsd: 30.00,
    image: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=400&q=80',
    description: 'Collapsible wrinkle-resistant chroma key green screen.',
    stock: 80,
    salesCount: 220,
    rating: 4.7,
    creatorName: 'Elena Rostova'
  }
];

export const MOCK_DIGITAL_PRODUCTS: DigitalProduct[] = [
  {
    id: 'dp_1',
    title: 'Full Stack Creator Economy Course (2026 Edition)',
    category: 'COURSE',
    priceCoins: 1200,
    creatorName: 'Aria Nova',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80',
    rating: 4.9,
    downloadsCount: 1420,
    fileSize: '4.2 GB'
  },
  {
    id: 'dp_2',
    title: 'Obsidian & Notion Creator Planner Template',
    category: 'TEMPLATE',
    priceCoins: 250,
    creatorName: 'TechVibe',
    image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=400&q=80',
    rating: 4.8,
    downloadsCount: 890,
    fileSize: '15 MB'
  },
  {
    id: 'dp_3',
    title: '100+ Gemini AI System Prompts for Livestreamers',
    category: 'PROMPTS',
    priceCoins: 150,
    creatorName: 'AI Mastermind',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    rating: 5.0,
    downloadsCount: 3100,
    fileSize: '2.5 MB'
  }
];

export const MOCK_SERVICES: CreatorService[] = [
  {
    id: 'serv_1',
    creatorName: 'Aria Nova',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    serviceTitle: '30-Minute Livestream Co-Host & Brand Shoutout',
    description: 'I will join your livestream as a co-host and shout out your brand or channel to my 500k followers.',
    priceCoins: 3000,
    deliveryDays: 2,
    rating: 5.0,
    category: 'SHOUTOUT'
  },
  {
    id: 'serv_2',
    creatorName: 'DJ Kairos',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    serviceTitle: 'Custom Audio Intro & Stream DJ Jingle',
    description: 'High quality 15-second electronic music jingle tailored for your stream opening.',
    priceCoins: 1500,
    deliveryDays: 3,
    rating: 4.9,
    category: 'VOICE_GREETING'
  }
];

export const MOCK_EVENTS: TicketedEvent[] = [
  {
    id: 'event_1',
    title: 'NexEconomy Summer Gaming World Cup',
    organizerName: 'E-Sports League',
    date: '2026-08-15',
    time: '18:00 UTC',
    priceCoins: 300,
    vipTicketCoins: 800,
    category: 'TOURNAMENT',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    ticketsSold: 1240,
    totalCapacity: 2000
  },
  {
    id: 'event_2',
    title: 'VirtuCon: The Future of AI Streamers & Economy',
    organizerName: 'AI Studio Conference',
    date: '2026-09-01',
    time: '14:00 UTC',
    priceCoins: 500,
    vipTicketCoins: 1200,
    category: 'CONFERENCE',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
    ticketsSold: 450,
    totalCapacity: 1000
  }
];

export const MOCK_AVATARS: AIAvatar[] = [
  {
    id: 'av_1',
    name: 'Neon Cyber Valkyrie',
    style: 'CYBERPUNK',
    voiceTone: 'ENERGETIC',
    avatarUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=300&q=80',
    expressions: ['Joyful', 'Fiery', 'Cool Wink', 'Surprised']
  },
  {
    id: 'av_2',
    name: 'Aetheria Anime Mage',
    style: 'ANIME',
    voiceTone: 'PLAYFUL',
    avatarUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80',
    expressions: ['Smug', 'Cheerful', 'Magic Sparkle', 'Sleepy']
  }
];
