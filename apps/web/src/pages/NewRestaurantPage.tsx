import React, { useState } from 'react'
import { client } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import PlaceSearchInput from '@/components/PlaceSearchInput'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field'
import { RestaurantFields, type DisplayPhotoItem } from '@/components/RestaurantFormFields'

function NewRestaurantPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    placeId: '',
    latitude: 0,
    longitude: 0,
    genre: '',
    memo: '',
    rating: 0,
  })
  const [photos, setPhotos] = useState<DisplayPhotoItem[]>([])

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()

    try {
      const res = await client.api.restaurants.$post({
        json: formData,
      })
      if (!res.ok) throw new Error('failed to create')
      const data = await res.json()

      if (photos.length > 0) {
        const setRes = await client.api.restaurants[':id'].photos.$put({
          param: { id: data.id.toString() },
          json: photos.map((photo, index) => ({ id: photo.id, sortOrder: index })),
        })
        if (!setRes.ok) throw new Error('failed to set restaurant photos')
      }

      navigate(`/restaurants/${data.id}`)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-5">
      <div>
        <h1 className="text-xl font-bold">新しいお店を追加</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>1. お店を検索</FieldLegend>
            <FieldGroup>
              <Field>
                <PlaceSearchInput
                  onSelect={(googleData) => {
                    setFormData((prev) => ({
                      ...prev,
                      name: googleData.name,
                      placeId: googleData.placeId,
                      latitude: googleData.latitude,
                      longitude: googleData.longitude,
                    }))
                  }}
                />
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <FieldLegend>2. 詳細情報を入力</FieldLegend>
            <FieldGroup>
              <RestaurantFields
                value={{
                  name: formData.name,
                  genre: formData.genre,
                  rating: formData.rating,
                  memo: formData.memo,
                }}
                onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
                photos={photos}
                onPhotosChange={setPhotos}
              />

              <Field>
                <Button type="submit">保存</Button>
              </Field>
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </form>
    </div>
  )
}

export default NewRestaurantPage
