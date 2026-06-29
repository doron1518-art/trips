import { type NextRequest, NextResponse } from 'next/server'

// keyword arrays → Unsplash photo ID
const KEYWORD_MAP: [string[], string][] = [
  [['portugal', 'lisbon', 'porto', 'algarve', 'sintra'],         'photo-1548707309-dcebeab9ea9b'],
  [['japan', 'tokyo', 'kyoto', 'osaka', 'hiroshima', 'hokkaido'],'photo-1540959733332-eab4deabeeaf'],
  [['italy', 'rome', 'venice', 'milan', 'florence', 'amalfi'],   'photo-1525874684015-58379d421a52'],
  [['france', 'paris', 'nice', 'lyon', 'provence'],              'photo-1502602898657-3e91760cbb34'],
  [['spain', 'barcelona', 'madrid', 'seville', 'valencia'],      'photo-1539037116277-4db20889f2d4'],
  [['greece', 'santorini', 'athens', 'mykonos', 'crete'],        'photo-1533105079780-92b9be4f5405'],
  [['thailand', 'bangkok', 'phuket', 'chiang mai', 'krabi'],     'photo-1528360983277-13d401cdc186'],
  [['bali', 'indonesia', 'java', 'lombok', 'komodo'],            'photo-1537996194471-e657df975ab4'],
  [['new york', 'nyc', 'manhattan', 'brooklyn'],                 'photo-1522083165195-3424ed129620'],
  [['london', 'england', 'uk', 'united kingdom', 'britain'],     'photo-1513635269975-59663e0ac1ad'],
  [['amsterdam', 'netherlands', 'holland'],                      'photo-1512470604992-db96a4db5c2e'],
  [['australia', 'sydney', 'melbourne', 'brisbane'],             'photo-1506973035872-a4ec16b8e8d9'],
  [['iceland', 'reykjavik', 'northern lights'],                  'photo-1501854140801-50d01698950b'],
  [['mexico', 'cancun', 'mexico city', 'oaxaca', 'tulum'],       'photo-1518105779142-d975f22f1b0a'],
  [['maldives'],                                                 'photo-1573843981267-be1480825de2'],
  [['dubai', 'abu dhabi', 'uae', 'emirates'],                    'photo-1512453979798-5ea266f8880c'],
  [['new zealand', 'auckland', 'queenstown', 'rotorua'],         'photo-1507699622108-4be3abd695ad'],
  [['canada', 'toronto', 'vancouver', 'montreal', 'banff'],      'photo-1535016120720-40dada8f5fd7'],
  [['brazil', 'rio', 'são paulo', 'salvador', 'amazon'],         'photo-1483729600059-b592f15a2ef7'],
  [['morocco', 'marrakech', 'casablanca', 'fez'],                'photo-1489749798305-4fea3ae63d43'],
  [['turkey', 'istanbul', 'cappadocia', 'ankara'],               'photo-1527838832700-5059252407fa'],
  [['vietnam', 'hanoi', 'ho chi minh', 'hoi an', 'halong'],     'photo-1528360983277-13d401cdc186'],
  [['india', 'mumbai', 'delhi', 'rajasthan', 'goa', 'agra'],     'photo-1524492412937-b28074a5d7da'],
  [['singapore'],                                                'photo-1525625293386-3f8f99389edd'],
  [['egypt', 'cairo', 'pyramids', 'luxor'],                      'photo-1539650116574-8efeb43a2750'],
  [['hawaii', 'honolulu', 'maui', 'kauai'],                      'photo-1505852679233-d9fd70aff56d'],
  [['california', 'los angeles', 'san francisco', 'la', 'sf'],   'photo-1514924013411-cbf25faa35bb'],
  [['miami', 'florida', 'orlando'],                              'photo-1535498730771-e735b998cd64'],
  [['berlin', 'germany', 'munich', 'hamburg'],                   'photo-1560969184-10fe8719e047'],
  [['prague', 'czech', 'brno'],                                  'photo-1519677100203-a0e668c92439'],
  [['vienna', 'austria', 'salzburg'],                            'photo-1516550893923-42d28e5677af'],
  [['switzerland', 'zurich', 'geneva', 'bern', 'interlaken'],    'photo-1501446529957-6226b6dc51e6'],
  [['scotland', 'edinburgh', 'highlands', 'glasgow'],            'photo-1530841377377-3ff06c0ca713'],
  [['ireland', 'dublin', 'galway'],                              'photo-1564959130747-897fb406b9af'],
  [['croatia', 'dubrovnik', 'split', 'zagreb'],                  'photo-1555990538-c4f8cc424fd0'],
  [['norway', 'oslo', 'fjord', 'bergen'],                        'photo-1520769945061-0a448c463865'],
  [['sweden', 'stockholm', 'gothenburg'],                        'photo-1509356843151-3e7d96241e11'],
  [['peru', 'lima', 'machu picchu', 'cusco'],                    'photo-1526392060635-9d6019884377'],
  [['argentina', 'buenos aires', 'patagonia'],                   'photo-1589909202802-8f4aadce1849'],
  [['south africa', 'cape town', 'johannesburg'],                'photo-1580060839134-75a5edca2e99'],
  [['kenya', 'safari', 'nairobi', 'serengeti'],                  'photo-1516026672322-bc52d61a55d5'],
  [['costa rica', 'san jose'],                                   'photo-1518259102261-b40117eabbc9'],
  [['colombia', 'bogota', 'cartagena', 'medellin'],              'photo-1510497029020-40ff8f62d4f6'],
  [['cuba', 'havana'],                                           'photo-1519921403843-e7f06e9fa9c1'],
  [['philippines', 'manila', 'cebu', 'palawan', 'boracay'],      'photo-1518509562904-e7ef99cdcc86'],
  [['cambodia', 'angkor', 'siem reap', 'phnom penh'],            'photo-1516245834210-c4c142787335'],
  [['hawaii'],                                                   'photo-1505852679233-d9fd70aff56d'],
  [['seychelles'],                                               'photo-1573790387438-4da905039392'],
  [['tuscany', 'florence'],                                      'photo-1523906834658-6b58f4078e41'],
  [['amsterdam'],                                                'photo-1534351590666-13e3e96b5702'],
  [['chile', 'santiago', 'patagonia'],                           'photo-1499591934245-40b55745b905'],
  [['scotland'],                                                 'photo-1472396961693-142e6e269027'],
]

