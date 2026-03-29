/**
 * Local Development Server
 *
 * A simple HTTP server for testing your handlers locally.
 * Run with: pnpm dev
 */

import { createServer, IncomingMessage, ServerResponse } from 'http'
import {
  getItemHandler,
  createItemHandler,
  listItemsHandler,
  updateItemHandler,
  getAuditTrailHandler,
  versionItemHandler,
} from './handlers/exam-item/index.js'
import { LambdaResult } from './types/index.js'
import { Result } from '@praha/byethrow'
import { ExamItemId } from './helpers/id.js'

const PORT = process.env.PORT || 3000

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const { method, url } = req

  // Parse request body
  let body = ''
  req.on('data', (chunk) => (body += chunk))
  await new Promise((resolve) => req.on('end', resolve))

  try {
    const parsedBody = body ? JSON.parse(body) : null

    console.log(`${method} ${url}`)

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS',
    )
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    let result: LambdaResult = {
      statusCode: 404,
      body: Result.fail('Route not found'),
    }

    if (url?.match(/^\/api\/items\/?$/)) {
      if (method === 'GET') {
        result = await listItemsHandler()
      } else if (method === 'POST') {
        result = await createItemHandler(parsedBody)
      }
    } else {
      const match = url?.match(/^\/api\/items\/([^/]+)/)
      const id = match ? (match[1] as ExamItemId) : null

      if (url?.endsWith('/audit')) {
        if (method === 'GET' && id) {
          result = await getAuditTrailHandler(id)
        }
      } else if (url?.endsWith('/versions')) {
        if (method === 'POST' && id) {
          result = await versionItemHandler(id)
        }
      } else if (id) {
        if (method === 'GET') {
          result = await getItemHandler(id)
        } else if (method === 'PATCH') {
          result = await updateItemHandler(id, parsedBody)
        }
      }
    }

    res.writeHead(result.statusCode, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(result.body))
  } catch (error) {
    console.error('Server error:', error)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(Result.fail('Internal server error')))
  }
}

const server = createServer(handleRequest)

server.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`)
  console.log(`\nExample endpoints:`)
  console.log(`  GET    http://localhost:${PORT}/api/items`)
  console.log(`  POST   http://localhost:${PORT}/api/items`)
  console.log(`  GET    http://localhost:${PORT}/api/items/:id`)
  console.log(`  PATCH  http://localhost:${PORT}/api/items/:id`)
  console.log(`  GET    http://localhost:${PORT}/api/items/:id/audit`)
  console.log(`  POST   http://localhost:${PORT}/api/items/:id/versions`)
  console.log(`\nPress Ctrl+C to stop\n`)
})
