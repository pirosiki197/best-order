import { Hono } from 'hono'
import type { Env } from '../types'
import type { Headers as CFHeaders } from '@cloudflare/workers-types'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { randomUUID } from 'crypto'
import { restaurantPhotos } from '../db/schema'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
}

const uploadPhotoSchema = z.object({
  photo: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, { error: 'ファイルサイズが大きすぎます' })
    .refine((file) => file.type in ALLOWED_MIME_TYPES, {
      error: '許可されていないファイルです',
    }),
})

const photosRouter = new Hono<Env>()
  .post('/', zValidator('form', uploadPhotoSchema), async (c) => {
    const db = c.get('db')

    const { photo } = c.req.valid('form')

    const extension = ALLOWED_MIME_TYPES[photo.type]
    const filename = `${randomUUID()}.${extension}`

    const arrayBuffer = await photo.arrayBuffer()
    await c.env.R2.put(filename, arrayBuffer, {
      httpMetadata: { contentType: photo.type },
    })

    const [inserted] = await db
      .insert(restaurantPhotos)
      .values({ filename })
      .returning({ id: restaurantPhotos.id })

    return c.json({ id: inserted.id }, 201)
  })
  .get('/:filename', async (c) => {
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
