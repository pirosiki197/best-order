import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'

type Restaurant = {
  name: string
  genre: string
  rating: number
  memo: string
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-16/10 overflow-hidden">
        <img
          src="https://tsukatte.com/wp-content/uploads/2023/12/ramen_01.png"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-4">
          <h3 className="text-xl font-bold text-white">{restaurant.name}</h3>
        </div>
      </div>
      <CardContent className="p-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Star className="h-5.5 w-5.5 fill-red-500 text-red-500" />
              <span className="text-primary text-lg font-bold">{restaurant.rating || 3}</span>{' '}
            </div>
            <Badge className="bg-primary text-primary-foreground">{restaurant.genre}</Badge>
          </div>
          <CardDescription className="line-clamp-2">{restaurant.memo}</CardDescription>
        </div>
      </CardContent>
    </Card>
  )
}

export default RestaurantCard
