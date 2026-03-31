import { Result } from '@praha/byethrow'
import { createStorage } from '../../storage/index.js'
import { LambdaResult, updateItemSchema } from '../../types/index.js'
import { ExamItemId } from '../../helpers/id.js'
import { checkZodSchema } from '../../helpers/verify-zod-schema.js'
import { unknownErrorResponse } from '../../helpers/unknown-error-response.js'

const storage = createStorage()

export async function updateItemHandler(
  id: ExamItemId,
  data: unknown,
): Promise<LambdaResult> {
  try {
    const result = checkZodSchema(updateItemSchema, data)
    if (Result.isFailure(result)) return { statusCode: 400, body: result }

    const item = await storage.updateItem(id, result.value)
    if (!item) return { statusCode: 404, body: Result.fail('Item not found') }

    return { statusCode: 200, body: Result.succeed(item) }
  } catch (err) {
    console.error({ err, msg: 'Error updating item', itemId: id })
    return unknownErrorResponse()
  }
}
