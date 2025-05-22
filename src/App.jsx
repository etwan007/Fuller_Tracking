// ! Import React hooks and custom components
import { useState } from 'react'; // * React hook for state management
import { Button } from './components/Button'; // * Custom Button component
import { Card, CardContent } from './components/Card'; // * Custom Card components for UI
import { GoogleLogin } from './components/GoogleLogin'; // * Google OAuth login button
import { GoogleCalendarView } from './components/GoogleCalendarView'; // * Calendar display component

import { useEffect } from 'react'; // * React hook for side effects

// ! Main App component
export default function App() {
  // * State variables for managing UI and data
  const [projectName, setProjectName] = useState(''); // * Stores the project name input by the user
  const [aiSuggestion, setAiSuggestion] = useState(''); // * Stores the AI's suggestion/response
  const [githubData, setGithubData] = useState(null); // * Stores GitHub repo data
  const [calendarEvents, setCalendarEvents] = useState(null); // * Stores Google Calendar events
  const [formResponses, setFormResponses] = useState(null); // * Stores Google Form responses

  // * Handles AI suggestion generation using the project name
  async function handleAISuggestion() {
    if (!projectName.trim()) return; // ? Guard: Don't run if input is empty
    const prompt = `Give me a breakdown for a project idea: ${projectName}`; // * Prompt for AI

    // * Call backend API to get AI suggestion
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    setAiSuggestion(data.response); // * Update state with AI's response
  }

  // * Initiates GitHub OAuth login flow
  async function handleGitHubAuth() {
    const res = await fetch('/api/github-login');
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url; // * Redirect user to GitHub login
    }
  }

  // * Fetches the user's GitHub repositories from backend
  async function fetchGitHubFiles() {
    const res = await fetch('/api/github-files');
    const data = await res.json();
    setGithubData(data); // * Update state with repo data
  }

  // * Creates a new GitHub repository with the given project name
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
      fetchGitHubFiles(); // * Refresh repo list
    } else {
      alert('Failed to create repo: ' + (data.error || 'Unknown error'));
    }
  }

  // * Fetches Google Calendar events using the stored access token
  async function fetchCalendar() {
    const accessToken = localStorage.getItem('google_access_token');
    if (!accessToken) return alert('No access token available.');

    const res = await fetch('/api/google-calendar', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      setCalendarEvents(data.items || []); // * Update state with calendar events
    } else {
      alert('Failed to fetch calendar events');
    }
  }

  // * Fetches Google Form responses from backend
  async function fetchFormResponses() {
    const res = await fetch('/api/google-form-responses');
    if (res.ok) {
      const data = await res.json();
      setFormResponses(data.values); // * Update state with form responses
    } else {
      alert('Failed to fetch form responses');
    }
  }

  // ! useEffect: Runs once on component mount
  useEffect(() => {
    // * Check if redirected from Google with an access_token in the URL
    const url = new URL(window.location.href);
    const token = url.searchParams.get('access_token');

    if (token) {
      localStorage.setItem('google_access_token', token); // * Save token for later use
      setTimeout(() => {
        // * Remove token from URL for cleanliness
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 100);

      // * Fetch calendar events after login
      fetchCalendar();
    } else {
      // * If already logged in, fetch calendar events
      const existingToken = localStorage.getItem('google_access_token');
      if (existingToken) fetchCalendar();
    }

    fetchFormResponses(); // * Fetch form responses on load

    // * Set up polling to refresh form responses every 10 seconds
    const interval = setInterval(fetchFormResponses, 10000);
    return () => clearInterval(interval); // * Cleanup on unmount
  }, []);

  // ! Render the UI
  return (
    <main className="p-4 max-w-xl mx-auto bg-gray-50 min-h-screen">
      {/* * App Title */}
      <h1 className="text-3xl font-bold mb-6">Fuller Tracking</h1>

      {/* * Project Name Input */}
      <input
        type="text"
        placeholder="Enter project name"
        className="w-full p-3 border rounded mb-4"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
      />

      {/* * Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={handleAISuggestion}>Generate AI Breakdown</Button>
        <Button onClick={handleGitHubAuth}>Connect to GitHub</Button>
        <Button onClick={fetchGitHubFiles}>Fetch GitHub Repos</Button>
        <Button onClick={createGitHubRepo}>Create GitHub Repo</Button>
      </div>

      {/* * AI Suggestion Card */}
      {aiSuggestion && (
        <Card className="mt-6">
          <CardContent>
            <h2 className="font-semibold mb-2">AI Suggestion:</h2>
            <p>{aiSuggestion}</p>
          </CardContent>
        </Card>
      )}

      {/* * GitHub Repositories Card */}
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

      {/* * Google Integration Section */}
      <section className="mt-8 p-4 bg-white rounded shadow">
        <h2 className="text-lg font-bold mb-3">Google Integration</h2>
        {/* * Google Login Button */}
        <GoogleLogin />
        <div className="flex gap-2 mt-3">
          <Button onClick={fetchCalendar}>Fetch Calendar Events</Button>
          <Button onClick={fetchFormResponses}>Fetch Form Responses</Button>
        </div>

        {/* * Calendar Events Display */}
        {calendarEvents && calendarEvents.length > 0 && (
          <div className="mt-6">
            <GoogleCalendarView events={calendarEvents} />
          </div>
        )}

        {/* * Google Form Submissions Table */}
        <section className="mt-4">
          <h2 className="text-lg font-bold mb-2">Form Submissions</h2>
          <table className="w-full border text-sm">
            <thead>
              <tr>
                {/* * Table headers: Use first row of formResponses or fallback */}
                {(formResponses?.[0] || ['Time Submitted', 'Project Name', 'Description', 'Due Date']).map((header, i) => (
                  <th key={i} className="border p-1">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* * Table rows: Show form responses or fallback message */}
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
    </main>
  );
}
