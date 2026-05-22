import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from './db/schema'
import type { R2Bucket } from '@cloudflare/workers-types'

export type Env = {
  Bindings: {
    R2: R2Bucket
    R2_PUBLIC_URL: string
    HYPERDRIVE: {
      connectionString: string
    }
  }
  Variables: {
    db: NodePgDatabase<typeof schema>
  }
}
