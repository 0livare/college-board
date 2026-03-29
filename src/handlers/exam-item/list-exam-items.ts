import { Result } from '@praha/byethrow'
import { createStorage } from '../../storage/index.js'
import { LambdaResult } from '../../types/index.js'

const storage = createStorage()

export async function listItemsHandler(): Promise<LambdaResult> {
  return {
    statusCode: 500,
    body: Result.fail('Not implemented'),
  }
}
