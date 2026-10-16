function foldLine(line: string) {
  if (line.length <= 74) return line;
  const chunks: string[] = [];
  let rest = line;
  chunks.push(rest.slice(0, 74));
  rest = rest.slice(74);
  while (rest.length > 0) {
    chunks.push(' ' + rest.slice(0, 73));
    rest = rest.slice(73);
  }
  return chunks.join('\r\n');
}

function esc(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function toIcsDate(date: Date) {
  return `${date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`;
}

export function buildIcs(params: {
  uid: string;
  summary: string;
  description: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  organizerEmail?: string;
  attendeeEmail?: string;
  attendeeName?: string;
  method?: 'REQUEST' | 'CANCEL';
}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Creneau//FR',
    'CALSCALE:GREGORIAN',
    `METHOD:${params.method ?? 'REQUEST'}`,
    'BEGIN:VEVENT',
    `UID:${params.uid}@creneau.app`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(params.startsAt)}`,
    `DTEND:${toIcsDate(params.endsAt)}`,
    foldLine(`SUMMARY:${esc(params.summary)}`),
    foldLine(`DESCRIPTION:${esc(params.description)}`),
    foldLine(`LOCATION:${esc(params.location)}`),
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
  ];
  if (params.organizerEmail) lines.push(`ORGANIZER;CN=Creneau:mailto:${params.organizerEmail}`);
  if (params.attendeeEmail) {
    lines.push(
      `ATTENDEE;CN=${esc(params.attendeeName ?? params.attendeeEmail)};RSVP=FALSE:mailto:${params.attendeeEmail}`,
    );
  }
  lines.push('BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY', 'DESCRIPTION:Rappel rendez-vous', 'END:VALARM');
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}
