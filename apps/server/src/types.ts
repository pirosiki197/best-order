import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

export type Env = {
  Bindings: {
    DATABASE_URL: string
    HYPERDRIVE: {
      connectionString: string
    }
  }
  Variables: {
    db: PostgresJsDatabase
  }
}
