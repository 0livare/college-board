import { z } from 'zod'
import type { ExamItemId } from '../helpers/id'
import { type TypeId } from 'typeid-js'

///////////////////////
//
// Lower-level schemas related to the exam items.
//
///////////////////////

/** Unix timestamp in milliseconds */
type Timestamp = number

export const difficultySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
])
export type DifficultyLevel = z.infer<typeof difficultySchema>

export const questionTypeSchema = z.enum([
  'multiple-choice',
  'free-response',
  'essay',
])
export type QuestionType = z.infer<typeof questionTypeSchema>

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

export const questionContentSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(1),
})

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

export const createItemSchema = z
  .object({
    subject: z.string().min(1),
    itemType: questionTypeSchema,
    difficulty: difficultySchema,
    content: questionContentSchema,
    metadata: createMetadataSchema,
    securityLevel: securityLevelSchema,
  })
  .refine(
    (data) => {
      if (data.itemType === 'multiple-choice') {
        const { options } = data.content
        return options !== undefined && options.length >= 2
      }
      return true
    },
    {
      message: 'Multiple-choice questions must have at least 2 options',
      path: ['content', 'options'],
    },
  )
export type CreateItemRequest = z.infer<typeof createItemSchema>

export const updateItemSchema = z.object({
  ...createItemSchema.shape,
  content: questionContentSchema.partial().optional(),
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
  id: z.string().brand<ExamItemId>(),
  metadata: createMetadataSchema.extend({
    created: z.number(),
    lastModified: z.number(),
    version: z.number(),
  }),
})

// Note: Zod inference is not used here because it can't correctly represent
// the generics needed to correctly type QuestionContent (presence of options)
export interface ExamItem<T extends QuestionType = QuestionType> {
  id: ExamItemId
  subject: string // e.g., "AP Biology", "AP Calculus"
  itemType: T
  difficulty: DifficultyLevel
  content: QuestionContent<T>
  metadata: {
    author: string
    created: Timestamp
    lastModified: Timestamp
    version: number
    status: QuestionStatus
    tags: string[]
  }
  securityLevel: SecurityLevel
}

type QuestionContent<T extends QuestionType> = T extends 'multiple-choice'
  ? {
      question: string
      options: string[]
      correctAnswer: string
      explanation: string
    }
  : {
      question: string
      correctAnswer: string
      explanation: string
    }
