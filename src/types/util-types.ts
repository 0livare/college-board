import type { Result } from '@praha/byethrow'

export interface LambdaResult<T = any, E = any> {
  statusCode: number
  body: Result.Result<T, E>
}
