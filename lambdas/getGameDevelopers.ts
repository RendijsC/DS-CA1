import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";
import { createDDbDocClient } from "../common/ddbClient";
import { createErrorResponse, createSuccessResponse } from "../common/errorResponse";

const ajv = new Ajv();
const isValidQueryParams = ajv.compile(schema.definitions["GameDeveloperQueryParams"] || {});

const ddbDocClient = createDDbDocClient(process.env.REGION!);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));
    const queryParams = event.queryStringParameters;

    if (!queryParams) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Missing query parameters" }),
      };
    }

  
    if (!isValidQueryParams(queryParams)) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: "Incorrect type. Must match GameDeveloperQueryParams schema",
          schema: schema.definitions["GameDeveloperQueryParams"],
        }),
      };
    }

    
    const gameId = parseInt(queryParams.gameId, 10);
    if (isNaN(gameId)) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Invalid gameId format" }),
      };
    }

    
    let commandInput: QueryCommandInput = {
      TableName: process.env.GAME_DEVELOPER_TABLE_NAME,
    };

    if ("roleName" in queryParams) {
      commandInput = {
        ...commandInput,
        IndexName: "roleIx",
        KeyConditionExpression: "gameId = :g and begins_with(roleName, :r)",
        ExpressionAttributeValues: {
          ":g": gameId,
          ":r": queryParams.roleName,
        },
      };
    } else if ("developerName" in queryParams) {
      commandInput = {
        ...commandInput,
        KeyConditionExpression: "gameId = :g and begins_with(developerName, :d)",
        ExpressionAttributeValues: {
          ":g": gameId,
          ":d": queryParams.developerName,
        },
      };
    } else {
      commandInput = {
        ...commandInput,
        KeyConditionExpression: "gameId = :g",
        ExpressionAttributeValues: {
          ":g": gameId,
        },
      };
    }

    const commandOutput = await ddbDocClient.send(new QueryCommand(commandInput));

    return createSuccessResponse(commandOutput.Items, "Query executed successfully");
  } catch (error: any) {
    return createErrorResponse(error, "Error processing request");
  }
};


