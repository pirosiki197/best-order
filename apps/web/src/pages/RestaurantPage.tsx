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
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

function RestaurantPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleDelete = async () => {
    if (!id) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const res = await client.api.restaurants[':id'].$delete({
        param: { id },
      })
      if (!res.ok) {
        throw new Error('failed to delete restaurant')
      }
      setDeleteOpen(false)
      navigate('/')
    } catch (err) {
      console.error(err)
      setDeleteError('削除に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setIsDeleting(false)
    }
  }

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
        <div className="bg-muted rounded-lg">
          <p className="text-muted-foreground p-3 text-sm">{restaurant.memo}</p>
        </div>

        <Button asChild variant={'outline'}>
          <a
            href={googleMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <ExternalLink height={1} width={1} />
            <p>Google Map</p>
          </a>
        </Button>

        <div className="mt-4 flex snap-x snap-mandatory scrollbar-none gap-2 overflow-x-auto pb-4">
          {restaurant.photos
            .filter((_, i) => i !== 0)
            .map((photo) => (
              <div
                key={photo.id}
                className="aspect-4/3 w-[85vw] shrink-0 snap-center overflow-hidden rounded-xl md:w-100"
              >
                <img src={`/api/photos/${photo.filename}`} className="h-full w-full object-cover" />
              </div>
            ))}
        </div>

        <Dialog
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open)
            if (open) setDeleteError(null)
          }}
        >
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 />
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
            {deleteError && <p className="text-destructive text-sm">{deleteError}</p>}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={isDeleting}>
                  キャンセル
                </Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
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
