import { Result } from '@praha/byethrow'
import type { ExamItemId } from '../helpers/id.js'
import { verifyZodSchema } from '../helpers/verify-zod-schema.js'
import { createStorage } from '../storage/index.js'
import {
  CreateItemRequest,
  createItemSchema,
  LambdaResult,
} from '../types/index.js'

/**
 * Example Handler
 *
 * This demonstrates how to create a handler for the API.
 * You can use this as a template for implementing the required endpoints.
 */

const storage = createStorage()

export async function getItemHandler(id: ExamItemId) {
  try {
    const item = await storage.getItem(id)
    if (!item) {
      return { statusCode: 404, body: Result.fail('Item not found') }
    }

    return { statusCode: 200, body: Result.succeed(item) }
  } catch (error) {
    console.error('Error getting item:', error)
    return {
      statusCode: 500,
      body: Result.fail('Internal server error'),
    }
  }
}

export async function createItemHandler(
  data: CreateItemRequest,
): Promise<LambdaResult> {
  try {
    const result = verifyZodSchema(createItemSchema, data)
    if (Result.isFailure(result)) {
      return { statusCode: 400, body: result }
    }

    const item = await storage.createItem(result.value)
    return {
      statusCode: 201,
      body: Result.succeed(item),
    }
  } catch (error) {
    console.error('Error creating item:', error)
    return {
      statusCode: 500,
      body: Result.fail('Internal server error'),
    }
  }
}

// TODO: Implement other handlers:
// - updateItemHandler
// - listItemsHandler
// - createVersionHandler
// - getAuditTrailHandler
