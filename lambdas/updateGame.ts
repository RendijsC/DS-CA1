import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";
import { CookieMap, createPolicy, JwtToken, parseCookies, verifyToken } from "../shared/util";
const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.REGION }));
const ajv = new Ajv();
const isValidBodyParams = ajv.compile({
  ...schema.definitions["Game"],
  required: schema.definitions["Game"].required.filter((prop: string) => prop !== "id"),
});

export const handler: APIGatewayProxyHandlerV2 = async function (event:any) {



    const cookies: CookieMap = parseCookies(event);
  if (!cookies) {
    return {
      statusCode: 200,
      body: "Unauthorised request!!",
    };
  }

  const verifiedJwt: JwtToken = await verifyToken(
    cookies.token,
    process.env.USER_POOL_ID,
    process.env.REGION!
  );

  if (!verifiedJwt) {
    return {
      statusCode: 403,
      body: "Forbidden: invalid token" ,
    };
  }





  const gameId = event.pathParameters?.gameId;

  if (!gameId) {
    return {
      statusCode: 400,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Missing gameId in path parameters" }),
    };
  }

  const body = event.body ? JSON.parse(event.body) : undefined;
  if (!body || !isValidBodyParams(body)) {
    return {
      statusCode: 400,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: "Invalid game data",
        errors: isValidBodyParams.errors,
      }),
    };
  }

  const params = {
    TableName: process.env.TABLE_NAME!,
    Key: { id: parseInt(gameId) },
    UpdateExpression:
      "set title = :title, description = :description, developer = :developer, original_language = :original_language, original_title = :original_title, release_year = :release_year",
    ExpressionAttributeValues: {
      ":title": body.title,
      ":description": body.description,
      ":developer": body.developer,
      ":original_language": body.original_language,
      ":original_title": body.original_title,
      ":release_year": body.release_year,
    },
    ReturnValues: "ALL_NEW" as const,
  };

  try {
    const result = await ddbDocClient.send(new UpdateCommand(params));
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: "Game updated successfully",
        game: result.Attributes,
      }),
    };
  } catch (error) {
    console.error("Error updating game:", error);
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};



