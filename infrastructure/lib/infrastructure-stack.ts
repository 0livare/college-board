import * as cdk from 'aws-cdk-lib/core'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as logs from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // ─── DynamoDB ────────────────────────────────────────────────────────────
    //
    // Single-table design. Three record types share one table:
    //
    //   Current item:      PK = ITEM#{id}   SK = CURRENT
    //   Version snapshot:  PK = ITEM#{id}   SK = VERSION#{versionId}
    //   Audit event:       PK = ITEM#{id}   SK = AUDIT#{auditId}
    //
    // GSI (ListItemsIndex): PK = itemType (fixed string "ITEM"), SK = id
    //   Only current-item records carry these attributes, so the GSI is a
    //   sparse index that supports paginated list queries without a full scan.

    const table = new dynamodb.Table(this, 'ExamItemsTable', {
      tableName: 'exam-items',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    // Sparse GSI for list queries: only current-item records include
    // GSI1PK="ITEM" and GSI1SK=<id>, so only those records appear in the index.
    table.addGlobalSecondaryIndex({
      indexName: 'ListItemsIndex',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    })

    // ─── Cognito ─────────────────────────────────────────────────────────────
    //
    // User Pool issues JWTs. API Gateway verifies them before invoking Lambda.

    const userPool = new cognito.UserPool(this, 'ExamItemsUserPool', {
      userPoolName: 'exam-items-user-pool',
      selfSignUpEnabled: false, // admin-managed users only
      signInAliases: { email: true },
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const userPoolClient = new cognito.UserPoolClient(
      this,
      'ExamItemsUserPoolClient',
      {
        userPool,
        userPoolClientName: 'exam-items-client',
        authFlows: {
          userPassword: true,
          userSrp: true,
        },
        generateSecret: false, // public client (SPA / CLI)
      },
    )

    // ─── Lambda ──────────────────────────────────────────────────────────────
    //
    // Single function handles all routes. The warm container reuses the
    // DynamoDB client across requests, reducing latency and connection overhead.
    // The trade-off vs. per-route functions is noted in ARCHITECTURE.md.

    const logGroup = new logs.LogGroup(this, 'ExamItemsLambdaLogs', {
      logGroupName: '/aws/lambda/exam-items-handler',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const handler = new lambda.Function(this, 'ExamItemsHandler', {
      functionName: 'exam-items-handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'lambda-handler.handler',
      // Points to the compiled JS output of the main app (pnpm build -> dist/).
      // Adjust the path if the output directory differs.
      code: lambda.Code.fromAsset('../dist'),
      environment: {
        USE_DYNAMODB: 'true',
        DYNAMODB_TABLE_NAME: table.tableName,
      },
      timeout: cdk.Duration.seconds(15),
      memorySize: 256,
      logGroup,
    })

    // Least-privilege: Lambda can only read/write this specific table.
    table.grantReadWriteData(handler)

    // ─── API Gateway ─────────────────────────────────────────────────────────
    //
    // REST API with a Cognito authorizer. Every route requires a valid JWT
    // issued by the User Pool above.

    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      'ExamItemsCognitoAuthorizer',
      {
        cognitoUserPools: [userPool],
        authorizerName: 'exam-items-cognito-authorizer',
      },
    )

    const defaultMethodOptions: apigateway.MethodOptions = {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    }

    const api = new apigateway.RestApi(this, 'ExamItemsApi', {
      restApiName: 'exam-items-api',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      deployOptions: {
        stageName: 'v1',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false, // avoid logging request bodies (may contain PII)
      },
    })

    const lambdaIntegration = new apigateway.LambdaIntegration(handler)

    // Routes
    const items = api.root.addResource('api').addResource('items')
    items.addMethod('GET', lambdaIntegration, defaultMethodOptions) // list items
    items.addMethod('POST', lambdaIntegration, defaultMethodOptions) // create item

    const item = items.addResource('{id}')
    item.addMethod('GET', lambdaIntegration, defaultMethodOptions) // get item
    item.addMethod('PUT', lambdaIntegration, defaultMethodOptions) // update item

    const versions = item.addResource('versions')
    versions.addMethod('POST', lambdaIntegration, defaultMethodOptions) // create version

    const audit = item.addResource('audit')
    audit.addMethod('GET', lambdaIntegration, defaultMethodOptions) // get audit trail

    // ─── Outputs ─────────────────────────────────────────────────────────────

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Base URL for the Exam Items API',
    })

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    })

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    })

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
      description: 'DynamoDB table name',
    })
  }
}
