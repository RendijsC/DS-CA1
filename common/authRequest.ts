import { CookieMap, JwtToken, parseCookies, verifyToken } from "../shared/util";

export async function authenticateRequest(event: any, userPoolId: string, region: string): Promise<{ isAuthorized: boolean; response?: any; jwtToken?: JwtToken }> {
  const cookies: CookieMap = parseCookies(event);
  if (!cookies) {
    return {
      isAuthorized: false,
      response: {
        statusCode: 200,
        body: "Unauthorised request!!",
      },
    };
  }

  const verifiedJwt: JwtToken = await verifyToken(cookies.token, userPoolId, region);

  if (!verifiedJwt) {
    return {
      isAuthorized: false,
      response: {
        statusCode: 403,
        body: "Forbidden: invalid token",
      },
    };
  }

  return {
    isAuthorized: true,
    jwtToken: verifiedJwt,
  };
}