import { createFalClient, type FalClient } from '@fal-ai/client'

let falClientCache: { credentials: string; client: FalClient } | null = null

export const getFalClient = (credentials: string) => {
  if (!falClientCache || falClientCache.credentials !== credentials) {
    falClientCache = {
      credentials,
      client: createFalClient({
        credentials,
        suppressLocalCredentialsWarning: true,
      }),
    }
  }
  return falClientCache.client
}

export const resetFalClientCache = () => {
  falClientCache = null
}
