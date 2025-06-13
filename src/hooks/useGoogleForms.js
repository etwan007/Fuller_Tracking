import { useState, useCallback } from "react";
import { API_ENDPOINTS } from "../constants";

/**
 * Custom hook for managing Google Forms data
 */
export function useGoogleForms() {
  const [formResponses, setFormResponses] = useState(null);

  const fetchFormResponses = useCallback(async () => {
    try {
      let url = API_ENDPOINTS.GOOGLE_FORM_RESPONSES;
      if (import.meta.env.MODE === "development") {
        url += "?mock=1";
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFormResponses(data.values);
      } else {
        console.error("Failed to fetch form responses");
      }
    } catch (error) {
      console.error("Error fetching form responses:", error);
    }
  }, []);

  return {
    formResponses,
    fetchFormResponses,
  };
}
