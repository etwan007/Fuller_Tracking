// ! Import React hooks and custom components
import { useState, useEffect, useCallback } from "react";
import { Button } from "./components/Button";
import { Card, CardContent } from "./components/Card";
import { GoogleLogin } from "./components/GoogleLogin";
import { GoogleCalendarView } from "./components/GoogleCalendarView";
import GitHubRepoList from "./components/GitHubRepoList";
import FormSubmissionsTable from "./components/FormSubmissionsTable";
import AILoader from "./components/AILoader";
import AddEventModal from "./components/AddEventModal";
import AIBreakdownCard from "./components/AIBreakdownCard";
import GoogleEventsCard from "./components/GoogleEventsCard";
import "./app.css";

// ! Main App component
export default function App() {
  // * State variables for managing UI and data
  const [projectName, setProjectName] = useState("");
  // Hardcoded AI suggestion for local UI editing
  const [aiSuggestion, setAiSuggestion] = useState("");

  const [currentBreakdown, setCurrentBreakdown] = useState("");
  const [githubData, setGithubData] = useState(null);
  const [githubError, setGithubError] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState(null);
  const [formResponses, setFormResponses] = useState(null);

  // * State for clarification/modification and bullet selection
  const [clarification, setClarification] = useState("");
  const [selectedBullet, setSelectedBullet] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);

  // * Fetches the user's GitHub repositories from backend
  const fetchGitHubFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/github-files");
      if (!res.ok) {
        if (res.status === 401) {
          setGithubData(null);
          setGithubError("Please log in to see Repositories");
        } else {
          setGithubData(null);
          setGithubError("Failed to fetch repositories");
        }
        return;
      }
      const data = await res.json();
      setGithubData(data);
      setGithubError(null);
    } catch (err) {
      setGithubData(null);
      setGithubError("A network error occurred");
    }
  }, []);



  // * Handles AI suggestion generation using the project name
  const handleAISuggestion = useCallback(async () => {
    if (!projectName.trim()) return;
    setLoading(true);
    setSelectedBullet("");
    setClarification("");
    const prompt = `Give me 5 unique and creative project ideas based on this concept. Each idea should be presented as a single bullet point and must begin with a unique, descriptive project name that relates to the concept. Each bullet should contain exactly two sentences describing the idea. The ideas should focus on what can be built using hobby-grade tools and components, unless otherwise specified. Do not split ideas into multiple bullets. Separate each idea with a line break.: ${projectName}`; // * Prompt for AI

    // * Call backend API to get AI suggestion
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    setAiSuggestion(data.response); // * Update state with AI's response
    setCurrentBreakdown(data.response); // * Update current breakdown
    setLoading(false); // * Clear loading state
  }, [projectName]);

  // * Handles clarification/modification requests
  const handleClarification = useCallback(async () => {
    if (!clarification.trim()) return; // ? Guard: Don't run if clarification is empty
    setLoading(true); // * Set loading state
    setSelectedBullet(""); // * Clear selected bullet
    const prompt = `Given the original project idea: ${projectName}, and the previous breakdown: ${currentBreakdown}, here is a new clarification or modification: ${clarification}. Based on this updated input, generate 5 revised or entirely new project ideas. Each idea must be presented as a single bullet point starting with a unique, relevant project name. Each bullet should contain exactly two sentences describing the idea. The ideas should focus on what can be built using hobby-grade tools (inclduing 3D printing, CNC router, soldering iron, welding, etc.) and components, unless otherwise specified. Do not reuse the original ideas with minor wording changes. Separate each idea with a line break.`; // * Prompt for AI clarification

    // * Call backend API to get clarified/modified suggestion
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    setCurrentBreakdown(data.response); // * Update state with clarified/modified response
    setClarification(""); // * Clear clarification input
    setLoading(false); // * Clear loading state
  }, [clarification, projectName, currentBreakdown]);

  // * Handles selecting a bullet and creating a repo with its project name
  const handleSelectBullet = useCallback(async (bullet) => {
    // Extract the project name (assume it's the first word or phrase before a colon or dash)
    let name = bullet.split(":")[0].split("-")[0].trim();
    // Remove leading dashes or colons
    name = name.replace(/^[-:]+/, "").trim();
    // Replace spaces with underscores and remove all dashes
    name = name.replace(/\s+/g, "_").replace(/-/g, "");
    // Remove special characters except underscores
    name = name.replace(/[^a-zA-Z0-9_]/g, "");
    if (!name) name = bullet.trim();
    setProjectName(name); // * Update project name

    // Create the repo
    const res = await fetch("/api/github-create-repo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (data.success) {
      alert(`GitHub repository "${name}" created!`);
      fetchGitHubFiles(); // * Refresh repo list
    } else {
      alert("Failed to create repo: " + (data.error || "Unknown error"));
    }
  }, [fetchGitHubFiles]);

  // * Initiates GitHub OAuth login flow
  const handleGitHubAuth = useCallback(async () => {
    const res = await fetch("/api/github-login");
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url; // * Redirect user to GitHub login
    }
  }, []);

  
  // * Creates a new GitHub repository with the given project name
  const createGitHubRepo = useCallback(async () => {
    if (!projectName.trim()) return alert("Enter a project name first.");
    const res = await fetch("/api/github-create-repo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: projectName }),
    });
    const data = await res.json();
    if (data.success) {
      alert("GitHub repository created!");
      fetchGitHubFiles(); // * Refresh repo list
    } else {
      alert("Failed to create repo: " + (data.error || "Unknown error"));
    }
  }, [projectName, fetchGitHubFiles]);

  // * Fetches Google Calendar events using the stored access token
  const fetchCalendar = useCallback(async () => {
    const accessToken = localStorage.getItem("google_access_token");
    if (!accessToken) return alert("No access token available.");

    const res = await fetch("/api/google-calendar", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      setCalendarEvents(data.items || []); // * Update state with calendar events
    } else {
      alert("Failed to fetch calendar events");
    }
  }, []);

  // * Fetches Google Form responses from backend
  const fetchFormResponses = useCallback(async () => {
    let url = "/api/google-form-responses";
    if (import.meta.env.MODE === "development") {
      url += "?mock=1";
    }
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setFormResponses(data.values);
    } else {
      alert("Failed to fetch form responses");
    }
  }, []);

  // --- Effects ---
  useEffect(() => {
    // * Check if redirected from Google with an access_token in the URL
    const url = new URL(window.location.href);
    const token = url.searchParams.get("access_token");

    if (token) {
      localStorage.setItem("google_access_token", token); // * Save token for later use
      setTimeout(() => {
        // * Remove token from URL for cleanliness
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }, 100);

      // * Fetch calendar events after login
      fetchCalendar();
    } else {
      // * If already logged in, fetch calendar events
      const existingToken = localStorage.getItem("google_access_token");
      if (existingToken) fetchCalendar();
    }

    fetchFormResponses(); // * Fetch form responses on load
    fetchGitHubFiles(); // <-- Add this line

    // Set up polling to refresh form responses and GitHub files every 60 seconds
    const interval = setInterval(() => {
      fetchFormResponses();
      fetchGitHubFiles();
    }, 60000); // 60,000 ms = 60 seconds

    return () => clearInterval(interval); // * Cleanup on unmount
  }, [fetchCalendar, fetchFormResponses, fetchGitHubFiles]);

  const breakdownToShow = currentBreakdown || aiSuggestion;

  // --- Render ---
  return (
    <main>
      <h1 className="main-title">Fuller Tracking</h1>
      <div className="main-container">
        <div className="row1-container">
          <FormSubmissionsTable formResponses={formResponses} />

          <AIBreakdownCard
            projectName={projectName}
            setProjectName={setProjectName}
            clarification={clarification}
            setClarification={setClarification}
            loading={loading}
            breakdownToShow={breakdownToShow}
            selectedBullet={selectedBullet}
            setSelectedBullet={setSelectedBullet}
            handleAISuggestion={handleAISuggestion}
            handleClarification={handleClarification}
            handleSelectBullet={handleSelectBullet}
          />
        </div>
        <div className="row2-container">
          <GitHubRepoList
            githubData={githubData}
            githubError={githubError}
            onLogin={handleGitHubAuth}
          />

          <GoogleEventsCard
            calendarEvents={calendarEvents}
            showAddEvent={showAddEvent}
            setShowAddEvent={setShowAddEvent}
            fetchCalendar={fetchCalendar}
          />

          {/* Add Event Modal */}
          <AddEventModal
            open={showAddEvent}
            onClose={() => setShowAddEvent(false)}
            onEventAdded={fetchCalendar} // Refresh events after adding
          />
        </div>
      </div>
    </main>
  );
}
