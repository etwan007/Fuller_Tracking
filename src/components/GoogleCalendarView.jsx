import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { enUS } from 'date-fns/locale';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

function mapGoogleEventsToCalendar(events) {
  if (!events) return [];
  return events.map(ev => ({
    id: ev.id,
    title: ev.summary || '(No Title)',
    start: new Date(ev.start.dateTime || ev.start.date),
    end: new Date(ev.end?.dateTime || ev.end?.date || ev.start.dateTime || ev.start.date),
    allDay: !ev.start.dateTime,
  }));
}

export function GoogleCalendarView({ events }) {
  const calendarEvents = mapGoogleEventsToCalendar(events);

  return (
    <div style={{ height: 500 }}>
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        allDayAccessor="allDay"
        style={{ height: 500 }}
      />
    </div>
  );
}