const DEFAULT_POOL = [
  'photo-1488085061387-422e29b40080',
  'photo-1476514525535-07fb3b4ae5f1',
  'photo-1452421822248-d4c2b47f0c81',
  'photo-1469854523086-cc02fe5d8800',
  'photo-1503220317375-aaad61436b1b',
  'photo-1530521954074-e64f6810b32d',
  'photo-1501785888041-af3ef285b470',
  'photo-1500835556837-99ac94a94552',
]

function toUrl(photoId: string) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1200&q=80`
}

function fallbackUrl(query: string): string {
  const lower = query.toLowerCase()
  for (const [keywords, photoId] of KEYWORD_MAP) {
    if (keywords.some((k) => lower.includes(k))) return toUrl(photoId)
  }
  // deterministic pick from default pool
  const hash = Array.from(query).reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return toUrl(DEFAULT_POOL[hash % DEFAULT_POOL.length])
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ url: null })

  const key = process.env.UNSPLASH_ACCESS_KEY

  if (key) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&orientation=landscape&per_page=5&content_filter=high`,
        {
          headers: { Authorization: `Client-ID ${key}` },
          next: { revalidate: 3600 },
        }
      )
      if (res.ok) {
        const data = await res.json() as { results: { urls: { regular: string } }[] }
        if (data.results?.length > 0) {
          // pick randomly from first 5 results for variety on refresh
          const idx = Math.floor(Math.random() * Math.min(5, data.results.length))
          return NextResponse.json({ url: data.results[idx].urls.regular, source: 'unsplash' })
        }
      }
    } catch {
      // fall through to fallback
    }
  }

  return NextResponse.json({ url: fallbackUrl(q), source: 'fallback' })
}
