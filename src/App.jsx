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

  // * New state for clarification/modification
  const [clarification, setClarification] = useState(''); // * Stores user clarification or modification input
  const [clarifiedSuggestion, setClarifiedSuggestion] = useState(''); // * Stores the AI's clarified/modified response
  const [selectedBullet, setSelectedBullet] = useState(''); // * Stores the bullet selected by the user

  // * Handles AI suggestion generation using the project name
  async function handleAISuggestion() {
    if (!projectName.trim()) return; // ? Guard: Don't run if input is empty
    const prompt = `Give me some direction on what to do with this project idea. Only a few bullet points with 1-2 sentences for each, with general ideas and the viability for each. Also include a Project name that would be applicable to the ideas in the bullet point at the beginning of the bullet point. Put a new line in between each bullet point: ${projectName}`; // * Prompt for AI

    // * Call backend API to get AI suggestion
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    setAiSuggestion(data.response); // * Update state with AI's response
    setClarifiedSuggestion(''); // * Clear previous clarifications
    setSelectedBullet(''); // * Clear selected bullet
  }

  // * Handles clarification/modification requests
  async function handleClarification() {
    if (!clarification.trim()) return; // ? Guard: Don't run if clarification is empty
    const prompt = `Given the previous project idea: "${projectName}", and the previous breakdown: "${clarifiedSuggestion || aiSuggestion}", here is a clarification or modification: "${clarification}". Please provide an updated breakdown as bullet points. Follow the same guidlines as the initial prompt.`; // * Prompt for AI clarification

    // * Call backend API to get clarified/modified suggestion
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    setClarifiedSuggestion(data.response); // * Update state with clarified/modified response
    setClarification(''); // * Clear clarification input
    setSelectedBullet(''); // * Clear selected bullet
  }

  // * Handles selecting a bullet and creating a repo with its project name
  async function handleSelectBullet(bullet) {
    // Extract the project name (assume it's the first word or phrase before a colon or dash)
    let name = bullet.split(':')[0].split('-')[0].trim();
    if (!name) name = bullet.trim();
    setProjectName(name); // * Update project name

    // Create the repo
    const res = await fetch('/api/github-create-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (data.success) {
      alert(`GitHub repository "${name}" created!`);
      fetchGitHubFiles(); // * Refresh repo list
    } else {
      alert('Failed to create repo: ' + (data.error || 'Unknown error'));
    }
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

  // * Helper to get the current breakdown (clarified or original)
  const currentBreakdown = clarifiedSuggestion || aiSuggestion;

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
            <ul className="list-disc ml-5">
              {(clarifiedSuggestion || aiSuggestion)
                .split('\n')
                .filter(line => line.trim() !== '')
                .map((line, idx) => (
                  <li
                    key={idx}
                    className={`cursor-pointer hover:bg-blue-100 rounded px-1 ${selectedBullet === line ? 'bg-blue-200 font-bold' : ''}`}
                    onClick={() => setSelectedBullet(line)}
                    title="Click to select this bullet"
                  >
                    {line.replace(/^[\-\*\d\.\s]+/, '')}
                  </li>
                ))}
            </ul>
            {/* * Show "Create Repo" button if a bullet is selected */}
            {selectedBullet && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm font-semibold">Selected:</span>
                <span className="italic">{selectedBullet.replace(/^[\-\*\d\.\s]+/, '')}</span>
                <Button onClick={() => handleSelectBullet(selectedBullet)}>
                  Make Repo from This
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* * Clarification/Modification Box */}
      {aiSuggestion && (
        <Card className="mt-6">
          <CardContent>
            <h2 className="font-semibold mb-2">Clarify or Modify Breakdown</h2>
            <textarea
              className="w-full p-2 border rounded mb-2"
              placeholder="Add clarifications or modifications to your project idea..."
              value={clarification}
              onChange={e => setClarification(e.target.value)}
              rows={3}
            />
            <Button onClick={handleClarification}>Submit Clarification</Button>
            {/* * Show clarified/modified response */}
            {clarifiedSuggestion && (
              <div className="mt-4">
                <h3 className="font-semibold mb-1">Updated Breakdown:</h3>
                <ul className="list-disc ml-5">
                  {clarifiedSuggestion
                    .split('\n')
                    .filter(line => line.trim() !== '')
                    .map((line, idx) => (
                      <li key={idx}>{line.replace(/^[\-\*\d\.\s]+/, '')}</li>
                    ))}
                </ul>
              </div>
            )}
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
