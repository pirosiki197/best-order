import RestaurantCard from '@/components/RestaurantCard'
import { client } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

function Home() {
  const { data, isPending, error } = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const res = await client.api.restaurants.$get()
      if (!res.ok) throw new Error('failed to get restaurants')
      return res.json()
    },
  })
  if (isPending) return <div>検索中...</div>
  if (error) return <div>エラー発生！</div>

  return (
    <main className="p-3">
      <div className="mx-3 grid grid-cols-1 gap-3">
        {data.result.map((r) => (
          <Link to={`/restaurants/${r.id}`}>
            <RestaurantCard key={r.id} restaurant={r} />
          </Link>
        ))}
      </div>
    </main>
  )
}

export default Home
