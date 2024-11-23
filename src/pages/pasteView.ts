import content from './pasteView.html';
import he from 'he';

type Args = {
	domain: string;
	githubRepoUrl: string;
	title: string | null;
	createdAt: string | null;
	expirationSeconds: number | null;
	paste: string;
};

const newPastePage = ({ domain, githubRepoUrl, title, createdAt, expirationSeconds, paste }: Args) => {
	const parsedCreatedAt = createdAt ? new Date(createdAt) : null;
	const parsedExpiresAt = parsedCreatedAt && expirationSeconds ? new Date(parsedCreatedAt.getTime() + expirationSeconds * 1000) : null;

	const metadataItems = [];
	if (parsedCreatedAt) {
		metadataItems.push(`Created: ${parsedCreatedAt.toLocaleString()}`);
	}
	if (parsedExpiresAt) {
		metadataItems.push(`Expires: ${parsedExpiresAt.toLocaleString()}`);
	}

	return content
		.replaceAll('{{DOMAIN}}', he.escape(domain))
		.replaceAll('{{GH_REPO_URL}}', he.escape(githubRepoUrl))
		.replaceAll('{{TITLE}}', he.escape(title || 'Untitled Paste'))
		.replaceAll('{{METADATA_ITEMS}}', he.escape(metadataItems.join(' • ')))
		.replaceAll('{{PASTE_CONTENT}}', he.escape(paste));
};

export default newPastePage;
