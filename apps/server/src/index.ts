import { Hono } from 'hono'
import { Env } from './types'
import { drizzle } from 'drizzle-orm/node-postgres'

const app = new Hono<Env>().basePath('/api')

app.use('*', async (c, next) => {
  const connectionString = c.env.HYPERDRIVE.connectionString
  c.set('db', drizzle(connectionString))
  await next()
})

const routes = app.get('/', (c) => {
  return c.text('Hello, world!')
})

export type AppType = typeof routes

export default routes
