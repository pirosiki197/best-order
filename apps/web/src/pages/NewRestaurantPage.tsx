import React, { useState } from 'react'
import { client } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import PlaceSearchInput from '@/components/PlaceSearchInput'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/StarRating'
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { X, Camera } from 'lucide-react'

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
  const [photos, setPhotos] = useState<File[]>([])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)

    setPhotos((prev) => [...prev, ...files])
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()

    if (e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files)
      const imageFiles = files.filter((file) => file.type.startsWith('image/'))
      setPhotos((prev) => [...prev, ...imageFiles])
    }
  }

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()

    try {
      const res = await client.api.restaurants.$post({
        json: formData,
      })
      if (!res.ok) throw new Error('failed to create')
      const data = await res.json()

      await Promise.all(
        photos.map((photo, index) => {
          return client.api.restaurants[':id'].photos.$post({
            param: { id: data.id.toString() },
            form: {
              photo,
              sortOrder: index.toString(),
            },
          })
        }),
      )

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
              <Field>
                <FieldLabel>アプリでの表示名</FieldLabel>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Field>

              <Field>
                <FieldLabel>ジャンル</FieldLabel>
                <Input
                  type="text"
                  placeholder="例: ラーメン、イタリアン"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                />
              </Field>

              <Field>
                <FieldLabel>評価</FieldLabel>
                <StarRating
                  value={formData.rating}
                  onChange={(newRating) => setFormData({ ...formData, rating: newRating })}
                />
              </Field>

              <Field>
                <FieldLabel>写真</FieldLabel>
                <input
                  type="file"
                  id="photo-upload"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="sr-only"
                />

                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => {
                    const previewUrl = URL.createObjectURL(photo)
                    return (
                      <div
                        key={index}
                        className="relative aspect-square overflow-hidden rounded-lg"
                      >
                        <img
                          src={previewUrl}
                          className="h-full w-full object-cover"
                          onLoad={() => URL.revokeObjectURL(previewUrl)}
                        />
                        <span className="absolute top-1 left-1 bg-black/60 px-1.5 py-0.5 font-mono text-xs text-white">
                          #{index + 1}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 bg-black/60 text-white hover:bg-black"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })}
                  <label
                    htmlFor="photo-upload"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="border-muted-foreground/30 hover:border-muted-foreground/50 bg-muted/30 hover:bg-muted/60 aspect-square w-full cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all"
                  >
                    <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-1.5">
                      <Camera />
                      <p className="text-sm">写真を追加</p>
                    </div>
                  </label>
                </div>
              </Field>

              <Field>
                <FieldLabel>メモ</FieldLabel>
                <Textarea
                  value={formData.memo}
                  placeholder="味の感想など..."
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  rows={4}
                />
              </Field>

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
