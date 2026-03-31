import { Result } from '@praha/byethrow'
import { createStorage } from '../../storage/index.js'
import { LambdaResult } from '../../types/index.js'
import { ExamItemId } from '../../helpers/id.js'
import { unknownErrorResponse } from '../../helpers/unknown-error-response.js'

const storage = createStorage()

export async function getAuditTrailHandler(
  id: ExamItemId,
): Promise<LambdaResult> {
  try {
    const item = await storage.getAuditTrail(id)
    return { statusCode: 200, body: Result.succeed(item) }
  } catch (err) {
    console.error({ err, msg: 'Error getting audit trail', itemId: id })
    return unknownErrorResponse()
  }
}
