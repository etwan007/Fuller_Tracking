import { Card, CardContent } from "./Card";
import { Button } from "./Button";
import AILoader from "./AILoader";

export default function AIBreakdownCard({
  projectName,
  setProjectName,
  clarification,
  setClarification,
  loading,
  breakdownToShow,
  selectedBullet,
  setSelectedBullet,
  handleAISuggestion,
  handleClarification,
  handleSelectBullet,
}) {
  return (
    <div className="container">
      {/* Project Name Input (always visible) */}
      {!breakdownToShow && (
      <input
        type="text"
        placeholder="Enter Project Idea"
        className="project-input"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
      />
      )}

      {/* Only show the Generate AI Breakdown button if there is no breakdown yet */}
      {!breakdownToShow && (
        <div className="action-buttons">
          <Button onClick={handleAISuggestion}>Generate AI Breakdown</Button>
        </div>
      )}

      {/* AI Suggestion & Clarification Card */}
      {breakdownToShow && (
        <Card className="ai-breakdown-card">
          <CardContent>
            <h2>AI Breakdown</h2>
            <AILoader loading={loading} />
            <ul className="breakdown-list">
              {breakdownToShow
                .split("\n")
                .filter((line) => line.trim() !== "")
                .map((line, idx) => (
                  <li
                    key={idx}
                    className={
                      "breakdown-item" +
                      (selectedBullet === line
                        ? " breakdown-item-selected"
                        : "")
                    }
                    onClick={() => setSelectedBullet(line)}
                    title="Click to select this bullet"
                  >
                    {line.replace(/^[\-\*\d\.\s]+/, "")}
                  </li>
                ))}
            </ul>

            {/* Show "Create Repo" button if a bullet is selected */}
            {selectedBullet && (
              <div className="selected-bullet-row">
                <span className="selected-label">Selected:</span>
                <span className="selected-bullet">
                  {selectedBullet.replace(/^[\-\*\d\.\s]+/, "")}
                </span>
                <Button onClick={() => handleSelectBullet(selectedBullet)}>
                  Make Repo from This
                </Button>
              </div>
            )}

            {/* Clarification/Modification Box */}
            <div className="clarify-section">
              <h2 className="section-title">Clarify or Modify Breakdown</h2>
              <textarea
                className="clarify-input"
                placeholder="Add clarifications or modifications to your project idea..."
                value={clarification}
                onChange={(e) => setClarification(e.target.value)}
                rows={3}
                disabled={loading}
              />
              <Button
                onClick={handleClarification}
                disabled={loading || !clarification.trim()}
              >
                Submit Clarification
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}