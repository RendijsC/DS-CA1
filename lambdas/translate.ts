import { APIGatewayProxyHandler } from 'aws-lambda';
import AWS from 'aws-sdk';

const translate = new AWS.Translate();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { text, language } = JSON.parse(event.body || '{}');

    if (!text || !language) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'text and language are required' }),
      };
    }

    const params = {
      Text: text,
      SourceLanguageCode: 'en', 
      TargetLanguageCode: language,
    };

    const result = await translate.translateText(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ translatedText: result.TranslatedText }),
    };
  } catch (error) {
    console.error("Translation Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Translation failed', error }),
    };
  }
};