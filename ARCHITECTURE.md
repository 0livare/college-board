# Architecture Documentation

## Data Model Design

> DynamoDB table schema, key design, GSI strategy

Please see the [ARCHITECTURE.excalidraw](ARCHITECTURE.excalidraw) file for a visual representation of the system architecture.

You can open this file with https://excalidraw.com.

> [!note]
> I have some questions about non-functional requirements for this system to determine if a caching strategy is necessary.

### Dynamo DB table schema

One Dynamo table because all queries are item driven

- current item:
  - PK: `ITEM#{id}`
  - SK: `CURRENT`
  - Used for get/create/update item
- version snapshot:
  - PK: `ITEM#{id}`
  - SK: `VERSION#{versionId}`
  - Used for creating and retrieving item versions
- audit event:
  - PK: `ITEM#{id}`
  - SK: `AUDIT#{auditId}`
  - Used for creating and retrieving audit events

#### GSI strategy

Project current items into a GSI

- PK: `ITEM`
- SK: `{id}`

This adds support for the paginated list items query because the `ExamItem` ids that I'm using are lexicographically sortable. Created date could also work for the SK.

However the currently defined `ListItemsQuery` uses limit/offset pagination which is not compatible with DynamoDB's cursor-based pagination. To support this, the API would need to be redesigned to use a cursor instead of an offset. For example we could base-64 encode the `LastEvaluatedKey` and have the user pass it back for subsequent calls

## Infrastructure Choices

> Why you chose specific services and configurations

The exercise was pretty prescriptive about which services were intended to be used:

> "Define resources: Lambda functions, API Gateway, DynamoDB (optional), IAM roles, CloudWatch logs"

### Lambda functions

I decided to deploy the endpoints as a single Lambda function rather than each endpoint as its own Lambda here for simplicity, but also because the API surface is small and all interact with the same domain model so it made sense to keep them together. If this were a larger system with more endpoints, or if there were clear separations in domain models, I would consider splitting into multiple Lambdas.

Deploying a separate Lambda for each handler would allow for individual scaling. But I don't think the benefits of justify the extra complexity over scaling a single Lambda. The single Lambda also has benefits when the warm container reuses the DynamoDB client across requests, reducing latency and connection overhead.

### Cognito

Using Cognito for authentication and user management is the obvious choice for an AWS-centric serverless architecture. It provides a fully managed solution that integrates well with API Gateway via a `CognitoUserPoolsAuthorizer`.

## Scalability

> How your design scales, potential bottlenecks

This design scales well because the main runtime components (API Gateway, Lambda, DynamoDB) are all fully managed AWS services that can horizontally-scale automatically based on demand.

- API Gateway scales automatically with request volume
- Lambda scales horizontally with concurrent executions, and the single-function design allows for efficient reuse of resources like the DynamoDB client
- DynamoDB is designed for high throughput and low latency at scale
  - The aforementioned schema/key design allows for efficient queries
  - Reusing the same partition key for the different item types ensures all of its current/version/audit records are stored together, which optimizes retrieval of an item and its versions/audits

Depending on the non-functional requirements of the system, additional caching layers could be added to help scale read-heavy workflows.

### Potential Bottlenecks

- Because all endpoints are deployed on a single lambda, high traffic to one endpoint could eventually reach concurrency limits and cause throttling for all endpoints.
  - **Solution**: we could split the problem endpoint into its own lambda
- If one item receives a very large amount of write traffic, that could create a hot partition in Dynamo, which would lead to throttling.
  - **Solution**: we could shard the partition by using something like `ITEM#{id}#AUDIT#{shard}` as the partition key for audits for example. However this would obviously add a ton of complexity to retrieving the audits
- The GSI improves read scalability for listing items, but every write to a current item also updates the index, adding extra write overhead
  - **Solution**: This is a well understood trade-off with Dynamo
- Versions and audit events are append only, which is good for traceability but can cause these collections to grow indefinitely.
  - **Solution**: We could add a TTL to audit events or old versions. Or we could move old versions to cold storage.

## Security

> Authentication, authorization, encryption, IAM policies

- Cognito for authentication and user management, integrated with API Gateway for endpoint protection
- Lambda(s) assigned least-privilege IAM role scoped to just this table and GSI
- AWS managed encryption at rest for DynamoDB
- CloudWatch logs for Lambda execution + error monitoring

## Trade-offs

> What you prioritized and what you'd add with more time

- I discussed the trade-offs of a single Lambda vs multiple Lambdas above in the infrastructure section.

### Remaining TODOs

- Add unit tests
- Change the shape of `ListItemsQuery` to support Dynamo's cursor-based pagination
  - For example we could base-64 encode the `LastEvaluatedKey` and have the user pass it back for subsequent calls
  - Adding support to dynamo for subject-based filtering is another TODO to match the memory storage solution. This could be accomplished by adding a second GSI projected only from current item records with
    - `GSI2PK=SUBJECT#{subject}`
    - `GSI2SK=ITEM#{id}`
- Manually test the DynamoDBStorage implementation with either a local or deployed DynamoDB
- Add audit-trail entries to the DynamoDBStorage implementation for create/update/delete operations
- Further consider the relationship between versions and audits
  - Currently the in-memory and dynamo db implementations work differently
  - The in-memory implementation creates a new version on every update, but the DynamoDB implementation only creates a new version when create version is explicitly called.
  - I went this direction because it seemed to be what the prompt was asking for given the supplied endpoints, but I think a better direction would be to change Dynamo to just create a new version for every update. We then could remove the concept of audits entirely from this solution. Audit logs could still be useful for other kinds of information, just not version history.
- End-to-end automated tests
- Either convert the project to a monorepo or combine the two package.json files because having two separate dependency installations inside of one project is awkward.

## Changes I made to the supplied code

- For the in-memory storage implementation, `createVersion` and `updateItem` were basically identical so I changed `updateItem` to just call `createVersion`
- I moved the `ExamItem.itemType` field inside the `ExamItem.content` (as `type`) to allow creating a proper discriminated union to type the question content.
- I changed version from a number to a typeid which are lexicographically sortable by creation time. While a single incrementing integer is very easy to understand, it becomes a problem when used as a Dynamo sort key because in order for the integer to be lexicographically sortable, it has to be zero-padded to a fixed length and you would have to choose that length upfront.
