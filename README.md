# College Board

## Running this project locally

```bash
pnpm i
pnpm dev
```

## Noteworthy project attributes

- The [ARCHITECTURE.excalidraw](ARCHITECTURE.excalidraw) file has a visual representation of the system architecture.
  - You can open this file with https://excalidraw.com.
- Requests for the [Bruno API Client](https://www.usebruno.com) (it's like postman but [better](https://www.olivare.net/blog/2025/bruno)) live in `/bruno`.
- Zod schemas and derived types are in `src/types/exam-item-schemas.ts`.
  - All fields are strongly typed, including question type variations
  - Schemas extend one another to avoid duplication
- All Ids are [TypeIDs](https://www.olivare.net/blog/2025/dx-of-ids#typeid). See `src/helpers/id.ts`. TypeIDs are:
  - Strongly typed
  - Globally unique
  - Lexicographically sortable
  - Easily visually distinguished with a prefix
  - You can double click them and the whole thing is selected :mind_blown:
- Every endpoint exclusively returns [Results](https://www.olivare.net/blog/2025/ts-result#result--exception)
  - Any TypeScript client hitting this API can strongly type the fetch calls in such a way that checking errors becomes a compiler requirement
