import { Hono } from 'hono'

const app = new Hono().basePath('/api')

const routes = app.get('/', (c) => {
  return c.text('Hello, world!')
})

export type AppType = typeof routes

export default routes
