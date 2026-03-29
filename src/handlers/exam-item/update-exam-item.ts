import { Result } from '@praha/byethrow'
import { createStorage } from '../../storage/index.js'
import { LambdaResult, UpdateItemRequest } from '../../types/index.js'
import { ExamItemId } from '../../helpers/id.js'

const storage = createStorage()

export async function updateItemHandler(
  id: ExamItemId,
  data: UpdateItemRequest,
): Promise<LambdaResult> {
  return {
    statusCode: 500,
    body: Result.fail('updateItemHandler is not implemented'),
  }
}
