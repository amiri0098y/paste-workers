import content from './pasteView.html';
import he from 'he';

type Args = {
	domain: string;
	githubRepoUrl: string;
	title: string | null;
	createdAt: string | null;
	paste: string;
};

const newPastePage = ({ domain, githubRepoUrl, title, createdAt, paste }: Args) => {
	const escapedDomain = he.escape(domain);
	const escapedGithubUrl = he.escape(githubRepoUrl);
	const escapedTitle = he.escape(title || 'Untitled Paste');
	const escapedCreatedAt = he.escape(createdAt || new Date().toISOString());
	const escapedPaste = he.escape(paste);

	return content
		.replaceAll('{{DOMAIN}}', escapedDomain)
		.replaceAll('{{GH_REPO_URL}}', escapedGithubUrl)
		.replaceAll('{{TITLE}}', escapedTitle)
		.replaceAll('{{CREATED_ISO}}', escapedCreatedAt)
		.replaceAll('{{PASTE_CONTENT}}', escapedPaste);
};

export default newPastePage;
