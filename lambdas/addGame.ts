import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";
import { CookieMap, createPolicy, JwtToken, parseCookies, verifyToken } from "../shared/util";
import { createDDbDocClient } from "../common/ddbClient";
import { createErrorResponse, createSuccessResponse } from "../common/errorResponse";
import { authenticateRequest } from "../common/authRequest";


const ddbDocClient = createDDbDocClient(process.env.REGION!);

const ajv = new Ajv();
const isValidBodyParams = ajv.compile(schema.definitions["Game"] || {});

export const handler: APIGatewayProxyHandlerV2 = async function (event:any) {
  try {
    
    console.log("[EVENT]", JSON.stringify(event));

  //  const cookies: CookieMap = parseCookies(event);
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

  const authResult = await authenticateRequest(event, process.env.USER_POOL_ID!, process.env.REGION!);
  if (!authResult.isAuthorized) {
    return authResult.response;
  }


    const body = event.body ? JSON.parse(event.body) : undefined;
    if (!body) {
      return {
        statusCode: 500,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }

    if (!isValidBodyParams(body)) {
        return {
          statusCode: 500,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            message: `Incorrect type. Must match Game schema`,
            schema: schema.definitions["Game"],
          }),
        };
      }

      const commandOutput = await ddbDocClient.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: body,
      })
    );

    return createSuccessResponse({ message: "Game added" }, "Created");
  } catch (error: any) {
    return createErrorResponse(error, "Error adding game");
  }
};