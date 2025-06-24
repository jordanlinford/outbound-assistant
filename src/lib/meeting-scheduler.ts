import { google, calendar_v3 } from 'googleapis';
import { Client, AuthProviderCallback } from '@microsoft/microsoft-graph-client';
import { z } from 'zod';

interface MeetingDetails {
  email: string;
  name: string;
  company?: string;
  title?: string;
  duration?: number; // in minutes
  timezone?: string;
}

interface CalendarEvent {
  id: string;
  link: string;
  startTime: Date;
  endTime: Date;
}

const MeetingDetailsSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  company: z.string().optional(),
  title: z.string().optional(),
  duration: z.number().min(15).max(120).default(30),
  timezone: z.string().default('UTC'),
});

export async function scheduleMeeting(
  details: MeetingDetails,
  calendarToken: string,
  provider: 'google' | 'microsoft'
): Promise<CalendarEvent> {
  const validatedDetails = MeetingDetailsSchema.parse(details);
  const duration = validatedDetails.duration || 30;

  if (provider === 'google') {
    return scheduleGoogleMeeting(validatedDetails, calendarToken, duration);
  } else {
    return scheduleMicrosoftMeeting(validatedDetails, calendarToken, duration);
  }
}

async function scheduleGoogleMeeting(
  details: MeetingDetails,
  token: string,
  duration: number
): Promise<CalendarEvent> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: token });

  const calendar = google.calendar({ version: 'v3', auth });

  // Find next available 30-minute slot
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59);

  const events = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  const busySlots = events.data.items?.map((event: calendar_v3.Schema$Event) => ({
    start: new Date(event.start?.dateTime || ''),
    end: new Date(event.end?.dateTime || ''),
  })) || [];

  const availableSlot = findAvailableSlot(busySlots, duration);
  const endTime = new Date(availableSlot.getTime() + duration * 60000);

  // Create the calendar event
  const event = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `Meeting with ${details.name}${details.company ? ` from ${details.company}` : ''}`,
      description: `Meeting with ${details.name}${details.title ? ` (${details.title})` : ''}${details.company ? ` from ${details.company}` : ''}`,
      start: {
        dateTime: availableSlot.toISOString(),
        timeZone: details.timezone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: details.timezone,
      },
      attendees: [
        { email: details.email },
      ],
      reminders: {
        useDefault: true,
      },
      conferenceData: {
        createRequest: {
          requestId: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
    conferenceDataVersion: 1,
  });

  return {
    id: event.data.id!,
    link: event.data.hangoutLink || event.data.htmlLink!,
    startTime: availableSlot,
    endTime,
  };
}

async function scheduleMicrosoftMeeting(
  details: MeetingDetails,
  token: string,
  duration: number
): Promise<CalendarEvent> {
  const client = Client.init({
    authProvider: (done: AuthProviderCallback) => {
      done(null, token);
    },
  });

  // Find next available slot
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59);

  const events = await client
    .api('/me/calendarview')
    .query({
      startDateTime: now.toISOString(),
      endDateTime: endOfDay.toISOString(),
    })
    .get();

  const busySlots = events.value.map((event: { start: { dateTime: string }; end: { dateTime: string } }) => ({
    start: new Date(event.start.dateTime),
    end: new Date(event.end.dateTime),
  }));

  const availableSlot = findAvailableSlot(busySlots, duration);
  const endTime = new Date(availableSlot.getTime() + duration * 60000);

  // Create the calendar event
  const event = await client
    .api('/me/events')
    .post({
      subject: `Meeting with ${details.name}${details.company ? ` from ${details.company}` : ''}`,
      body: {
        contentType: 'text',
        content: `Meeting with ${details.name}${details.title ? ` (${details.title})` : ''}${details.company ? ` from ${details.company}` : ''}`,
      },
      start: {
        dateTime: availableSlot.toISOString(),
        timeZone: details.timezone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: details.timezone,
      },
      attendees: [
        {
          emailAddress: {
            address: details.email,
            name: details.name,
          },
          type: 'required',
        },
      ],
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness',
    });

  return {
    id: event.id!,
    link: event.onlineMeeting?.joinUrl || event.webLink!,
    startTime: availableSlot,
    endTime,
  };
}

function findAvailableSlot(busySlots: { start: Date; end: Date }[], duration: number): Date {
  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30); // Round up to next 30-minute slot

  // Sort busy slots by start time
  busySlots.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Find first available slot
  let currentTime = now;
  for (const slot of busySlots) {
    const slotEnd = new Date(currentTime.getTime() + duration * 60000);
    if (slotEnd <= slot.start) {
      return currentTime;
    }
    currentTime = new Date(Math.max(currentTime.getTime(), slot.end.getTime()));
  }

  return currentTime;
}

// Example usage:
/*
const meeting = await scheduleMeeting(
  {
    email: 'prospect@company.com',
    name: 'John Doe',
    company: 'Acme Inc',
    title: 'CTO',
  },
  'google-oauth-token',
  'google'
);
*/ 