import { Hono } from 'hono'
import type { Env } from './types'
import { drizzle } from 'drizzle-orm/node-postgres'
import restaurantsRouter from './routes/restaurants'
import * as schema from './db/schema'

const app = new Hono<Env>()
  .basePath('/api')
  .use('*', async (c, next) => {
    const connectionString = c.env.HYPERDRIVE.connectionString
    c.set('db', drizzle(connectionString, { schema }))
    await next()
  })
  .route('/restaurants', restaurantsRouter)

export type AppType = typeof app

export default app
