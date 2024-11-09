export function createSuccessResponse(data: any, message = "Success") {
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message,
        data,
      }),
    };
  }
  
  export function createErrorResponse(error: Error | string, message = "Internal Server Error") {
    console.error(message, error);
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message,
        error: typeof error === "string" ? error : error.message,
      }),
    };
  }