import { Result } from '@praha/byethrow'
import { createStorage } from '../../storage/index.js'
import { LambdaResult, listItemsQuerySchema } from '../../types/index.js'
import { verifyZodSchema } from '../../helpers/verify-zod-schema.js'

const storage = createStorage()

export async function listItemsHandler(data: unknown): Promise<LambdaResult> {
  const result = verifyZodSchema(listItemsQuerySchema, data)
  if (Result.isFailure(result)) return { statusCode: 400, body: result }

  const list = await storage.listItems(result.value)
  return {
    statusCode: 200,
    body: Result.succeed(list),
  }
}
