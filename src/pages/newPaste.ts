import content from './newPaste.html';
import he from 'he';

type Args = {
  domain: string;
  githubRepoUrl: string;
};

const newPastePage = ({domain, githubRepoUrl}: Args) => {
  const escapedDomain = he.escape(domain);
  const escapedGithubUrl = he.escape(githubRepoUrl);

  return content
    .replaceAll('{{DOMAIN}}', escapedDomain)
    .replaceAll('{{GH_REPO_URL}}', escapedGithubUrl);
};

export default newPastePage;