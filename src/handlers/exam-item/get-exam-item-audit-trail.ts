import { Result } from '@praha/byethrow'
import { createStorage } from '../../storage/index.js'
import { LambdaResult } from '../../types/index.js'
import { ExamItemId } from '../../helpers/id.js'

const storage = createStorage()

export async function getAuditTrailHandler(
  id: ExamItemId,
): Promise<LambdaResult> {
  return {
    statusCode: 500,
    body: Result.fail('getAuditTrailHandler is not implemented'),
  }
}
