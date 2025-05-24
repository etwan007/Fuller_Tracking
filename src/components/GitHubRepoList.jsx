import { Card, CardContent } from './Card';
import { Button } from './Button';

export default function GitHubRepoList({ githubData, githubError, onLogin }) {
  return (
    <Card className="mt-6">
      <CardContent>
        <h2 className="font-semibold mb-2">GitHub Repositories:</h2>
        <ul className="list-disc ml-5 max-h-48 overflow-auto">
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