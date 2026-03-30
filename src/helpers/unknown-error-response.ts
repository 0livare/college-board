import { Result } from '@praha/byethrow'
import { LambdaResult } from '../types'

export function unknownErrorResponse(): LambdaResult {
  return {
    statusCode: 500,
    body: Result.fail('An unknown error occurred.'),
  }
}
