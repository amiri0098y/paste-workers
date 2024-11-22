import { Buffer } from "node:buffer";

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

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case "/":
        return new Response("No auth required");

      case "/logout":
        // Invalidate the "Authorization" header by returning a HTTP 401.
        // We do not send a "WWW-Authenticate" header, as this would trigger
        // a popup in the browser, immediately asking for credentials again.
        return new Response("Logged out.", { status: 401 });

      case "/new": {
        const authorization = request.headers.get("Authorization");
        if (!authorization) {
          return new Response("Authorization required.", {
            status: 401,
            headers: {
              "WWW-Authenticate": 'Basic realm="pastes", charset="UTF-8"',
            },
          });
        }
        const [scheme, encoded] = authorization.split(" ");

        // The Authorization header must start with Basic, followed by a space.
        if (!encoded || scheme !== "Basic") {
          return new Response("Malformed authorization header.", {
            status: 400,
          });
        }

        const credentials = Buffer.from(encoded, "base64").toString();

        // The username and password are split by the first colon.
        //=> example: "username:password"
        const index = credentials.indexOf(":");
        const user = credentials.substring(0, index);
        const pass = credentials.substring(index + 1);

        if (
          !timingSafeEqual(env.AUTH_USER, user) ||
          !timingSafeEqual(env.AUTH_PASS, pass)
        ) {
          return new Response("Invalid authorization.", {
            status: 401,
            headers: {
              // Prompts the user for credentials.
              "WWW-Authenticate": 'Basic realm="pastes", charset="UTF-8"',
            },
          });
        }

        return new Response("🎉 You have private access!", {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        });
      }
    }

    return new Response("Not Found.", { status: 404 });
  },
} satisfies ExportedHandler<Env>;