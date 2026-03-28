import type { ExamItemId } from '../helpers/id'

/** Unix timestamp in milliseconds */
type Timestamp = number

type DifficultyLevel = 1 | 2 | 3 | 4 | 5
type QuestionType = 'multiple-choice' | 'free-response' | 'essay'
type SecurityLevel = 'standard' | 'secure' | 'highly-secure'
type ItemStatus = 'draft' | 'review' | 'approved' | 'archived'
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
    status: ItemStatus
    tags: string[]
  }
  securityLevel: SecurityLevel
}

export type CreateItemRequest<T extends QuestionType = QuestionType> = Omit<
  ExamItem<T>,
  'id' | 'metadata'
> & {
  metadata: {
    author: string
    status: ItemStatus
    tags: string[]
  }
}

export interface UpdateItemRequest<T extends QuestionType = QuestionType> {
  subject?: string
  itemType?: T
  difficulty?: DifficultyLevel
  content?: Partial<QuestionContent<T>>
  metadata?: Partial<ExamItem['metadata']>
  securityLevel?: SecurityLevel
}

export interface ListItemsQuery {
  limit?: number
  offset?: number
  subject?: string
  status?: ItemStatus
}
