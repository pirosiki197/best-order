import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { client } from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

function RestaurantPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const queryClient = useQueryClient()

  const {
    data: restaurant,
    isPending,
    error,
  } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      const res = await client.api.restaurants[':id'].$get({
        param: { id: id! },
      })
      if (!res.ok) {
        throw new Error('データの取得に失敗しました')
      }
      return res.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await client.api.restaurants[':id'].$delete({ param: { id: id! } })
      if (!res.ok) throw new Error('failed to delete')
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['restaurants'] })
      setDeleteOpen(false)
      navigate('/')
    },
    onError: (err) => {
      console.error(err)
      alert('削除に失敗しました')
    },
  })

  if (isPending) return <div>読み込み中...</div>
  if (error) return <div>エラー発生!</div>

  const mainPhotoUrl =
    restaurant.photos.length > 0
      ? `/api/photos/${restaurant.photos[0].filename}`
      : 'https://media.pirosiki197.net/noimage.png'
  const googleMapUrl = `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${restaurant.placeId}`

  return (
    <main>
      <div className="relative aspect-16/10 overflow-hidden">
        <img src={mainPhotoUrl} className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 right-0 bottom-0 left-0 bg-linear-to-t from-black/70 to-transparent p-4">
          <Badge className="mb-2 bg-white/20 text-white backdrop-blur-sm">{restaurant.genre}</Badge>
          <h2 className="text-xl font-bold text-white">{restaurant.name}</h2>
        </div>
      </div>

      <div className="m-3 flex flex-col gap-3">
        <Button asChild variant={'outline'}>
          <a
            href={googleMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            <p>Google Map</p>
          </a>
        </Button>

        <div className="bg-muted rounded-lg">
          <p className="text-muted-foreground p-3 text-sm whitespace-pre-wrap">{restaurant.memo}</p>
        </div>

        {restaurant.photos.length > 1 && (
          <div className="mt-4 flex snap-x snap-mandatory scrollbar-none gap-2 overflow-x-auto pb-4">
            {restaurant.photos.slice(1).map((photo) => (
              <div
                key={photo.id}
                className="aspect-4/3 w-[85vw] shrink-0 snap-center overflow-hidden rounded-xl md:w-100"
              >
                <img src={`/api/photos/${photo.filename}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant={'outline'}
          onClick={() => navigate(`/restaurants/${restaurant.id}/edit`)}
          className="flex items-center gap-2"
        >
          <Pencil className="h-4 w-4" />
          <p>編集</p>
        </Button>

        <Dialog
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open)
          }}
        >
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4" />
              削除
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>お店を削除しますか？</DialogTitle>
              <DialogDescription>
                写真も含めて削除されます。この操作は取り消せません。
              </DialogDescription>
            </DialogHeader>
            {deleteMutation.isError && (
              <p className="text-destructive text-sm">エラーが発生しました</p>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={deleteMutation.isPending}>
                  キャンセル
                </Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                削除する
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}

export default RestaurantPage
