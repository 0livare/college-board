import { Result } from '@praha/byethrow'
import { createStorage } from '../../storage/index.js'
import { LambdaResult } from '../../types/index.js'
import { ExamItemId } from '../../helpers/id.js'

const storage = createStorage()

export async function versionItemHandler(
  id: ExamItemId,
): Promise<LambdaResult> {
  return {
    statusCode: 500,
    body: Result.fail('versionItemHandler is not implemented'),
  }
}
