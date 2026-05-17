import { Hono } from 'hono'
import type { Env } from '../types'
import { restaurantPhotos, restaurants } from '../db/schema'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { and, eq } from 'drizzle-orm'

const createRestaurantSchema = z.object({
  name: z.string().min(1),
  genre: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  rating: z.number().int().min(1).max(5),
  placeId: z.string(),
  memo: z.string(),
})

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
        mainPhotoUrl: restaurantPhotos.url,
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
  .get('/:id', zValidator('param', z.object({ id: z.coerce.number() })), async (c) => {
    const db = c.get('db')
    const { id } = c.req.valid('param')

    const restaurantDetail = await db.query.restaurants.findFirst({
      where: eq(restaurants.id, id),
      with: {
        photos: true,
      },
    })

    if (!restaurantDetail) {
      return c.json({ message: 'Restaurant not found' }, 404)
    }

    return c.json(restaurantDetail)
  })

export default restaurantsRouter
