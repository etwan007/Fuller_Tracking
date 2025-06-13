// Import React hooks and custom components
import { useState, useEffect } from "react";
import { LoginMenu } from "./components/LoginMenu";
import GitHubRepoList from "./components/GitHubRepoList";
import FormSubmissionsTable from "./components/FormSubmissionsTable";
import AddEventModal from "./components/AddEventModal";
import AIBreakdownCard from "./components/AIBreakdownCard";
import GoogleEventsCard from "./components/GoogleEventsCard";
import TaskTable from "./components/TaskTable";
import "./styles/app.css";
import { firebaseSignInWithGoogleAccessToken } from "./utils/firebaseSignIn";
import { auth } from "./firebase";
import { useProjectSuggestions } from "./hooks/useProjectSuggestions";
import { useGoogleCalendar } from "./hooks/useGoogleCalendar";
import { useGitHubRepo } from "./hooks/useGitHubRepo";
import { useGoogleForms } from "./hooks/useGoogleForms";
import { LOCAL_STORAGE_KEYS, POLLING_INTERVALS } from "./constants";

// Main App component
export default function App() {
  const [user, setUser] = useState(null);

  // Custom hooks for feature-specific logic
  const projectSuggestions = useProjectSuggestions();
  const googleCalendar = useGoogleCalendar();
  const gitHubRepo = useGitHubRepo(user);
  const googleForms = useGoogleForms();

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);
  // Handle OAuth callbacks and initialize data fetching
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("access_token");
    const githubToken = url.searchParams.get("github_access_token");    if (token) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.GOOGLE_ACCESS_TOKEN, token);
      setTimeout(() => {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }, 100);

      firebaseSignInWithGoogleAccessToken(token)
        .then(() => {
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        })
        .catch((err) => {
          alert("Firebase sign-in failed: " + err.message);
        });

      googleCalendar.fetchCalendar();
    } else if (githubToken) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.GITHUB_ACCESS_TOKEN, githubToken);
      setTimeout(() => {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }, 100);
    } else {
      const existingToken = localStorage.getItem(LOCAL_STORAGE_KEYS.GOOGLE_ACCESS_TOKEN);
      if (existingToken) googleCalendar.fetchCalendar();
    }

    googleForms.fetchFormResponses();

    // Set up polling to refresh form responses
    const interval = setInterval(() => {
      googleForms.fetchFormResponses();
      console.log(user?.uid || "No Firebase user logged in");
    }, POLLING_INTERVALS.FORM_RESPONSES);

    return () => clearInterval(interval);
  }, [googleCalendar.fetchCalendar, googleForms.fetchFormResponses]);
  return (
    <main>
      <div className="header">
        <LoginMenu />
        <h1 className="main-title">Fuller Tracking</h1>
      </div>
      <div className="main-container">
        <div className="row1-container">
          <TaskTable />
          <FormSubmissionsTable formResponses={googleForms.formResponses} />
        </div>
        <div className="row2-container">
          <AIBreakdownCard
            projectName={projectSuggestions.projectName}
            setProjectName={projectSuggestions.setProjectName}
            clarification={projectSuggestions.clarification}
            setClarification={projectSuggestions.setClarification}
            loading={projectSuggestions.loading}
            breakdownToShow={projectSuggestions.breakdownToShow}
            selectedBullet={projectSuggestions.selectedBullet}
            setSelectedBullet={projectSuggestions.setSelectedBullet}
            handleAISuggestion={projectSuggestions.handleAISuggestion}
            handleClarification={projectSuggestions.handleClarification}
            handleSelectBullet={gitHubRepo.handleSelectBullet}
          />
          <GitHubRepoList />
          <GoogleEventsCard
            calendarEvents={googleCalendar.calendarEvents}
            showAddEvent={googleCalendar.showAddEvent}
            setShowAddEvent={googleCalendar.setShowAddEvent}
            fetchCalendar={googleCalendar.fetchCalendar}
          />
          <AddEventModal
            open={googleCalendar.showAddEvent}
            onClose={() => googleCalendar.setShowAddEvent(false)}
            onEventAdded={googleCalendar.fetchCalendar}
          />
        </div>
      </div>
    </main>
  );
}
