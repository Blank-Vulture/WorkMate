/**
 * Calendar export utilities
 */

import { format } from 'date-fns';
import type { Shift, CalendarEvent } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Convert shift to calendar event
 */
export function shiftToCalendarEvent(shift: Shift): CalendarEvent {
  const dateStr = shift.date.replace(/-/g, '');
  const startTimeStr = shift.startTime.replace(':', '') + '00';
  const endTimeStr = shift.endTime.replace(':', '') + '00';
  
  return {
    uid: `${shift.id}@workmate.app`,
    summary: 'シフト',
    dtstart: `${dateStr}T${startTimeStr}`,
    dtend: `${dateStr}T${endTimeStr}`,
    description: shift.note || undefined,
  };
}

/**
 * Generate ICS file content
 */
export function generateICS(events: CalendarEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WorkMate//JP',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  
  for (const event of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.uid}`);
    lines.push(`DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`);
    lines.push(`DTSTART:${event.dtstart}`);
    lines.push(`DTEND:${event.dtend}`);
    lines.push(`SUMMARY:${escapeICSText(event.summary)}`);
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
    }
    lines.push('END:VEVENT');
  }
  
  lines.push('END:VCALENDAR');
  
  return lines.join('\r\n');
}

/**
 * Generate ICS for multiple shifts
 */
export function generateShiftsICS(shifts: Shift[]): string {
  const events = shifts.map(shiftToCalendarEvent);
  return generateICS(events);
}

/**
 * Escape text for ICS format
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

