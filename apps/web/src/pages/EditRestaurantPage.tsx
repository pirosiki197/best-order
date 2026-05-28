import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { client } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field'
import {
  RestaurantFields,
  type DisplayPhotoItem,
  type RestaurantEditableFormData,
} from '@/components/RestaurantFormFields'

function EditRestaurantPage() {
  const { id: restaurantId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<RestaurantEditableFormData>({
    name: '',
    genre: '',
    rating: 1,
    memo: '',
  })

  const [newPhotos, setNewPhotos] = useState<DisplayPhotoItem[]>([])

  const initialized = useRef(false)

  const {
    data: restaurant,
    isPending,
    error,
  } = useQuery({
    queryKey: ['restaurant', restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const res = await client.api.restaurants[':id'].$get({
        param: { id: restaurantId! },
      })
      if (!res.ok) throw new Error('failed to get restaurant')
      return res.json()
    },
  })

  useEffect(() => {
    if (!restaurant || initialized.current) return
    setFormData({
      name: restaurant.name,
      genre: restaurant.genre,
      rating: restaurant.rating,
      memo: restaurant.memo,
    })
    setNewPhotos(
      restaurant.photos.map((photo) => ({
        id: photo.id,
        displayUrl: `/api/photos/${photo.filename}`,
      })),
    )
    initialized.current = true
  }, [restaurant])

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!restaurantId) return

    const res = await client.api.restaurants[':id'].$patch({
      param: { id: restaurantId },
      json: {
        name: formData.name,
        genre: formData.genre,
        rating: formData.rating,
        memo: formData.memo,
      },
    })
    if (!res.ok) {
      throw new Error('failed to update restaurant')
    }

    if (!restaurant) return

    const setRes = await client.api.restaurants[':id'].photos.$put({
      param: { id: restaurantId },
      json: newPhotos.map((photo, index) => ({ id: photo.id, sortOrder: index })),
    })
    if (!setRes.ok) throw new Error('failed to set restaurant photos')

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] }),
      queryClient.invalidateQueries({ queryKey: ['restaurants'] }),
    ])

    navigate(`/restaurants/${restaurantId}`)
  }

  if (isPending) return <div>読み込み中...</div>
  if (error) return <div>エラー発生!</div>

  return (
    <div className="flex flex-col gap-6 p-5">
      <div>
        <h1 className="text-xl font-bold">お店を編集</h1>
      </div>

      <form
        onSubmit={(e) => {
          handleSubmit(e).catch((err) => {
            console.error(err)
          })
        }}
      >
        <FieldGroup>
          <FieldSet>
            <FieldLegend>お店情報</FieldLegend>
            <FieldGroup>
              <RestaurantFields
                value={formData}
                onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
                photos={newPhotos}
                onPhotosChange={setNewPhotos}
              />

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  キャンセル
                </Button>
                <Button type="submit">更新</Button>
              </div>
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </form>
    </div>
  )
}

export default EditRestaurantPage
