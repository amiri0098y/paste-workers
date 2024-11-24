import pasteViewPage from './pages/pasteView';
import type { AuthResult } from './requireAuth';
import type { Metadata } from './createPaste';

export default async function handleViewPaste(request: Request, env: Env, url: URL, authCheck: AuthResult): Promise<Response> {
	// We already checked that it starts with /p/
	const pathParts = url.pathname.substring(3).split('/');
	const pasteId = pathParts[0];
	const format = pathParts[1];

	const { value: paste, metadata } = await env.PASTE_KV.getWithMetadata<Metadata>(pasteId);

	if (!paste) {
		return new Response('Not Found.', { status: 404 });
	}

	// Check auth for private pastes
	if (metadata?.visibility !== 'public') {
		if (!authCheck.isAuthorized) {
			return authCheck.response;
		}
	}

	const domain = env.DOMAIN;
	const githubRepoUrl = env.GH_REPO_URL;
	const title = metadata?.title || null;
	const createdAt = metadata?.createdAt || null;
	const createdBy = metadata?.createdBy || null;
	const expirationSeconds = metadata?.expirationSeconds || null;
	const visibility = metadata?.visibility === 'public' ? 'public' : 'authorized';

	switch (format) {
		case 'raw':
			return new Response(paste, {
				headers: { 'content-type': 'text/plain;charset=UTF-8' },
			});

		case 'js':
		case 'html':
		case 'python':
		case 'ruby':
		case 'php':
		case 'css':
		case 'sql':
      return new Response(
				pasteViewPage({
					domain,
					githubRepoUrl,
					title,
					createdAt,
					createdBy,
					expirationSeconds,
					visibility,
					highlightLang: format,
					paste,
				}),
				{
					headers: { 'content-type': 'text/html;charset=UTF-8' },
				}
			);

		default:
			return new Response(
				pasteViewPage({
					domain,
					githubRepoUrl,
					title,
					createdAt,
					createdBy,
					expirationSeconds,
					visibility,
					highlightLang: null,
					paste,
				}),
				{
					headers: { 'content-type': 'text/html;charset=UTF-8' },
				}
			);
	}
}
