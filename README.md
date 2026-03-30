# College Board

## Running this project locally

```bash
pnpm i
pnpm dev
```

Download the [Bruno API Client][bruno], open the documented requests in the `/bruno` directory, change the environment to `local` and run the requests to hit the local server.

## Noteworthy project attributes

- The [ARCHITECTURE.excalidraw](ARCHITECTURE.excalidraw) file has a visual representation of the system architecture.
  - You can open this file with https://excalidraw.com.
- Infrastructure as code is in the `/infrastructure` directory, implemented with AWS CDK.
- Requests for the [Bruno API Client][bruno] (it's like postman but [better](https://www.olivare.net/blog/2025/bruno)) live in `/bruno`.
- Zod schemas and derived types are in `/src/types/exam-item-schemas.ts`.
  - All fields are strongly typed, including question type variations
  - Schemas extend one another to avoid duplication
- All Ids are [TypeIDs](https://www.olivare.net/blog/2025/dx-of-ids#typeid). See `/src/helpers/id.ts`. TypeIDs are:
  - Strongly typed
  - Globally unique
  - Lexicographically sortable
  - Easily visually distinguished with a prefix
  - You can double click them and the whole thing is selected :mind_blown:
- Every endpoint exclusively returns [Results](https://www.olivare.net/blog/2025/ts-result#result--exception)
  - Any TypeScript client hitting this API can strongly type the fetch calls in such a way that checking errors becomes a compiler requirement

## Remaining TODOs and future improvements

- Add unit tests
- Change the shape of `ListItemsQuery` to support Dynamo's cursor-based pagination
  - For example we could base-64 encode the `LastEvaluatedKey` and have the user pass it back for subsequent calls
- Manually test the DynamoDBStorage implementation with either a local or deployed DynamoDB
- Add audit-trail entries to the DynamoDBStorage implementation for create/update/delete operations
- Further consider the relationship between versions and audits
  - Currently the in-memory and dynamo db implementations work differently
  - The in-memory implementation creates a new version on every update, but the DynamoDB implementation only creates a new version when create version is explicitly called.
  - I went this direction because it seemed to be what the prompt was asking for given the supplied endpoints, but if dynamo were changed to just create a new version for every update, the need for separate audit db entries would mostly go away

[bruno]: https://www.usebruno.com
