import * as cdk from 'aws-cdk-lib';
import * as lambdanode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { generateBatch } from "../shared/util";
import { games, gameDevelopers } from "../seed/games";
import { Construct } from 'constructs';

export class GameStoreAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    
    const gamestoreFn = new lambdanode.NodejsFunction(this, "GameStoreFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/gamestore.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
    });

    const gamestoreFnURL = gamestoreFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.AWS_IAM,
      cors: { allowedOrigins: ["*"] },
    });

    
    const gamesTable = new dynamodb.Table(this, "GamesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "id", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Games",
    });

    
    const gameDeveloperTable = new dynamodb.Table(this, "GameDeveloperTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "gameId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "developerName", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "GameDeveloper",
    });

    
    gameDeveloperTable.addLocalSecondaryIndex({
      indexName: "roleIx",
      sortKey: { name: "roleName", type: dynamodb.AttributeType.STRING },
    });

    
    new custom.AwsCustomResource(this, "gamesddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [gamesTable.tableName]: generateBatch(games),
            [gameDeveloperTable.tableName]: generateBatch(gameDevelopers),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("gamesddbInitData"),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [gamesTable.tableArn, gameDeveloperTable.tableArn],
      }),
    });

    
    const getGameByIdFn = new lambdanode.NodejsFunction(this, "GetGameByIdFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getGameById.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: gamesTable.tableName,
        REGION: 'eu-west-1',
      },
    });

    const getGameByIdURL = getGameByIdFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: { allowedOrigins: ["*"] },
    });

    gamesTable.grantReadData(getGameByIdFn);

    
    new cdk.CfnOutput(this, "Get Game Function Url", { value: getGameByIdURL.url });

    
    new cdk.CfnOutput(this, "GameStore Function Url", { value: gamestoreFnURL.url });

    
    const getAllGamesFn = new lambdanode.NodejsFunction(this, "GetAllGamesFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getAllGames.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: gamesTable.tableName,
        REGION: 'eu-west-1',
      },
    });

    const getAllGamesURL = getAllGamesFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: { allowedOrigins: ["*"] },
    });

    gamesTable.grantReadData(getAllGamesFn);

    
    new cdk.CfnOutput(this, "Get All Games Function Url", { value: getAllGamesURL.url });

    
    const getGameDevelopersFn = new lambdanode.NodejsFunction(this, 'GetGameDevelopersFn', {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getGameDevelopers.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        CAST_TABLE_NAME: gameDeveloperTable.tableName,
        REGION: 'eu-west-1',
      },
    });

    const getGameDevelopersURL = getGameDevelopersFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: { allowedOrigins: ['*'] },
    });

    gameDeveloperTable.grantReadData(getGameDevelopersFn);

    new cdk.CfnOutput(this, 'Get Game Developers Url', { value: getGameDevelopersURL.url });
  }
}
