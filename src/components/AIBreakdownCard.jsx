import PropTypes from 'prop-types';
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
    <div className="container ai-breakdown-card">
      
      <h2>AI Breakdown</h2>

      {!breakdownToShow && (
        <input
          type="text"
          placeholder="Enter Project Idea"
          className="input"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
      )}

      {!breakdownToShow && (
        <Button className="button" onClick={handleAISuggestion}>Generate AI Breakdown</Button>
      )}

      {breakdownToShow && (
        <Card>
          <CardContent>
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

            {selectedBullet && (
              <div className="selected-bullet-row">
                <Button className="button" onClick={() => handleSelectBullet(selectedBullet)}>
                  Make Repo from This
                </Button>
              </div>
            )}

            <div className="clarification-row">
              <textarea
                className="input"
                placeholder="Add clarifications or modifications to your project idea..."
                value={clarification}
                onChange={(e) => setClarification(e.target.value)}
                rows={3}
                disabled={loading}
              />              <Button
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

AIBreakdownCard.propTypes = {
  projectName: PropTypes.string.isRequired,
  setProjectName: PropTypes.func.isRequired,
  clarification: PropTypes.string.isRequired,
  setClarification: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  breakdownToShow: PropTypes.string,
  selectedBullet: PropTypes.string.isRequired,
  setSelectedBullet: PropTypes.func.isRequired,
  handleAISuggestion: PropTypes.func.isRequired,
  handleClarification: PropTypes.func.isRequired,
  handleSelectBullet: PropTypes.func.isRequired,
};
