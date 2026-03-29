import { Result } from '@praha/byethrow'
import type { ExamItemId } from '../../helpers/id.js'
import { createStorage } from '../../storage/index.js'

const storage = createStorage()

export async function getItemHandler(id: ExamItemId) {
  try {
    const item = await storage.getItem(id)
    if (!item) {
      return { statusCode: 404, body: Result.fail('Item not found') }
    }

    return { statusCode: 200, body: Result.succeed(item) }
  } catch (err) {
    console.error({ err, msg: 'Error getting item', itemId: id })
    return {
      statusCode: 500,
      body: Result.fail('Internal server error'),
    }
  }
}
