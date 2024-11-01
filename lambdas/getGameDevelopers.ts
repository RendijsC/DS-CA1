import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));
    const queryParams = event.queryStringParameters;

    
    if (!queryParams) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Missing query parameters" }),
      };
    }

    
    if (!queryParams.gameId) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Missing gameId parameter" }),
      };
    }

    const gameId = parseInt(queryParams.gameId);
    if (isNaN(gameId)) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Invalid gameId parameter" }),
      };
    }

    
    let commandInput: QueryCommandInput = {
      TableName: process.env.CAST_TABLE_NAME,
      KeyConditionExpression: "gameId = :g",
      ExpressionAttributeValues: {
        ":g": gameId,
      },
    };

    
    if (queryParams.roleName) {
      commandInput = {
        ...commandInput,
        IndexName: "roleIx",
        KeyConditionExpression: "gameId = :g and begins_with(roleName, :r)",
        ExpressionAttributeValues: {
          ":g": gameId,
          ":r": queryParams.roleName,
        },
      };
    } else if (queryParams.developerName) {
      commandInput = {
        ...commandInput,
        IndexName: "roleIx",
        KeyConditionExpression: "gameId = :g and begins_with(developerName, :d)",
        ExpressionAttributeValues: {
          ":g": gameId,
          ":d": queryParams.developerName,
        },
      };
    }

    
    const commandOutput = await ddbDocClient.send(new QueryCommand(commandInput));

    // Return the results
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: commandOutput.Items }),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

function createDocumentClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
