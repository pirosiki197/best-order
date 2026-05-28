import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'

import RestaurantCard from '@/components/RestaurantCard'
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { client } from '@/lib/api'

function Home() {
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<'recent' | 'near'>('recent')
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  const { data, isPending, error } = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const res = await client.api.restaurants.$get()
      if (!res.ok) throw new Error('failed to get restaurants')
      return res.json()
    },
  })

  useEffect(() => {
    if (location || !navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
      },
      () => {
        // ignore background errors; show message only on explicit toggle
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 },
    )
  }, [location])

  const handleSortChange = (mode: 'recent' | 'near') => {
    setLocationError(null)

    if (mode === 'recent') {
      setSortMode('recent')
      return
    }
    if (location) {
      setSortMode('near')
      return
    }

    if (!navigator.geolocation) {
      setLocationError('位置情報を取得できませんでした')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setSortMode('near')
      },
      () => setLocationError('位置情報を取得できませんでした'),
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 },
    )
  }

  const getDistanceScore = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRadians = (v: number) => (v / 180) * Math.PI
    const radLat1 = toRadians(lat1)
    const radLon1 = toRadians(lon1)
    const radLat2 = toRadians(lat2)
    const radLon2 = toRadians(lon2)

    const dlat = radLat2 - radLat1
    const dlon = radLon2 - radLon1

    const a =
      Math.sin(dlat / 2) * Math.sin(dlat / 2) +
      Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dlon / 2) * Math.sin(dlon / 2)
    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const getFilteredAndSortedRestaurants = () => {
    if (!data?.result) return []

    const normalizedQuery = query.trim().toLowerCase()

    const itemsWithScore = data.result
      .map((r) => {
        if (!normalizedQuery) return { r, score: 1 }
        if (r.name.toLowerCase().includes(normalizedQuery)) return { r, score: 3 }
        if (r.genre.toLowerCase().includes(normalizedQuery)) return { r, score: 2 }
        if (r.memo.toLowerCase().includes(normalizedQuery)) return { r, score: 1 }
        return { r, score: 0 }
      })
      .filter((item) => item.score > 0)

    return itemsWithScore
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        if (sortMode === 'near' && location) {
          const distA = getDistanceScore(
            location.latitude,
            location.longitude,
            a.r.latitude,
            a.r.longitude,
          )
          const distB = getDistanceScore(
            location.latitude,
            location.longitude,
            b.r.latitude,
            b.r.longitude,
          )
          return distA - distB
        }
        return new Date(b.r.createdAt).getTime() - new Date(a.r.createdAt).getTime()
      })
      .map((item) => item.r)
  }

  const filtered = getFilteredAndSortedRestaurants()

  if (isPending) return <div>検索中...</div>
  if (error || !data) return <div>エラー発生！</div>

  return (
    <main className="p-3">
      {data.result.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>お店が登録されていません</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="mx-3 mb-3 flex flex-col gap-2">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="お店を検索"
                aria-label="お店を検索"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <ToggleGroup
                type="single"
                value={sortMode}
                variant="outline"
                spacing={0}
                aria-label="並び替え"
                onValueChange={(value) => {
                  if (value === 'recent' || value === 'near') {
                    handleSortChange(value)
                  }
                }}
              >
                <ToggleGroupItem value="recent">新しい順</ToggleGroupItem>
                <ToggleGroupItem value="near">近い順</ToggleGroupItem>
              </ToggleGroup>
            </div>
            {locationError ? <p className="text-destructive text-sm">{locationError}</p> : null}
          </div>
          {filtered.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>検索結果がありません</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="mx-3 grid grid-cols-1 gap-3">
              {filtered.map((r) => (
                <Link key={r.id} to={`/restaurants/${r.id}`}>
                  <RestaurantCard restaurant={r} />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}

export default Home
