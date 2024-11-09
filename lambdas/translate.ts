import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import AWS from 'aws-sdk';
import { createDDbDocClient } from '../common/ddbClient';
import { createErrorResponse, createSuccessResponse } from '../common/errorResponse';

const ddbDocClient = createDDbDocClient(process.env.REGION!);
const translate = new AWS.Translate();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    console.log('[EVENT]', JSON.stringify(event));
    const gameId = event.pathParameters?.gameId;
    const { language } = JSON.parse(event.body || '{}');

    if (!gameId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'gameId is required in the path' }),
      };
    }

    if (!language) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'language is required in the body' }),
      };
    }

    const parsedGameId = parseInt(gameId);
    if (isNaN(parsedGameId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid gameId format. It must be a number.' }),
      };
    }

    const getParams = {
      TableName: process.env.GAMES_TABLE_NAME!,
      Key: { id: parsedGameId },
    };
    const { Item: game } = await ddbDocClient.send(new GetCommand(getParams));

    if (!game) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: `Game with ID ${parsedGameId} not found` }),
      };
    }

    const translateParams: AWS.Translate.Types.TranslateTextRequest = {
      Text: game.description,
      SourceLanguageCode: 'en',
      TargetLanguageCode: language,
    };
    const { TranslatedText } = await translate.translateText(translateParams).promise();

    const translatedGame = {
      gameId: parsedGameId, 
      language,
      ...game,
      description: TranslatedText,
      original_language: 'en',
      original_title: game.title,
    };

    const putParams = {
      TableName: process.env.TRANSLATION_TABLE_NAME!,
      Item: translatedGame,
    };
    await ddbDocClient.send(new PutCommand(putParams));

    return createSuccessResponse(translatedGame, 'Game description translated and uploaded successfully');
    } catch (error) {
    return createErrorResponse(error, 'Failed to translate and upload the game description');
    }
};



