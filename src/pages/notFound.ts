import content from './notFound.html';
import he from 'he';

type Args = {
  githubRepoUrl: string;
};

const notFoundPage = ({githubRepoUrl}: Args) => {
  const escapedGithubUrl = he.escape(githubRepoUrl);

  return content
    .replaceAll('{{GH_REPO_URL}}', escapedGithubUrl);
};

export default notFoundPage;