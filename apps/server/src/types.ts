import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from './db/schema'
import { R2Bucket } from '@cloudflare/workers-types'

export type Env = {
  Bindings: {
    DATABASE_URL: string
    R2: R2Bucket
    R2_PUBLIC_URL: string
    HYPERDRIVE:
      | {
          connectionString: string
        }
      | undefined
  }
  Variables: {
    db: NodePgDatabase<typeof schema>
  }
}
