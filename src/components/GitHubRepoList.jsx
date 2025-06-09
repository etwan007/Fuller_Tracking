import { Card, CardContent } from './Card';
import { Button } from './Button';
import { GithubAuthProvider } from 'firebase/auth';

const githubProvider = new GithubAuthProvider();
githubProvider.addScope('repo');

export default function GitHubRepoList({ githubData, githubError, githubUsername, onLogin }) {
  return (
    <Card className="container">
      <CardContent>
        <h2>

          <a
            href={githubUsername ? `https://github.com/${githubUsername}` : "https://github.com"}
            target="_blank"
            rel="noreferrer"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            GitHub Repositories
          </a>
        </h2>
        <ul className="repo-list">
          
          {githubError ? (
            <li>{githubError}</li>
          ) : githubData?.files?.length > 0 ? (
            githubData.files.map((repo, idx) => (
              <li key={idx}>
                <a href={repo.html_url} target="_blank" rel="noreferrer">
                  {repo.name}
                </a>
              </li>
            ))
          ) : (
            <li>No repositories found</li>
          )}
        </ul>
        {!githubData && (
          <Button className="mt-2" onClick={onLogin}>
            Connect to GitHub
          </Button>
        )}
      </CardContent>
    </Card>
  );
}