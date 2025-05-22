import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import '@fullcalendar/common/main.min.css';
import '@fullcalendar/daygrid/main.min.css';

function mapGoogleEventsToFullCalendar(events) {
  if (!events) return [];
  return events.map(ev => ({
    id: ev.id,
    title: ev.summary || '(No Title)',
    start: ev.start.dateTime || ev.start.date,
    end: ev.end?.dateTime || ev.end?.date || ev.start.dateTime || ev.start.date,
    allDay: !ev.start.dateTime,
  }));
}

export function GoogleCalendarView({ events }) {
  const calendarEvents = mapGoogleEventsToFullCalendar(events);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={calendarEvents}
        height={500}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek,dayGridDay'
        }}
      />
    </div>
  );
}