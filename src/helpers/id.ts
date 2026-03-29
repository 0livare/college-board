import { type TypeId, typeidUnboxed } from 'typeid-js'

export function genId<T extends IdTypes>(
  idType: T,
): TypeId<(typeof prefixes)[T]> {
  // TypeIDs are a modern, type-safe extension of UUIDv7. Inspired by a similar use of prefixes in Stripe's APIs.
  // Benefits: https://github.com/jetify-com/typeid?tab=readme-ov-file#benefits

  switch (idType) {
    default:
      return typeidUnboxed(prefixes[idType] || idType)
  }
}

type IdTypes = keyof typeof prefixes
const prefixes = {
  examItem: 'q',
  // version: 'v',
} as const

export type ExamItemId = TypeId<'q'>
// export type VersionId = TypeId<'v'>
