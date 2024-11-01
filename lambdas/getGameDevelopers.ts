
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const queryParams = event.queryStringParameters;

   
    if (!queryParams || !queryParams.gameId) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Missing required gameId" }),
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

    const includeFacts = queryParams.facts === "true";

   
    const developersResponse = await ddbDocClient.send(
      new QueryCommand({
        TableName: process.env.GAME_DEVELOPER_TABLE_NAME,
        KeyConditionExpression: "gameId = :g",
        ExpressionAttributeValues: { ":g": gameId },
      })
    );
    const developers = developersResponse.Items;

    
    if (includeFacts) {
      const gameResponse = await ddbDocClient.send(
        new GetCommand({
          TableName: process.env.GAMES_TABLE_NAME,
          Key: { id: gameId }, 
          ProjectionExpression: "title, release_year, description",
        })
      );
      const gameDetails = gameResponse.Item;

      return {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          developers,
          gameDetails: gameDetails || null,
        }),
      };
    }

    
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ developers }),
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
  return DynamoDBDocumentClient.from(ddbClient, {
    marshallOptions: {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
    unmarshallOptions: { wrapNumbers: false },
  });
}
