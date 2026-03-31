import { type TypeId, typeidUnboxed } from 'typeid-js'
import { z } from 'zod'

//
// Define each ID type
//

type IdTypes = keyof typeof prefixes
const prefixes = {
  examItem: 'q',
  version: 'v',
} as const

export const examItemIdSchema = typeIdZodSchema(prefixes.examItem)
export type ExamItemId = z.infer<typeof examItemIdSchema>
export const versionIdSchema = typeIdZodSchema(prefixes.version)
export type VersionId = z.infer<typeof versionIdSchema>

//
// Zod helper
//

function typeIdZodSchema<const P extends string>(prefix: P) {
  return z.string().transform((value, ctx) => {
    if (!value.startsWith(prefix + '_')) {
      // Pull the key out of the prefixes object given the value
      const idName =
        Object.entries(prefixes).find(([_, p]) => p === prefix)?.[0] || prefix
      ctx.addIssue({ code: 'custom', message: `Invalid ${idName} ID format` })
      return z.NEVER
    }
    return value as TypeId<P>
  })
}

//
// ID generation
//

export function genId<T extends IdTypes>(
  idType: T,
): TypeId<(typeof prefixes)[T]> {
  // TypeIDs are a modern, type-safe extension of UUIDv7. Inspired by a similar use of prefixes in Stripe's APIs.
  // Benefits: https://github.com/jetify-com/typeid?tab=readme-ov-file#benefits

  // This switch is here in case we want to further customize
  // generation logic for different ID types in the future
  switch (idType) {
    default:
      return typeidUnboxed(prefixes[idType] || idType)
  }
}
