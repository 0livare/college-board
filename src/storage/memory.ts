/**
 * In-Memory Storage Implementation
 *
 * This is a simple in-memory storage for local development and testing.
 * Data is lost when the server restarts.
 */

import {
  ExamItem,
  CreateItemRequest,
  UpdateItemRequest,
  ListItemsQuery,
} from '../types/exam-item-types.js'
import { ItemStorage } from './interface.js'
import { genId, ExamItemId } from '../helpers/id.js'

export class MemoryStorage implements ItemStorage {
  private items: Map<ExamItemId, ExamItem> = new Map()
  private versions: Map<ExamItemId, ExamItem[]> = new Map()

  async createItem(data: CreateItemRequest): Promise<ExamItem> {
    const now = Date.now()
    const item: ExamItem = {
      id: genId('examItem'),
      ...data,
      metadata: {
        ...data.metadata,
        created: now,
        lastModified: now,
        version: 1,
      },
    }

    this.items.set(item.id, item)
    this.versions.set(item.id, [{ ...item }])

    return item
  }

  async getItem(id: ExamItemId): Promise<ExamItem | null> {
    return this.items.get(id) || null
  }

  async updateItem(
    id: ExamItemId,
    data: UpdateItemRequest,
  ): Promise<ExamItem | null> {
    const item = this.items.get(id)
    if (!item) return null

    const updated: ExamItem = {
      ...item,
      ...data,
      content: data.content
        ? { ...item.content, ...data.content }
        : item.content,
      metadata: {
        ...item.metadata,
        ...(data.metadata || {}),
        lastModified: Date.now(),
        version: item.metadata.version + 1,
      },
    }

    this.items.set(id, updated)

    // Save version history
    const history = this.versions.get(id) || []
    history.push({ ...updated })
    this.versions.set(id, history)

    return updated
  }

  async listItems(
    query: ListItemsQuery,
  ): Promise<{ items: ExamItem[]; total: number }> {
    let items = Array.from(this.items.values())

    // Filter by subject
    if (query.subject) {
      items = items.filter((item) => item.subject === query.subject)
    }

    // Filter by status
    if (query.status) {
      items = items.filter((item) => item.metadata.status === query.status)
    }

    const total = items.length

    // Pagination
    const offset = query.offset || 0
    const limit = query.limit || 10
    items = items.slice(offset, offset + limit)

    return { items, total }
  }

  async createVersion(id: ExamItemId): Promise<ExamItem | null> {
    const item = this.items.get(id)
    if (!item) return null

    // Create a new version (copy of current state)
    const newVersion: ExamItem = {
      ...item,
      metadata: {
        ...item.metadata,
        version: item.metadata.version + 1,
        lastModified: Date.now(),
      },
    }

    this.items.set(id, newVersion)

    const history = this.versions.get(id) || []
    history.push({ ...newVersion })
    this.versions.set(id, history)

    return newVersion
  }

  async getAuditTrail(id: ExamItemId): Promise<ExamItem[]> {
    return this.versions.get(id) || []
  }
}
