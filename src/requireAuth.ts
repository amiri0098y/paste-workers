import { Buffer } from 'node:buffer';

const encoder = new TextEncoder();

/**
 * Protect against timing attacks by safely comparing values using `timingSafeEqual`.
 * Refer to https://developers.cloudflare.com/workers/runtime-apis/web-crypto/#timingsafeequal for more details
 */
function timingSafeEqual(a: string, b: string) {
	const aBytes = encoder.encode(a);
	const bBytes = encoder.encode(b);

	if (aBytes.byteLength !== bBytes.byteLength) {
		// Strings must be the same length in order to compare
		// with crypto.subtle.timingSafeEqual
		return false;
	}

	return crypto.subtle.timingSafeEqual(aBytes, bBytes);
}

export type UnauthenticatedResult = {
  isAuthorized: false;
  response: Response;
};
export type AuthenticatedResult = {
  isAuthorized: true;
  username: string;
};

export type AuthResult = UnauthenticatedResult | AuthenticatedResult;

const requireAuth = (request: Request, env: Env): AuthResult => {
	const authorization = request.headers.get('Authorization');
	if (!authorization) {
		return {
			isAuthorized: false,
			response: new Response('Authorization required.', {
				status: 401,
				headers: {
					'WWW-Authenticate': 'Basic realm="pastes", charset="UTF-8"',
				},
			}),
		};
	}

	const [scheme, encoded] = authorization.split(' ');

	// The Authorization header must start with Basic, followed by a space.
	if (!encoded || scheme !== 'Basic') {
		return {
			isAuthorized: false,
			response: new Response('Malformed authorization header.', {
				status: 400,
			}),
		};
	}

	const credentials = Buffer.from(encoded, 'base64').toString();

	// The username and password are split by the first colon.
	//=> example: "username:password"
	const index = credentials.indexOf(':');
	const user = credentials.substring(0, index);
	const pass = credentials.substring(index + 1);

	try {
		const authUsers: Record<string, string> = JSON.parse(env.AUTH_USERS);

		// Check if user exists and password matches
		if (user in authUsers && timingSafeEqual(authUsers[user], pass)) {
			return { isAuthorized: true, username: user };
		}

		return {
			isAuthorized: false,
			response: new Response('Invalid authorization.', {
				status: 401,
				headers: {
					// Prompts the user for credentials.
					'WWW-Authenticate': 'Basic realm="pastes", charset="UTF-8"',
				},
			}),
		};
	} catch (error) {
		// Handle invalid JSON in AUTH_USERS
		return {
			isAuthorized: false,
			response: new Response('Server configuration error.', {
				status: 500,
			}),
		};
	}
};

export default requireAuth;
