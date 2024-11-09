
import { Handler, APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import * as AWS from 'aws-sdk'; 
import { createDDbDocClient } from "../common/ddbClient";
import { createErrorResponse, createSuccessResponse } from "../common/errorResponse";


const ddbDocClient = createDDbDocClient(process.env.REGION!);

const translate = new AWS.Translate();

export const handler: APIGatewayProxyHandlerV2 = async (event) => { 
  try {
    console.log("[EVENT]", JSON.stringify(event));
    const parameters = event?.pathParameters;
    const gameId = parameters?.gameId ? parseInt(parameters.gameId) : undefined;
    
    if (!gameId) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Missing or invalid gameId" }),
      };
    }

    
    const commandOutput = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { id: gameId },
      })
    );

    if (!commandOutput.Item) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Game not found" }),
      };
    }

    const game = commandOutput.Item;

    
    return createSuccessResponse(game, "Game retrieved successfully");
  } catch (error) {
    return createErrorResponse(error, "Failed to fetch game data");
  }
};