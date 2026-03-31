/**
 * Example Test File
 *
 * This demonstrates how to write tests for your handlers.
 * You can use this as a template for testing your implemented endpoints.
 *
 * To run tests:
 *   pnpm test           - Run once
 *   pnpm test:watch     - Run in watch mode
 *   pnpm test:ui        - Run with interactive UI
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { getItemHandler } from '../../../handlers/exam-item/get-exam-item.js'
import { createItemHandler } from '../../../handlers/exam-item/create-exam-item.js'
import { ExamItemId } from '../../../helpers/id.js'
import {
  CreateItemRequest,
  ExamItem,
} from '../../../types/exam-item-schemas.js'

it('should return 404 for non-existent item', async () => {
  const result = await getItemHandler('q_non-existent-id' as ExamItemId)

  expect(result.statusCode).toBe(404)
  expect(result.body).toHaveProperty('error')
  if ('error' in result.body) {
    expect(result.body.error).toBe('Item not found')
  }
})

it('should retrieve an existing item', async () => {
  // First create an item
  const itemData: CreateItemRequest = {
    subject: 'AP Calculus',
    difficulty: 4,
    content: {
      type: 'free-response',
      question: 'Calculate the derivative...',
      correctAnswer: '42',
      explanation: 'Using the chain rule...',
    },
    metadata: {
      author: 'test-author',
      status: 'approved',
      tags: ['calculus', 'derivatives'],
    },
    securityLevel: 'standard',
  }

  const createResult = await createItemHandler(itemData)
  expect(createResult.body).toHaveProperty('id')
  if (!('id' in createResult.body)) {
    throw new Error('Item creation failed')
  }
  const itemId = createResult.body.id

  // Then retrieve it
  const getResult = await getItemHandler(itemId as ExamItemId)

  expect(getResult.statusCode).toBe(200)
  expect(getResult.body).toHaveProperty('id', itemId)
  if ('subject' in getResult.body) {
    expect(getResult.body.subject).toBe('AP Calculus')
  }
})
