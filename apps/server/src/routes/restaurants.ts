import { Hono } from 'hono'
import type { Env } from '../types'
import { restaurants } from '../db/schema'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

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
    const result = await db.select().from(restaurants)
    return c.json({ result: result })
  })
  .post('/', zValidator('json', createRestaurantSchema), async (c) => {
    const db = c.get('db')
    const req = c.req.valid('json')

    const [newRestaurant] = await db.insert(restaurants).values(req).returning()

    return c.json({ id: newRestaurant.id }, 201)
  })

export default restaurantsRouter
