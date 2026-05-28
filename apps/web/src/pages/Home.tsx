import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'

import RestaurantCard from '@/components/RestaurantCard'
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { client } from '@/lib/api'

function Home() {
  const [query, setQuery] = useState('')
  const { data, isPending, error } = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const res = await client.api.restaurants.$get()
      if (!res.ok) throw new Error('failed to get restaurants')
      return res.json()
    },
  })

  const filtered = useMemo(() => {
    if (!data?.result) return []

    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return data.result

    return data.result
      .map((r) => {
        if (r.name.toLowerCase().includes(normalizedQuery)) return { r, score: 3 }
        if (r.genre.toLowerCase().includes(normalizedQuery)) return { r, score: 2 }
        if (r.memo.toLowerCase().includes(normalizedQuery)) return { r, score: 1 }
        return { r, score: 0 }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.r)
  }, [query, data?.result])

  if (isPending) return <div>検索中...</div>
  if (error) return <div>エラー発生！</div>

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
          <div className="mx-3 mb-3">
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
