import { Hono } from 'hono'
import type { Env } from '../types'
import type { Headers as CFHeaders } from '@cloudflare/workers-types'

const photosRouter = new Hono<Env>().get('/:filename', async (c) => {
  const filename = c.req.param('filename')

  const ifNoneMatch = c.req.header('If-None-Match')?.replace(/"/g, '')
  const object = await c.env.R2.get(filename, {
    onlyIf: ifNoneMatch ? { etagMatches: ifNoneMatch } : undefined,
  })
  if (!object) return c.json({ message: 'Not Found' }, 404)
  if (!object.body) return c.newResponse(null, 304)

  const headers = new Headers()
  object.writeHttpMetadata(headers as unknown as CFHeaders)
  headers.set('etag', object.httpEtag)
  headers.set('Cache-Control', 'max-age=86400')
  const response = new Response(object.body as unknown as ReadableStream, { headers })

  return response
})

export default photosRouter
