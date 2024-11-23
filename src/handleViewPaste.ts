import pasteViewPage from './pages/pasteView';

export default async function handleViewPaste(
  request: Request,
  env: Env,
  url: URL,
  authResponse: Response | null
): Promise<Response> {
  // We already checked that it starts with /p/
  const pathParts = url.pathname.substring(3).split('/');
  const pasteId = pathParts[0];
  const format = pathParts[1];

  const { value: paste, metadata } = await env.PASTE_KV.getWithMetadata(pasteId);
  
  if (!paste) {
    return new Response('Not Found.', { status: 404 });
  }

  // Check auth for private pastes
  if (metadata?.visibility !== 'public') {
    if (authResponse) {
      return authResponse;
    }
  }

  // Handle different formats
  switch (format) {
    case 'raw':
      return new Response(paste, {
        headers: { 'content-type': 'text/plain;charset=UTF-8' }
      });

    default:
      // Default HTML view
      return new Response(
        pasteViewPage({
          domain: env.DOMAIN,
          githubRepoUrl: env.GH_REPO_URL,
          title: metadata?.title,
          createdAt: metadata?.createdAt,
          expirationSeconds: metadata?.expirationSeconds,
          paste,
        }), {
          headers: { 'content-type': 'text/html;charset=UTF-8' }
        }
      );
  }
}