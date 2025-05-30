import { Card, CardContent } from "./Card";
import { Button } from "./Button";
import { GoogleLogin } from "./GoogleLogin";
import { GoogleCalendarView } from "./GoogleCalendarView";

export default function GoogleEventsCard({
  calendarEvents,
  showAddEvent,
  setShowAddEvent,
  fetchCalendar,
}) {
  return (
    <Card className="container">
      <CardContent>
        <h2>Google Calendar:</h2>
        {!calendarEvents ? (
          <GoogleLogin />
        ) : calendarEvents.length > 0 ? (
          <>
            <div className="calendar-header">
              <h3 className="calendar-title">Upcoming Events</h3>
              <Button onClick={() => setShowAddEvent(true)}>
                Add Event
              </Button>
            </div>
            <GoogleCalendarView events={calendarEvents} />
          </>
        ) : (
          <p>No calendar events found</p>
        )}
      </CardContent>
    </Card>
  );
}