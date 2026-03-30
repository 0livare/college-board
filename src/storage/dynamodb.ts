/**
 * DynamoDB Storage Implementation (Optional)
 *
 * This implementation uses AWS DynamoDB for persistent storage.
 *
 * To use this:
 * 1. Set environment variable: USE_DYNAMODB=true
 * 2. Configure AWS credentials (or use DynamoDB Local)
 * 3. Set DYNAMODB_TABLE_NAME (or use default "ExamItems")
 *
 * For DynamoDB Local:
 * - Download from: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html
 * - Run: java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
 * - Set DYNAMODB_ENDPOINT=http://localhost:8000
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'
import {
  ExamItem,
  CreateItemRequest,
  UpdateItemRequest,
  ListItemsQuery,
} from '../types/index.js'
import { ItemStorage } from './interface.js'
import { type ExamItemId, genId, type VersionId } from '../helpers/id.js'

// Single-table key helpers
//
//   Current item:     PK = ITEM#<id>   SK = CURRENT
//   Version snapshot: PK = ITEM#<id>   SK = VERSION#<versionId>
//
// Only current-item records carry GSI1PK and GSI1SK, making the
// ListItemsIndex GSI a sparse index (version records are excluded).
function itemIdToPk(id: ExamItemId) {
  return `ITEM#${id}`
}
function versionIdToSk(versionId: VersionId) {
  return `VERSION#${versionId}`
}

const CURRENT = 'CURRENT'
const LIST_ITEMS_INDEX = 'ListItemsIndex'
const GSI1PK_VALUE = 'ITEM' // fixed value written on all current-item records

// Strip table-internal keys before returning an ExamItem to callers
function toExamItem(record: Record<string, unknown>): ExamItem {
  const { PK: _PK, SK: _SK, GSI1PK: _gsi1pk, GSI1SK: _gsi1sk, ...item } = record
  return item as ExamItem
}

export class DynamoDBStorage implements ItemStorage {
  private client: DynamoDBDocumentClient
  private tableName: string

  constructor() {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      ...(process.env.DYNAMODB_ENDPOINT && {
        endpoint: process.env.DYNAMODB_ENDPOINT,
      }),
    })

    this.client = DynamoDBDocumentClient.from(dynamoClient)
    this.tableName = process.env.DYNAMODB_TABLE_NAME || 'ExamItems'
  }

  async createItem(data: CreateItemRequest): Promise<ExamItem> {
    const now = Date.now()
    const item: ExamItem = {
      id: genId('examItem'),
      ...data,
      metadata: {
        ...data.metadata,
        created: now,
        lastModified: now,
        version: genId('version'),
      },
    }

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: itemIdToPk(item.id),
          SK: CURRENT,
          GSI1PK: GSI1PK_VALUE, // sparse GSI — present only on current-item records
          GSI1SK: item.id,
          ...item,
        },
      }),
    )

    return item
  }

  async getItem(id: ExamItemId): Promise<ExamItem | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { PK: itemIdToPk(id), SK: CURRENT },
      }),
    )

    if (!result.Item) return null
    return toExamItem(result.Item)
  }

  async updateItem(
    id: ExamItemId,
    data: UpdateItemRequest,
  ): Promise<ExamItem | null> {
    const existing = await this.getItem(id)
    if (!existing) return null

    const updated: ExamItem = {
      ...existing,
      ...data,
      content: data.content
        ? { ...existing.content, ...data.content }
        : existing.content,
      metadata: {
        ...existing.metadata,
        ...(data.metadata || {}),
        lastModified: Date.now(),
        version: genId('version'),
      },
    }

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: itemIdToPk(updated.id),
          SK: CURRENT,
          GSI1PK: GSI1PK_VALUE,
          GSI1SK: updated.id,
          ...updated,
        },
      }),
    )

    return updated
  }

  // ⚠️ TODO: This implementation does not work with the currently defined limit/offset pagination.
  // Dynamo uses cursor-based pagination and so ListItemsQuery must change to support this.
  async listItems(
    query: ListItemsQuery,
  ): Promise<{ items: ExamItem[]; total: number }> {
    const filterParts: string[] = []
    const expressionValues: Record<string, unknown> = { ':gsi1pk': GSI1PK_VALUE }

    if (query.subject) {
      filterParts.push('subject = :subject')
      expressionValues[':subject'] = query.subject
    }
    if (query.itemStatus) {
      filterParts.push('itemStatus = :itemStatus')
      expressionValues[':itemStatus'] = query.itemStatus
    }
    const filterExpression =
      filterParts.length > 0 ? filterParts.join(' AND ') : undefined

    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: LIST_ITEMS_INDEX,
        KeyConditionExpression: 'GSI1PK = :gsi1pk',
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionValues,
        Limit: query.limit ?? 10,
      }),
    )

    const items = (result.Items ?? []).map((r) => toExamItem(r))
    return { items, total: result.Count ?? 0 }
  }

  async createVersion(id: ExamItemId): Promise<ExamItem | null> {
    const current = await this.getItem(id)
    if (!current) return null

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: itemIdToPk(id),
          SK: versionIdToSk(genId('version')),
          ...current,
        },
      }),
    )

    return current
  }

  async getAuditTrail(id: ExamItemId): Promise<ExamItem[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :PK AND begins_with(SK, :prefix)',
        ExpressionAttributeValues: {
          // TypeIDs are UUIDv7-based so lexicographic order == creation order.
          ':PK': itemIdToPk(id),
          ':prefix': 'VERSION#',
        },
      }),
    )

    return (result.Items ?? []).map((r) =>
      toExamItem(r as Record<string, unknown>),
    )
  }
}
