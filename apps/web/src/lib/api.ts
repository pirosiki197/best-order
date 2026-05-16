import { hc } from 'hono/client'
import type { AppType } from '../../../server/src/index'

const BASE_URL = '/'
export const client = hc<AppType>(BASE_URL)
