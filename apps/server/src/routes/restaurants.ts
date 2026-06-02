import { Hono } from 'hono'
import type { Env } from '../types'
import { restaurantPhotos, restaurants } from '../db/schema'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { and, eq, inArray } from 'drizzle-orm'
import { randomUUID } from 'crypto'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
}

const createRestaurantSchema = z.object({
  name: z.string().min(1),
  genre: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  rating: z.int().min(1).max(5),
  placeId: z.string(),
  memo: z.string(),
})

const uploadPhotoSchema = z.object({
  photo: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, { error: 'ファイルサイズが大きすぎます' })
    .refine((file) => file.type in ALLOWED_MIME_TYPES, {
      error: '許可されていないファイルです',
    }),
  sortOrder: z.coerce.number().int(),
})

const setRestaurantPhotosSchema = z
  .array(
    z.object({
      id: z.number(),
      sortOrder: z.number().int().nonnegative(),
    }),
  )
  .max(30)

const restaurantIdSchema = z.object({ id: z.coerce.number() })
const updateRestaurantSchema = createRestaurantSchema
  .pick({ name: true, genre: true, rating: true, memo: true })
  .partial()
  .strict()

const restaurantsRouter = new Hono<Env>()
  .get('/', async (c) => {
    const db = c.get('db')
    const result = await db
      .select({
        id: restaurants.id,
        name: restaurants.name,
        genre: restaurants.genre,
        rating: restaurants.rating,
        memo: restaurants.memo,
        latitude: restaurants.latitude,
        longitude: restaurants.longitude,
        createdAt: restaurants.createdAt,
        mainPhotoFilename: restaurantPhotos.filename,
      })
      .from(restaurants)
      .leftJoin(
        restaurantPhotos,
        and(eq(restaurants.id, restaurantPhotos.restaurantId), eq(restaurantPhotos.sortOrder, 0)),
      )
    return c.json({ result })
  })
  .post('/', zValidator('json', createRestaurantSchema), async (c) => {
    const db = c.get('db')
    const req = c.req.valid('json')

    const [newRestaurant] = await db.insert(restaurants).values(req).returning()

    return c.json({ id: newRestaurant.id }, 201)
  })
  .get('/:id', zValidator('param', restaurantIdSchema), async (c) => {
    const db = c.get('db')
    const { id } = c.req.valid('param')

    const restaurantDetail = await db.query.restaurants.findFirst({
      where: eq(restaurants.id, id),
      with: {
        photos: {
          orderBy: (photos, { asc }) => [asc(photos.sortOrder)],
        },
      },
    })

    if (!restaurantDetail) {
      return c.json({ message: 'Restaurant not found' }, 404)
    }

    const responseData = {
      ...restaurantDetail,
      photos: restaurantDetail.photos.map((photo) => ({
        ...photo,
        restaurantId: photo.restaurantId!,
        sortOrder: photo.sortOrder!,
      })),
    }

    return c.json(responseData)
  })
  .patch(
    '/:id',
    zValidator('param', restaurantIdSchema),
    zValidator('json', updateRestaurantSchema),
    async (c) => {
      const db = c.get('db')
      const { id } = c.req.valid('param')
      const req = c.req.valid('json')

      const updateValues = {
        name: req.name,
        genre: req.genre,
        rating: req.rating,
        memo: req.memo,
      }

      const cleanValues = Object.fromEntries(
        Object.entries(updateValues).filter(([, v]) => v !== undefined),
      )

      if (Object.keys(cleanValues).length === 0) {
        return c.json({ message: 'No fields to update' }, 400)
      }

      const [updatedRestaurant] = await db
        .update(restaurants)
        .set(cleanValues)
        .where(eq(restaurants.id, id))
        .returning()

      if (!updatedRestaurant) {
        return c.json({ message: 'Restaurant not found' }, 404)
      }

      return c.json(updatedRestaurant)
    },
  )
  .delete('/:id', zValidator('param', restaurantIdSchema), async (c) => {
    const db = c.get('db')
    const { id } = c.req.valid('param')

    const restaurant = await db.query.restaurants.findFirst({
      where: eq(restaurants.id, id),
      columns: {
        id: true,
      },
    })

    if (!restaurant) {
      return c.json({ message: 'Restaurant not found' }, 404)
    }

    const photos = await db
      .select({ filename: restaurantPhotos.filename })
      .from(restaurantPhotos)
      .where(eq(restaurantPhotos.restaurantId, id))

    await db.delete(restaurants).where(eq(restaurants.id, id))

    const filenames = photos.map((photo) => photo.filename)
    if (filenames.length > 0) {
      await c.env.R2.delete(filenames)
    }

    return c.json({ success: true })
  })
  .put(
    '/:id/photos',
    zValidator('param', restaurantIdSchema),
    zValidator('json', setRestaurantPhotosSchema),
    async (c) => {
      const db = c.get('db')
      const { id: restaurantId } = c.req.valid('param')
      const req = c.req.valid('json')

      const sortOrders = req.map((item) => item.sortOrder)
      const photoIds = req.map((item) => item.id)
      if (new Set(sortOrders).size !== req.length) {
        return c.json({ message: 'Duplicate sortOrder' }, 400)
      }
      if (new Set(photoIds).size !== req.length) {
        return c.json({ message: 'Duplicate photo id' }, 400)
      }

      const restaurant = await db.query.restaurants.findFirst({
        where: eq(restaurants.id, restaurantId),
        columns: { id: true },
      })
      if (!restaurant) return c.json({ message: 'Restaurant not found' }, 404)

      if (photoIds.length > 0) {
        const rows = await db
          .select({ id: restaurantPhotos.id, restaurantId: restaurantPhotos.restaurantId })
          .from(restaurantPhotos)
          .where(inArray(restaurantPhotos.id, photoIds))

        if (rows.length !== photoIds.length) {
          return c.json({ message: 'Photo not found' }, 400)
        }

        const conflict = rows.find(
          (r) => r.restaurantId !== null && r.restaurantId !== restaurantId,
        )
        if (conflict) {
          return c.json({ message: 'Photo id is already attached to another restaurant' }, 409)
        }
      }

      await db.transaction(async (tx) => {
        const current = await tx
          .select({ id: restaurantPhotos.id })
          .from(restaurantPhotos)
          .where(eq(restaurantPhotos.restaurantId, restaurantId))

        const currentPhotoIds = current.map((item) => item.id)
        const desiredSet = new Set(photoIds)
        const removedPhotoIds = currentPhotoIds.filter((pid) => !desiredSet.has(pid))

        await tx
          .update(restaurantPhotos)
          .set({ sortOrder: null })
          .where(eq(restaurantPhotos.restaurantId, restaurantId))

        if (removedPhotoIds.length > 0) {
          await tx
            .update(restaurantPhotos)
            .set({ restaurantId: null, sortOrder: null })
            .where(inArray(restaurantPhotos.id, removedPhotoIds))
        }

        for (const item of req) {
          await tx
            .update(restaurantPhotos)
            .set({ restaurantId, sortOrder: item.sortOrder })
            .where(eq(restaurantPhotos.id, item.id))
        }
      })

      return c.json({ success: true })
    },
  )
  .post(
    '/:id/photos',
    zValidator('param', restaurantIdSchema),
    zValidator('form', uploadPhotoSchema),
    async (c) => {
      const db = c.get('db')
      const { id } = c.req.valid('param')
      const { photo, sortOrder } = c.req.valid('form')

      const extension = ALLOWED_MIME_TYPES[photo.type]
      const filename = `${randomUUID()}.${extension}`

      const arrayBuffer = await photo.arrayBuffer()
      await c.env.R2.put(filename, arrayBuffer, {
        httpMetadata: { contentType: photo.type },
      })

      await db.insert(restaurantPhotos).values({
        restaurantId: id,
        filename: filename,
        sortOrder: sortOrder,
      })

      return c.json({ success: true })
    },
  )

export default restaurantsRouter
