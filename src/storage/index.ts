/**
 * Storage Factory
 *
 * Automatically selects the appropriate storage backend based on environment variables.
 * Defaults to in-memory storage for easy local development.
 */

import { ItemStorage } from './interface.js'
import { MemoryStorage } from './memory.js'
import { DynamoDBStorage } from './dynamodb.js'

let storage: ItemStorage | null = null

export function createStorage(): ItemStorage {
  if (storage) return storage

  if (process.env.USE_DYNAMODB === 'true') {
    console.info('📦 Using DynamoDB storage')
    storage = new DynamoDBStorage()
  } else {
    console.info('📦 Using in-memory storage')
    storage = new MemoryStorage()
  }

  return storage
}

export * from './interface.js'
