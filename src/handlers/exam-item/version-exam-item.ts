import { Result } from '@praha/byethrow'
import { createStorage } from '../../storage/index.js'
import { LambdaResult } from '../../types/index.js'
import { ExamItemId } from '../../helpers/id.js'
import { unknownErrorResponse } from '../../helpers/unknown-error-response.js'

const storage = createStorage()

export async function versionItemHandler(
  id: ExamItemId,
): Promise<LambdaResult> {
  try {
    const item = await storage.createVersion(id)
    if (!item) return { statusCode: 404, body: Result.fail('Item not found') }

    return { statusCode: 200, body: Result.succeed(item) }
  } catch (err) {
    console.error({ err, msg: 'Error creating version', itemId: id })
    return unknownErrorResponse()
  }
}
