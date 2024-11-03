
import { Handler, APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import * as AWS from 'aws-sdk'; 


const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
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

   
    const language = event.queryStringParameters?.language;
    if (language && game.description) {
      console.log(`[DEBUG] Translating description to language: ${language}`);

      try {
        
        const translateParams = {
          Text: game.description,
          SourceLanguageCode: 'en', 
          TargetLanguageCode: language,
        };
        const translation = await translate.translateText(translateParams).promise();
        game.description = translation.TranslatedText; 

        console.log(`[DEBUG] Translated description: ${translation.TranslatedText}`);
      } catch (translationError) {
        console.error("Translation Error:", translationError);
      }
    }

    
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ data: game }),
    };
  } catch (error) {
    console.error("Error fetching or translating game data:", error);
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: "Failed to fetch game data", error }),
    };
  }
};