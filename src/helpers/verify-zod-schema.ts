import { z } from 'zod'
import { Result } from '@praha/byethrow'

export function checkZodSchema<T>(schema: z.ZodType<T>, data: unknown) {
  const parsed = schema.safeParse(data)
  if (parsed.success) return Result.succeed(parsed.data)

  console.error({ err: parsed.error, msg: 'Zod schema validation failed' })
  return Result.fail(parsed.error.issues)
}
