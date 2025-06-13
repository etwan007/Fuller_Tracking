import { useState, useCallback } from "react";
import { API_ENDPOINTS, AI_PROMPTS } from "../constants";

/**
 * Custom hook for managing AI-powered project suggestions
 */
export function useProjectSuggestions() {
  const [projectName, setProjectName] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [currentBreakdown, setCurrentBreakdown] = useState("");
  const [clarification, setClarification] = useState("");
  const [selectedBullet, setSelectedBullet] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAISuggestion = useCallback(async () => {
    if (!projectName.trim()) return;
    
    setLoading(true);
    setSelectedBullet("");
    setClarification("");
    
    const prompt = AI_PROMPTS.PROJECT_IDEAS(projectName);

    try {
      const res = await fetch(API_ENDPOINTS.AI, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setAiSuggestion(data.response);
      setCurrentBreakdown(data.response);
    } catch (error) {
      console.error("Failed to get AI suggestion:", error);
    } finally {
      setLoading(false);
    }
  }, [projectName]);

  const handleClarification = useCallback(async () => {
    if (!clarification.trim()) return;
    
    setLoading(true);
    setSelectedBullet("");
    
    const prompt = AI_PROMPTS.CLARIFICATION(projectName, currentBreakdown, clarification);

    try {
      const res = await fetch(API_ENDPOINTS.AI, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setCurrentBreakdown(data.response);
      setClarification("");
    } catch (error) {
      console.error("Failed to get clarified suggestion:", error);
    } finally {
      setLoading(false);
    }
  }, [clarification, projectName, currentBreakdown]);

  const breakdownToShow = currentBreakdown || aiSuggestion;

  return {
    projectName,
    setProjectName,
    clarification,
    setClarification,
    selectedBullet,
    setSelectedBullet,
    loading,
    breakdownToShow,
    handleAISuggestion,
    handleClarification,
  };
}
