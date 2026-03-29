import { z } from 'zod'
import { Result } from '@praha/byethrow'

export function verifyZodSchema<T>(schema: z.ZodType<T>, data: unknown) {
  const parsed = schema.safeParse(data)
  return parsed.success
    ? Result.succeed(parsed.data)
    : Result.fail(parsed.error.issues)
}
