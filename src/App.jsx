// ! Import React hooks and custom components
import { useState, useEffect } from 'react'; // * React hooks for state management and side effects
import { Button } from './components/Button'; // * Custom Button component
import { Card, CardContent } from './components/Card'; // * Custom Card components for UI
import { GoogleLogin } from './components/GoogleLogin'; // * Google OAuth login button
import { GoogleCalendarView } from './components/GoogleCalendarView'; // * Calendar display component

// ! Main App component
export default function App() {
  // * State variables for managing UI and data
  const [projectName, setProjectName] = useState(''); // * Stores the project name input by the user
  const [aiSuggestion, setAiSuggestion] = useState(''); // * Stores the AI's suggestion/response
  const [githubData, setGithubData] = useState(null); // * Stores GitHub repo data
  const [githubError, setGithubError] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState(null); // * Stores Google Calendar events
  const [formResponses, setFormResponses] = useState(null); // * Stores Google Form responses

  // * State for clarification/modification and bullet selection
  const [clarification, setClarification] = useState(''); // * Stores user clarification or modification input
  const [currentBreakdown, setCurrentBreakdown] = useState(''); // * Stores the AI's clarified/modified response
  const [selectedBullet, setSelectedBullet] = useState(''); // * Stores the bullet selected by the user
  const [loading, setLoading] = useState(false); // * Indicator for AI loading

  // * Handles AI suggestion generation using the project name
  async function handleAISuggestion() {
    if (!projectName.trim()) return; // ? Guard: Don't run if input is empty
    setLoading(true); // * Set loading state
    setSelectedBullet(''); // * Clear selected bullet
    setClarification(''); // * Clear previous clarifications
    const prompt = `Give me 5 unique and creative project ideas based on this concept. Each idea should be presented as a single bullet point and must begin with a unique, descriptive project name that relates to the concept. Each bullet should contain exactly two sentences describing the idea. The ideas should focus on what can be built using hobby-grade tools and components, unless otherwise specified. Do not split ideas into multiple bullets. Separate each idea with a line break.: ${projectName}`; // * Prompt for AI

    // * Call backend API to get AI suggestion
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    setAiSuggestion(data.response); // * Update state with AI's response
    setCurrentBreakdown(data.response); // * Update current breakdown
    setLoading(false); // * Clear loading state
  }

  // * Handles clarification/modification requests
  async function handleClarification() {
    if (!clarification.trim()) return; // ? Guard: Don't run if clarification is empty
    setLoading(true); // * Set loading state
    setSelectedBullet(''); // * Clear selected bullet
    const prompt = `Given the original project idea: ${projectName}, and the previous breakdown: ${currentBreakdown}, here is a new clarification or modification: ${clarification}. Based on this updated input, generate 5 revised or entirely new project ideas. Each idea must be presented as a single bullet point starting with a unique, relevant project name. Each bullet should contain exactly two sentences describing the idea. The ideas should focus on what can be built using hobby-grade tools (inclduing 3D printing, CNC router, soldering iron, welding, etc.) and components, unless otherwise specified. Do not reuse the original ideas with minor wording changes. Separate each idea with a line break.`; // * Prompt for AI clarification

    // * Call backend API to get clarified/modified suggestion
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    setCurrentBreakdown(data.response); // * Update state with clarified/modified response
    setClarification(''); // * Clear clarification input
    setLoading(false); // * Clear loading state
  }

  // * Handles selecting a bullet and creating a repo with its project name
  async function handleSelectBullet(bullet) {
    // Extract the project name (assume it's the first word or phrase before a colon or dash)
    let name = bullet.split(':')[0].split('-')[0].trim();
    // Remove special characters except spaces, dashes, and underscores
    name = name.replace(/[^a-zA-Z0-9 _-]/g, '');
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
    try {
      const res = await fetch('/api/github-files');
      if (!res.ok) {
        if (res.status === 401) {
          setGithubData(null);
          setGithubError('Please log in to see Repositories');
        } else {
          setGithubData(null);
          setGithubError('Failed to fetch repositories');
        }
        return;
      }
      const data = await res.json();
      setGithubData(data);
      setGithubError(null);
    } catch (err) {
      setGithubData(null);
      setGithubError('A network error occurred');
    }
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
    fetchGitHubFiles(); // Always try to fetch repos on mount

    // * Set up polling to refresh form responses every 10 seconds
    const interval = setInterval(fetchFormResponses, 10000);
    return () => clearInterval(interval); // * Cleanup on unmount
  }, []);

  // * Helper: Use currentBreakdown if available, else aiSuggestion
  const breakdownToShow = currentBreakdown || aiSuggestion;

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
        <Button onClick={createGitHubRepo}>Create GitHub Repo</Button>
      </div>

      {/* * AI Suggestion & Clarification Card */}
      {breakdownToShow && (
        <Card className="mt-6">
          <CardContent>
            <h2 className="font-semibold mb-2">AI Breakdown</h2>
            {/* * Loading indicator */}
            {loading && (
              <div className="mb-2 text-blue-600 flex items-center gap-2">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></span>
                Generating AI response...
              </div>
            )}
            <ul className="list-disc ml-5">
              {breakdownToShow
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
            {/* * Clarification/Modification Box */}
            <div className="mt-6">
              <h2 className="font-semibold mb-2">Clarify or Modify Breakdown</h2>
              <textarea
                className="w-full p-2 border rounded mb-2"
                placeholder="Add clarifications or modifications to your project idea..."
                value={clarification}
                onChange={e => setClarification(e.target.value)}
                rows={3}
                disabled={loading}
              />
              <Button onClick={handleClarification} disabled={loading || !clarification.trim()}>
                Submit Clarification
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GitHub Section */}
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
            <Button className="mt-2" onClick={handleGitHubAuth}>
              Connect to GitHub
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Google Integration Section */}
      <Card className="mt-6">
        <CardContent>
          <h2 className="font-semibold mb-2">Google Calendar:</h2>
          {googleData === null ? (
            <GoogleLogin />
          ) : calendarEvents?.length > 0 ? (
            <GoogleCalendarView events={calendarEvents} />
          ) : (
            <p>No calendar events found</p>
          )}
        </CardContent>
      </Card>
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
      </main>
  );
}
