import { z } from 'zod'
import { examItemIdSchema, versionIdSchema } from '../helpers/id'

///////////////////////
//
// Lower-level schemas related to the exam items.
//
///////////////////////

export const difficultySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
])
export type DifficultyLevel = z.infer<typeof difficultySchema>

export const questionStatusSchema = z.enum([
  'draft',
  'review',
  'approved',
  'archived',
])
export type QuestionStatus = z.infer<typeof questionStatusSchema>

export const securityLevelSchema = z.enum([
  'standard',
  'secure',
  'highly-secure',
])
export type SecurityLevel = z.infer<typeof securityLevelSchema>

const questionContentBaseSchema = z.object({
  question: z.string().min(1),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(1),
})

// ⚠️ I have moved the `ExamItem.itemType` field inside the `ExamItem.content`
// (as `type`) to allow creating a proper discriminated union to type the
// question content.
export const questionContentSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.enum(['free-response', 'essay']),
    ...questionContentBaseSchema.shape,
  }),
  z.object({
    type: z.literal('multiple-choice'),
    options: z.array(z.string().min(1)).min(2),
    ...questionContentBaseSchema.shape,
  }),
])
export type QuestionType = z.infer<typeof questionContentSchema>['type']

export const createMetadataSchema = z.object({
  author: z.string().min(1),
  status: questionStatusSchema,
  tags: z.array(z.string()),
})

///////////////////////
//
// App entity schemas
//
///////////////////////

export const createItemSchema = z.object({
  subject: z.string().min(1),
  difficulty: difficultySchema,
  content: questionContentSchema,
  metadata: createMetadataSchema,
  securityLevel: securityLevelSchema,
})
export type CreateItemRequest = z.infer<typeof createItemSchema>

export const updateItemSchema = z.object({
  ...createItemSchema.partial().shape,
  content: questionContentSchema.optional(),
  metadata: createMetadataSchema.partial().optional(),
})
export type UpdateItemRequest = z.infer<typeof updateItemSchema>

export const listItemsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
  subject: z.string().optional(),
  status: questionStatusSchema.optional(),
})
export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>

export const examItemSchema = z.object({
  ...createItemSchema.shape,
  id: examItemIdSchema,
  metadata: createMetadataSchema.extend({
    /** Unix timestamp in milliseconds */
    created: z.number(),
    /** Unix timestamp in milliseconds */
    lastModified: z.number(),
    // ⚠️ I have changed version from a number to a typeid which are
    // lexicographically sortable by creation time.
    // While a single incrementing integer is very easy to understand,
    // it becomes a problem when used as a Dynamo DB sort key because
    // in order for the integer to be lexicographically sortable, it has
    // to be zero-padded to a fixed length and you would have to choose
    // that length upfront.
    version: versionIdSchema,
  }),
})
export type ExamItem = z.infer<typeof examItemSchema>
