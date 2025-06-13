import { useState, useCallback } from "react";
import { API_ENDPOINTS, LOCAL_STORAGE_KEYS } from "../constants";

/**
 * Custom hook for managing Google Calendar integration
 */
export function useGoogleCalendar() {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);

  const fetchCalendar = useCallback(async () => {
    const accessToken = localStorage.getItem(LOCAL_STORAGE_KEYS.GOOGLE_ACCESS_TOKEN);
    if (!accessToken) {
      console.warn("No access token available for Google Calendar");
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.GOOGLE_CALENDAR, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCalendarEvents(data.items || []);
      } else {
        console.error("Failed to fetch calendar events");
      }
    } catch (error) {
      console.error("Error fetching calendar events:", error);
    }
  }, []);

  return {
    calendarEvents,
    showAddEvent,
    setShowAddEvent,
    fetchCalendar,
  };
}
