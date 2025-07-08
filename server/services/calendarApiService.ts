import { google } from 'googleapis';
import type { InsertCalendarEvent, User } from '@shared/schema';

export class CalendarApiService {
  async fetchUserEvents(user: User, daysAhead: number = 7): Promise<InsertCalendarEvent[]> {
    if (!user.googleAccessToken) {
      throw new Error('User has no Google access token');
    }

    try {
      // Set up OAuth2 client with user's tokens
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'https://baron-inbox-dalepurvis.replit.app/api/auth/google/callback'
      );
      oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Get calendar list first
      const calendarList = await calendar.calendarList.list();
      const calendars = calendarList.data.items || [];

      const events: InsertCalendarEvent[] = [];
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + daysAhead);

      // Fetch events from each calendar
      for (const cal of calendars) {
        if (!cal.id) continue;

        try {
          const eventsResponse = await calendar.events.list({
            calendarId: cal.id,
            timeMin: now.toISOString(),
            timeMax: futureDate.toISOString(),
            maxResults: 50,
            singleEvents: true,
            orderBy: 'startTime',
          });

          const calendarEvents = eventsResponse.data.items || [];

          for (const event of calendarEvents) {
            if (!event.id || !event.summary) continue;

            const parsedEvent = this.parseCalendarEvent(event, cal.id!, user.id);
            if (parsedEvent) {
              events.push(parsedEvent);
            }
          }
        } catch (error) {
          console.error(`Failed to fetch events from calendar ${cal.id}:`, error);
          continue;
        }
      }

      return events;
    } catch (error) {
      console.error('Calendar API error:', error);
      throw new Error(`Failed to fetch calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseCalendarEvent(event: any, calendarId: string, userId: string): InsertCalendarEvent | null {
    try {
      if (!event.start || !event.end) return null;

      const startDateTime = new Date(event.start.dateTime || event.start.date);
      const endDateTime = new Date(event.end.dateTime || event.end.date);

      const attendees = event.attendees?.map((a: any) => a.email).filter(Boolean) || [];

      return {
        id: event.id,
        summary: event.summary || 'Untitled Event',
        description: event.description || null,
        startDateTime,
        endDateTime,
        location: event.location || null,
        attendees,
        calendarId,
        userId,
      };
    } catch (error) {
      console.error('Failed to parse calendar event:', error);
      return null;
    }
  }

  async testConnection(user: User): Promise<boolean> {
    try {
      if (!user.googleAccessToken) return false;

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
      );
      oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      await calendar.calendarList.list({ maxResults: 1 });
      return true;
    } catch (error) {
      console.error('Calendar connection test failed:', error);
      return false;
    }
  }
}

export const calendarApiService = new CalendarApiService();