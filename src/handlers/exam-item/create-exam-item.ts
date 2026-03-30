import { Result } from '@praha/byethrow'
import { checkZodSchema } from '../../helpers/verify-zod-schema.js'
import { createStorage } from '../../storage/index.js'
import { createItemSchema, LambdaResult } from '../../types/index.js'
import { unknownErrorResponse } from '../../helpers/unknown-error-response.js'

const storage = createStorage()

export async function createItemHandler(data: unknown): Promise<LambdaResult> {
  try {
    const result = checkZodSchema(createItemSchema, data)
    if (Result.isFailure(result)) return { statusCode: 400, body: result }

    const item = await storage.createItem(result.value)
    return {
      statusCode: 201,
      body: Result.succeed(item),
    }
  } catch (err) {
    console.error({ err, msg: 'Error creating item' })
    return unknownErrorResponse()
  }
}
