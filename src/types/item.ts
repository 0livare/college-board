/**
 * Exam Item Types
 */

type DifficultyLevel = 1 | 2 | 3 | 4 | 5
type QuestionType = 'multiple-choice' | 'free-response' | 'essay'
type SecurityLevel = 'standard' | 'secure' | 'highly-secure'
type ItemStatus = 'draft' | 'review' | 'approved' | 'archived'
/** Unix timestamp in milliseconds */
type Timestamp = number

export interface ExamItem<T extends QuestionType = QuestionType> {
  id: string
  subject: string // e.g., "AP Biology", "AP Calculus"
  itemType: T
  difficulty: DifficultyLevel
  content: T extends 'multiple-choice'
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

export interface CreateItemRequest {
  subject: string
  itemType: QuestionType
  difficulty: DifficultyLevel
  content: {
    question: string
    options?: string[]
    correctAnswer: string
    explanation: string
  }
  metadata: {
    author: string
    status: ItemStatus
    tags: string[]
  }
  securityLevel: SecurityLevel
}

export interface UpdateItemRequest {
  subject?: string
  itemType?: QuestionType
  difficulty?: DifficultyLevel
  content?: Partial<ExamItem['content']>
  metadata?: Partial<ExamItem['metadata']>
  securityLevel?: SecurityLevel
}

export interface ListItemsQuery {
  limit?: number
  offset?: number
  subject?: string
  status?: ItemStatus
}
