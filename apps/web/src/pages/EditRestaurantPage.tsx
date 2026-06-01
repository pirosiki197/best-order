import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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
    isPending: isFetching,
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

  const updateMutation = useMutation({
    mutationFn: async (variables: {
      id: string
      data: RestaurantEditableFormData
      photos: DisplayPhotoItem[]
    }) => {
      const res = await client.api.restaurants[':id'].$patch({
        param: { id: variables.id },
        json: {
          name: variables.data.name,
          genre: variables.data.genre,
          rating: variables.data.rating,
          memo: variables.data.memo,
        },
      })
      if (!res.ok) throw new Error('failed to update restaurant')

      const photoRes = await client.api.restaurants[':id'].photos.$put({
        param: { id: variables.id },
        json: variables.photos.map((photo, index) => ({
          id: photo.id,
          sortOrder: index,
        })),
      })
      if (!photoRes.ok) throw new Error('failed to set restaurant photos')
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['restaurant', variables.id] }),
        queryClient.invalidateQueries({ queryKey: ['restaurants'] }),
      ])
      navigate(`/restaurants/${variables.id}`)
    },
    onError: (error) => {
      console.error(error)
    },
  })

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!restaurantId) return

    updateMutation.mutate({ id: restaurantId, data: formData, photos: newPhotos })
  }

  if (isFetching) return <div>読み込み中...</div>
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
                <Button type="submit" disabled={updateMutation.isPending}>
                  更新
                </Button>
              </div>
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </form>
    </div>
  )
}

export default EditRestaurantPage
