/**
 * Storage Interface
 *
 * This interface defines the contract for item storage.
 * Implement this interface for different storage backends (in-memory, DynamoDB, etc.)
 */

import type { ExamItemId } from '../helpers/id.js'
import type {
  ExamItem,
  CreateItemRequest,
  UpdateItemRequest,
  ListItemsQuery,
} from '../types/exam-item-schemas.js'

export interface ItemStorage {
  createItem(data: CreateItemRequest): Promise<ExamItem>
  getItem(id: ExamItemId): Promise<ExamItem | null>
  updateItem(id: ExamItemId, data: UpdateItemRequest): Promise<ExamItem | null>
  listItems(
    query: ListItemsQuery,
  ): Promise<{ items: ExamItem[]; total: number }>
  createVersion(id: ExamItemId): Promise<ExamItem | null>
  getAuditTrail(id: ExamItemId): Promise<ExamItem[]>
}
