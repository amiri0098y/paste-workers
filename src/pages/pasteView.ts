import type { Visibility } from '../createPaste';
import content from './pasteView.html';
import he from 'he';

type Args = {
	domain: string;
	githubRepoUrl: string;
	title: string | null;
	createdAt: string | null;
	createdBy: string | null;
	expirationSeconds: number | null;
	visibility: Visibility,
	paste: string;
};

const newPastePage = ({ domain, githubRepoUrl, title, createdAt, createdBy, expirationSeconds, visibility, paste }: Args) => {
	const parsedCreatedAt = createdAt ? new Date(createdAt) : null;
	const parsedExpiresAt = parsedCreatedAt && expirationSeconds ? new Date(parsedCreatedAt.getTime() + expirationSeconds * 1000) : null;

	const metadataItems = [];
	if (createdBy) {
		metadataItems.push(`Created by: ${createdBy}`);
	}
	if (parsedCreatedAt) {
		metadataItems.push(parsedCreatedAt.toLocaleString());
	}
	if (parsedExpiresAt) {
		metadataItems.push(`Expires: ${parsedExpiresAt.toLocaleString()}`);
	}

	return content
		.replaceAll('{{DOMAIN}}', he.escape(domain))
		.replaceAll('{{GH_REPO_URL}}', he.escape(githubRepoUrl))
		.replaceAll('{{TITLE}}', he.escape(title || 'Untitled Paste'))
		.replaceAll('{{METADATA_ITEMS}}', he.escape(metadataItems.join(' • ')))
		.replaceAll('{{PRIVACY}}', visibility === 'public' ? 'Public' : 'Logged-in users only')
		.replaceAll('{{PASTE_CONTENT}}', he.escape(paste));
};

export default newPastePage;
