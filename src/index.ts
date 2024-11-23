import requireAuth from './requireAuth';
import createPaste, { validateExpiration, validateVisibility, validateCustomKey, ValidationError } from './createPaste';
import newPastePage from './pages/newPaste';
import pasteViewPage from './pages/pasteView';

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);
		const authResponse = requireAuth(request, env);

		switch (url.pathname) {
			case '/':
				if (authResponse) {
					return authResponse;
				}

				return new Response(
					newPastePage({
						domain: env.DOMAIN,
						githubRepoUrl: env.GH_REPO_URL,
					}),
					{
						headers: { 'content-type': 'text/html;charset=UTF-8' },
					}
				);

			case '/new':
				if (authResponse) {
					return authResponse;
				}

				const formData = await request.formData();
				try {
					const pasteId = await createPaste({
						env,
						content: formData.get('paste_content') as string,
						visibility: validateVisibility(formData.get('visibility') as string),
						expiration: validateExpiration(formData.get('expiration') as string),
						title: formData.get('title') as string | null,
						customKey: validateCustomKey(formData.get('custom-url') as string | null),
					});
					return Response.redirect(env.BASE_URL + 'p/' + pasteId, 303);
				} catch (e: unknown) {
					if (e instanceof ValidationError) {
						return new Response(e.message, { status: 400 });
					}
					return new Response('Unexpected error: ' + e.message, { status: 500 });
				}

			case '/logout':
				// Invalidate the "Authorization" header by returning a HTTP 401.
				// We do not send a "WWW-Authenticate" header, as this would trigger
				// a popup in the browser, immediately asking for credentials again.
				return new Response('Logged out.', { status: 401 });
		}

		if (url.pathname.startsWith('/p/')) {
			const pasteId = url.pathname.substring(3);
			const { value: paste, metadata, ...rest } = await env.PASTE_KV.getWithMetadata(pasteId);
			if (paste) {
				if (metadata && metadata.visibility === 'authorized') {
					if (authResponse) {
						return authResponse;
					}
				}

				return new Response(
					pasteViewPage({
						domain: env.DOMAIN,
						githubRepoUrl: env.GH_REPO_URL,
						title: metadata?.title,
						createdAt: metadata?.createdAt,
						expirationSeconds: metadata?.expirationSeconds,
						paste,
					}),
					{
						headers: { 'content-type': 'text/html;charset=UTF-8' },
					}
				);
			} else {
				return new Response('Not Found.', { status: 404 });
			}
		}

		return new Response('Not Found.', { status: 404 });
	},
} satisfies ExportedHandler<Env>;
