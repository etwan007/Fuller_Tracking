import { useState } from 'react';
import { Button } from './components/Button';
import { Card, CardContent } from './components/Card';
import { GoogleLogin } from './components/GoogleLogin';

export default function App() {
    const [projectName, setProjectName] = useState('');
    const [aiSuggestion, setAiSuggestion] = useState('');
    const [githubData, setGithubData] = useState(null);
    const [calendarEvents, setCalendarEvents] = useState(null);
    const [formResponses, setFormResponses] = useState(null);

    async function handleAISuggestion() {
      if (!projectName.trim()) return;
      const prompt = `Give me a breakdown for a project idea: ${projectName}`;

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setAiSuggestion(data.response);
    }

    async function handleGitHubAuth() {
      const res = await fetch('/api/github-login');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    }

    async function fetchGitHubFiles() {
      const res = await fetch('/api/github-files');
      const data = await res.json();
      setGithubData(data);
    }

    async function createGitHubRepo() {
      if (!projectName.trim()) return alert('Enter a project name first.');
      const res = await fetch('/api/github-create-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName }),
      });
      const data = await res.json();
      if (data.success) {
        alert('GitHub repository created!');
        fetchGitHubFiles();
      } else {
        alert('Failed to create repo: ' + (data.error || 'Unknown error'));
      }
    }

    async function handleGoogleLogin(idToken) {
      const res = await fetch('/api/google-oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem('google_access_token', data.access_token);
        alert('Google login successful!');
      }
    }

    async function fetchCalendar() {
      const res = await fetch('/api/google-calendar');
      if (res.ok) {
        const data = await res.json();
        setCalendarEvents(data.items);
      } else {
        alert('Failed to fetch calendar events');
      }
    }

    async function fetchFormResponses() {
      const res = await fetch('/api/google-form-responses');
      if (res.ok) {
        const data = await res.json();
        setFormResponses(data.values);
      } else {
        alert('Failed to fetch form responses');
      }
    }

    return (
      <main className="p-4 max-w-xl mx-auto bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">Fuller Tracking</h1>

        <input
          type="text"
          placeholder="Enter project name"
          className="w-full p-3 border rounded mb-4"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />

        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleAISuggestion}>Generate AI Breakdown</Button>
          <Button onClick={handleGitHubAuth}>Connect to GitHub</Button>
          <Button onClick={fetchGitHubFiles}>Fetch GitHub Repos</Button>
          <Button onClick={createGitHubRepo}>Create GitHub Repo</Button>
        </div>

        {aiSuggestion && (
          <Card className="mt-6">
            <CardContent>
              <h2 className="font-semibold mb-2">AI Suggestion:</h2>
              <p>{aiSuggestion}</p>
            </CardContent>
          </Card>
        )}

        {githubData && (
    <Card className="mt-6">
      <CardContent>
        <h2 className="font-semibold mb-2">GitHub Repositories:</h2>
        <ul className="list-disc ml-5 max-h-48 overflow-auto">
          {githubData.files?.length > 0 ? (
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
      </CardContent>
    </Card>
  )}

        <section className="mt-8 p-4 bg-white rounded shadow">
          <h2 className="text-lg font-bold mb-3">Google Integration</h2>
          <GoogleLogin onLogin={handleGoogleLogin} />
          <div className="flex gap-2 mt-3">
            <Button onClick={fetchCalendar}>Fetch Calendar Events</Button>
            <Button onClick={fetchFormResponses}>Fetch Form Responses</Button>
          </div>

          {calendarEvents && (
            <ul className="list-disc ml-5 mt-4">
              {calendarEvents.map((ev) => (
                <li key={ev.id}>
                  {ev.summary} — {new Date(ev.start.dateTime || ev.start.date).toLocaleString()}
                </li>
              ))}
            </ul>
          )}



    <section className="mt-4">
    <h2 className="text-lg font-bold mb-2">Form Submissions</h2>
    <table className="w-full border text-sm">
      <thead>
        <tr>
          {(formResponses?.[0] || ['Project Name', 'Description', 'Due Date']).map((header, i) => (
            <th key={i} className="border p-1">{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
    {formResponses?.slice(1).length > 0 ? (
      formResponses.slice(1).map((row, i) => (
        <tr key={i}>
          {row.map((cell, j) => (
            <td key={j} className="border p-1">{cell}</td>
          ))}
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan={3} className="text-center p-2">No submissions yet.</td>
      </tr>
    )}
  </tbody>
  </table>
    </section>
  </section>
</main>)}
