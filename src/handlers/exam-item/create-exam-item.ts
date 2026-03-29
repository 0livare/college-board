import { Result } from '@praha/byethrow'
import { verifyZodSchema } from '../../helpers/verify-zod-schema.js'
import { createStorage } from '../../storage/index.js'
import {
  CreateItemRequest,
  createItemSchema,
  LambdaResult,
} from '../../types/index.js'

const storage = createStorage()

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
    throw error
  }
}
