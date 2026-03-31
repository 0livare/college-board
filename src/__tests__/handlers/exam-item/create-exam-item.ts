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
import { createItemHandler } from '../../../handlers/exam-item/create-exam-item.js'
import { ExamItemId } from '../../../helpers/id.js'
import {
  CreateItemRequest,
  ExamItem,
} from '../../../types/exam-item-schemas.js'

it('should create an item successfully', async () => {
  const itemData: CreateItemRequest = {
    subject: 'AP Biology',
    difficulty: 3,
    content: {
      type: 'multiple-choice',
      question: 'What is photosynthesis?',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      explanation: 'Photosynthesis is the process...',
    },
    metadata: {
      author: 'test-author',
      status: 'draft',
      tags: ['biology', 'photosynthesis'],
    },
    securityLevel: 'standard',
  }

  const result = await createItemHandler(itemData)

  expect(result.statusCode).toBe(201)
  expect(result.body).toHaveProperty('id')
  if ('subject' in result.body) {
    expect(result.body.subject).toBe('AP Biology')
  }
  if ('metadata' in result.body) {
    expect(result.body.metadata).toHaveProperty('author', 'test-author')
  }
})
