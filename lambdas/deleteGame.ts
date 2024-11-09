import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { CookieMap, createPolicy, JwtToken, parseCookies, verifyToken } from "../shared/util";
import { createDDbDocClient } from "../common/ddbClient";
import { createErrorResponse, createSuccessResponse } from "../common/errorResponse";
import { authenticateRequest } from "../common/authRequest";

const ddbDocClient = createDDbDocClient(process.env.REGION!);

export const handler: APIGatewayProxyHandlerV2 = async function (event:any) {
  try {
    console.log("[EVENT]", JSON.stringify(event));

    const authResult = await authenticateRequest(event, process.env.USER_POOL_ID!, process.env.REGION!);
    if (!authResult.isAuthorized) {
      return authResult.response;
    }  

  //   const cookies: CookieMap = parseCookies(event);
  // if (!cookies) {
  //   return {
  //     statusCode: 200,
  //     body: "Unauthorised request!!",
  //   };
  // }

  // const verifiedJwt: JwtToken = await verifyToken(
  //   cookies.token,
  //   process.env.USER_POOL_ID,
  //   process.env.REGION!
  // );

  // if (!verifiedJwt) {
  //   return {
  //     statusCode: 403,
  //     body: "Forbidden: invalid token" ,
  //   };
  // }

    const gameId = event.pathParameters?.gameId;

    if (!gameId) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Missing gameId in request path" }),
      };
    }

    await ddbDocClient.send(
      new DeleteCommand({
        TableName: process.env.TABLE_NAME,
        Key: { id: parseInt(gameId) },
      })
    );

    return createSuccessResponse({ message: "Game deleted successfully" }, "Success");
  } catch (error: any) {
    return createErrorResponse(error, "Error deleting game");
  }
};
