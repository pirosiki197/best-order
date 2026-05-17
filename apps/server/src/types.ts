import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from './db/schema'

export type Env = {
  Bindings: {
    DATABASE_URL: string
    HYPERDRIVE: {
      connectionString: string
    }
  }
  Variables: {
    db: NodePgDatabase<typeof schema>
  }
}
