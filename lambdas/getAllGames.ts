import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { createDDbDocClient } from "../common/ddbClient";
import { createErrorResponse, createSuccessResponse } from "../common/errorResponse";

const ddbDocClient = createDDbDocClient(process.env.REGION!);


export const handler: APIGatewayProxyHandlerV2 = async (event, context) => { 
  try {
    
    console.log("Event: ", event);

    const commandOutput = await ddbDocClient.send(
      new ScanCommand({
        TableName: process.env.TABLE_NAME,
      })
    );
    if (!commandOutput.Items) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Invalid game Id" }),
      };
    }
    const body = {
      data: commandOutput.Items,
    };

    
    return createSuccessResponse(commandOutput.Items, "Items retrieved successfully");
  } catch (error: any) {
    return createErrorResponse(error, "Error fetching data");
  }
};
