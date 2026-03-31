import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { Result } from '@praha/byethrow'
import {
  createItemHandler,
  getItemHandler,
  updateItemHandler,
  listItemsHandler,
  versionItemHandler,
  getAuditTrailHandler,
} from './handlers/exam-item/index.js'
import type { ExamItemId } from './helpers/id.js'
import { LambdaResult } from './types/util-types.js'

export async function handler(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const { httpMethod, pathParameters, body } = event
  const id = pathParameters?.id as ExamItemId | undefined
  const parsedBody = parseBody(body)

  let result: LambdaResult = {
    statusCode: 404,
    body: Result.fail('Route not found'),
  }

  if (id) {
    if (event.path.endsWith('/audit')) {
      if (httpMethod === 'GET') {
        result = await getAuditTrailHandler(id)
      }
    } else if (event.path.endsWith('/versions')) {
      if (httpMethod === 'POST') {
        result = await versionItemHandler(id)
      }
    } else {
      if (httpMethod === 'GET') {
        result = await getItemHandler(id)
      } else if (httpMethod === 'PATCH') {
        result = await updateItemHandler(id, parsedBody)
      }
    }
  } else {
    if (httpMethod === 'GET') {
      result = await listItemsHandler(parsedBody)
    } else if (httpMethod === 'POST') {
      result = await createItemHandler(parsedBody)
    }
  }

  return {
    statusCode: result.statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result.body),
  }
}

function parseBody(body: string | null): unknown {
  if (!body) return {}
  try {
    return JSON.parse(body)
  } catch {
    return {}
  }
}
