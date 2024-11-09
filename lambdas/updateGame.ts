import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";
import { CookieMap, createPolicy, JwtToken, parseCookies, verifyToken } from "../shared/util";
import { createDDbDocClient } from "../common/ddbClient";
import { createErrorResponse, createSuccessResponse } from "../common/errorResponse";
import { authenticateRequest } from "../common/authRequest";

const ddbDocClient = createDDbDocClient(process.env.REGION!);

const ajv = new Ajv();
const isValidBodyParams = ajv.compile(schema.definitions["Game"]);

export const handler: APIGatewayProxyHandlerV2 = async function (event:any) {

  const authResult = await authenticateRequest(event, process.env.USER_POOL_ID!, process.env.REGION!);
  if (!authResult.isAuthorized) {
    return authResult.response;
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
    return createSuccessResponse(result.Attributes, "Game updated successfully");
  } catch (error) {
    return createErrorResponse(error, "Error updating game");
  }
};



