import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as custom from "aws-cdk-lib/custom-resources";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

// Custom imports
import { generateBatch } from "../shared/util";
import { games, gameDevelopers } from "../seed/games";

type AppApiProps = {
  userPoolId: string;
  userPoolClientId: string;
};

export class AppApi extends Construct {
  constructor(scope: Construct, id: string, props: AppApiProps) {
    super(scope, id);


    const authorizerFn = new lambdanode.NodejsFunction(this, "AuthorizerFn", {
        entry: "./lambdas/auth/authorizer.ts",
        architecture: lambda.Architecture.ARM_64,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "handler",
        environment: {
        USER_POOL_ID: props.userPoolId,
        CLIENT_ID: props.userPoolClientId,
        REGION: cdk.Aws.REGION,
      }});


    const requestAuthorizer = new apig.RequestAuthorizer(
      this,
      "RequestAuthorizer",
      {
        identitySources: [apig.IdentitySource.header("cookie")],
        handler: authorizerFn,
        resultsCacheTtl: cdk.Duration.minutes(0),
      }
    );

    // Create DynamoDB tables
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

    const translationTable = new dynamodb.Table(this, "TranslationTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "gameId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "language", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "TranslationTable",
    });

    


    // Initialize data in DynamoDB tables
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

    gamesTable.grantReadData(getGameByIdFn);

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

    gamesTable.grantReadData(getAllGamesFn);


    const getGameDevelopersFn = new lambdanode.NodejsFunction(this, 'GetGameDevelopersFn', {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getGameDevelopers.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        GAME_DEVELOPER_TABLE_NAME: gameDeveloperTable.tableName,
        GAMES_TABLE_NAME: gamesTable.tableName,
        REGION: 'eu-west-1',
      },
    });

    gameDeveloperTable.grantReadData(getGameDevelopersFn);
    gamesTable.grantReadData(getGameDevelopersFn);


    // API Gateway setup
    const api = new apig.RestApi(this, "GameStoreAPI", {
      description: "Game Store API",
      deployOptions: {
        stageName: "dev",
      },
      endpointTypes: [apig.EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: apig.Cors.ALL_ORIGINS,
      },
    });

    // API routes setup
    const gamesEndpoint = api.root.addResource("games");
    gamesEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getAllGamesFn, { proxy: true })
    );

    const gameEndpoint = gamesEndpoint.addResource("{gameId}");
    gameEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getGameByIdFn, { proxy: true })
    );

    const gameDevelopersEndpoint = gamesEndpoint.addResource("developers");
    gameDevelopersEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getGameDevelopersFn, { proxy: true })
    );

    const addGameFn = new lambdanode.NodejsFunction(this, "AddGameFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/addGame.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: gamesTable.tableName,
        USER_POOL_ID: props.userPoolId,
        CLIENT_ID: props.userPoolClientId,
        REGION: "eu-west-1",
      },
    });

    gamesTable.grantReadWriteData(addGameFn);

    gamesEndpoint.addMethod(
      "POST",
      new apig.LambdaIntegration(addGameFn, {}),{
        authorizer: requestAuthorizer,
        authorizationType: apig.AuthorizationType.CUSTOM,
      }
    );

    const deleteGameFn = new lambdanode.NodejsFunction(this, "DeleteGameFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/deleteGame.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: gamesTable.tableName,
        USER_POOL_ID: props.userPoolId,
        CLIENT_ID: props.userPoolClientId,
        REGION: "eu-west-1",
      },
    });

    gamesTable.grantWriteData(deleteGameFn);

    gameEndpoint.addMethod(
      "DELETE",
      new apig.LambdaIntegration(deleteGameFn, {}),{
        authorizer: requestAuthorizer,
        authorizationType: apig.AuthorizationType.CUSTOM,
      }
    );

    const translateGameFn = new lambdanode.NodejsFunction(this, "TranslateGameFn", {
      entry: `${__dirname}/../lambdas/translate.ts`,
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        TRANSLATION_TABLE_NAME: translationTable.tableName,
        GAMES_TABLE_NAME: gamesTable.tableName,
        REGION: 'eu-west-1',
      },
    });
    
    translationTable.grantReadWriteData(translateGameFn);
    
    translateGameFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['translate:TranslateText', 'dynamodb:GetItem', 'dynamodb:PutItem'],
      resources: ['*'],
    }));

    const gameTranslateEndpoint = gameEndpoint.addResource("translate");
    gameTranslateEndpoint.addMethod(
      "POST",
      new apig.LambdaIntegration(translateGameFn, { proxy: true })
    );

    const updateGameFn = new lambdanode.NodejsFunction(this, "UpdateGameFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/updateGame.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: gamesTable.tableName,
        USER_POOL_ID: props.userPoolId,
        CLIENT_ID: props.userPoolClientId,
        REGION: "eu-west-1",
      },
    });

    gamesTable.grantReadWriteData(updateGameFn);

    gameEndpoint.addMethod(
      "PUT",
      new apig.LambdaIntegration(updateGameFn, {}),{
        authorizer: requestAuthorizer,
        authorizationType: apig.AuthorizationType.CUSTOM,
      }
    );
  }
}
