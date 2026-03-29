export interface LambdaResult<T = any> {
  statusCode: number
  body: T
}
