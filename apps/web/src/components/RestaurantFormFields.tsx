import { useId } from 'react'
import { Camera, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from '@/components/StarRating'
import { Field, FieldLabel } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import imageCompression from 'browser-image-compression'
import { client } from '@/lib/api'

export type RestaurantEditableFormData = {
  name: string
  genre: string
  rating: number
  memo: string
}

export type DisplayPhotoItem = {
  id: number
  displayUrl: string
}

export function RestaurantFields({
  value,
  onChange,
  photos,
  onPhotosChange,
}: {
  value: RestaurantEditableFormData
  onChange: (patch: Partial<RestaurantEditableFormData>) => void
  photos: DisplayPhotoItem[]
  onPhotosChange: (photos: DisplayPhotoItem[]) => void
}) {
  const autoId = useId()
  const fileInputId = `photo-upload-${autoId}`

  const handlePhotoChange = async (files: File[]) => {
    try {
      const compressedPhotos = await Promise.all(
        files.map((f) => {
          try {
            return imageCompression(f, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1024,
              useWebWorker: true,
              fileType: 'image/webp',
            })
          } catch {
            console.error('画像の圧縮に失敗しました')
            return f
          }
        }),
      )
      const uploadedItems = await Promise.all(
        compressedPhotos.map(async (photo) => {
          const res = await client.api.photos.$post({
            form: { photo },
          })
          if (!res.ok) throw Error('failed to upload photo')
          const resJson = await res.json()
          return {
            id: resJson.id,
            displayUrl: URL.createObjectURL(photo),
          }
        }),
      )
      onPhotosChange([...photos, ...uploadedItems])
    } catch {
      console.error('画像の保存に失敗しました')
    }
  }

  const handleRemovePhoto = (itemToRemove: DisplayPhotoItem) => {
    URL.revokeObjectURL(itemToRemove.displayUrl)

    const remaining = photos.filter((p) => p.id !== itemToRemove.id)
    onPhotosChange(remaining)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
      handlePhotoChange(files)
    }
  }

  return (
    <>
      <Field>
        <FieldLabel>アプリでの表示名</FieldLabel>
        <Input
          type="text"
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </Field>

      <Field>
        <FieldLabel>ジャンル</FieldLabel>
        <Input
          type="text"
          placeholder="例: ラーメン、イタリアン"
          value={value.genre}
          onChange={(e) => onChange({ genre: e.target.value })}
        />
      </Field>

      <Field>
        <FieldLabel>評価</FieldLabel>
        <StarRating value={value.rating} onChange={(rating) => onChange({ rating })} />
      </Field>

      <Field>
        <FieldLabel>写真</FieldLabel>

        <input
          type="file"
          id={fileInputId}
          multiple
          accept="image/*"
          className="sr-only"
          onChange={(e) => e.target.files && handlePhotoChange(Array.from(e.target.files))}
        />

        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg">
              <img src={photo.displayUrl} className="h-full w-full object-cover" />
              <span className="absolute top-1 left-1 bg-black/60 px-1.5 py-0.5 font-mono text-xs text-white">
                #{index + 1}
              </span>
              <Button
                type="button"
                size="sm"
                onClick={() => handleRemovePhoto(photo)}
                className="absolute top-1 right-1 bg-black/60 text-white hover:bg-black"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}

          <label
            htmlFor={fileInputId}
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
          value={value.memo}
          placeholder="味の感想など..."
          onChange={(e) => onChange({ memo: e.target.value })}
          rows={4}
        />
      </Field>
    </>
  )
}
