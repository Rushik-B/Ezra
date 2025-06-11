"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const googleapis_1 = require("googleapis");
const prisma_1 = require("./prisma");
class CalendarService {
    calendar;
    auth;
    userId;
    constructor(accessToken, refreshToken, userId) {
        this.userId = userId || '';
        this.auth = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.NEXTAUTH_URL + '/api/auth/callback/google');
        this.auth.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
        });
        this.calendar = googleapis_1.google.calendar({ version: 'v3', auth: this.auth });
    }
    async refreshTokenIfNeeded() {
        try {
            const { credentials } = await this.auth.refreshAccessToken();
            this.auth.setCredentials(credentials);
            // Update token in database if we have userId
            if (this.userId && credentials.access_token) {
                await prisma_1.prisma.oAuthAccount.updateMany({
                    where: {
                        userId: this.userId,
                        provider: 'google'
                    },
                    data: {
                        accessToken: credentials.access_token,
                        refreshToken: credentials.refresh_token || undefined,
                        expiresAt: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : undefined
                    }
                });
                console.log('✅ Calendar OAuth token refreshed and updated in database');
            }
        }
        catch (error) {
            console.error('❌ Error refreshing calendar OAuth token:', error);
            throw new Error('Failed to refresh calendar access token');
        }
    }
    /**
     * Get events within a date range
     */
    async getEvents(startDate, endDate, maxResults = 50) {
        try {
            console.log(`📅 Fetching calendar events from ${startDate.toISOString()} to ${endDate.toISOString()}`);
            const response = await this.calendar.events.list({
                calendarId: 'primary',
                timeMin: startDate.toISOString(),
                timeMax: endDate.toISOString(),
                maxResults,
                singleEvents: true,
                orderBy: 'startTime',
            });
            const events = response.data.items || [];
            console.log(`📅 Found ${events.length} calendar events`);
            return events.map(this.parseCalendarEvent).filter(Boolean);
        }
        catch (error) {
            if (error.response?.status === 401) {
                console.log('🔄 Calendar token expired, attempting refresh...');
                await this.refreshTokenIfNeeded();
                return this.getEvents(startDate, endDate, maxResults);
            }
            console.error('❌ Error fetching calendar events:', error);
            throw error;
        }
    }
    /**
     * Check availability for a specific time slot
     */
    async checkAvailability(startTime, endTime, attendees) {
        try {
            console.log(`🔍 Checking availability from ${startTime.toISOString()} to ${endTime.toISOString()}`);
            // Get events for the specified time range
            const events = await this.getEvents(startTime, endTime);
            // Filter for conflicting events (events that overlap with the requested time)
            const conflictingEvents = events.filter(event => {
                const eventStart = new Date(event.start.dateTime);
                const eventEnd = new Date(event.end.dateTime);
                // Check for overlap
                return ((eventStart < endTime && eventEnd > startTime) &&
                    event.status !== 'cancelled');
            });
            const isFree = conflictingEvents.length === 0;
            // If not free, suggest alternative times (simple implementation)
            let suggestedTimes = [];
            if (!isFree) {
                // Find next available slot after the requested time
                const duration = endTime.getTime() - startTime.getTime();
                const nextSlotStart = new Date(endTime.getTime() + (30 * 60 * 1000)); // 30 min buffer
                const nextSlotEnd = new Date(nextSlotStart.getTime() + duration);
                suggestedTimes = [{
                        start: nextSlotStart.toISOString(),
                        end: nextSlotEnd.toISOString()
                    }];
            }
            console.log(`📅 Availability check: ${isFree ? 'FREE' : 'BUSY'} (${conflictingEvents.length} conflicts)`);
            return {
                isFree,
                conflictingEvents,
                suggestedTimes: !isFree ? suggestedTimes : undefined
            };
        }
        catch (error) {
            console.error('❌ Error checking availability:', error);
            throw error;
        }
    }
    /**
     * Create a calendar event
     */
    async createEvent(eventDetails) {
        try {
            console.log(`📅 Creating calendar event: ${eventDetails.summary}`);
            const event = {
                summary: eventDetails.summary,
                description: eventDetails.description,
                start: {
                    dateTime: eventDetails.startTime.toISOString(),
                    timeZone: 'America/Los_Angeles', // Default timezone, could be configurable
                },
                end: {
                    dateTime: eventDetails.endTime.toISOString(),
                    timeZone: 'America/Los_Angeles',
                },
                attendees: eventDetails.attendees?.map(email => ({ email })),
                location: eventDetails.location,
            };
            const response = await this.calendar.events.insert({
                calendarId: 'primary',
                resource: event,
                sendUpdates: 'all', // Send invites to attendees
            });
            console.log(`✅ Calendar event created: ${response.data.id}`);
            return this.parseCalendarEvent(response.data);
        }
        catch (error) {
            if (error.response?.status === 401) {
                console.log('🔄 Calendar token expired, attempting refresh...');
                await this.refreshTokenIfNeeded();
                return this.createEvent(eventDetails);
            }
            console.error('❌ Error creating calendar event:', error);
            throw error;
        }
    }
    /**
     * Get today's events for quick context
     */
    async getTodaysEvents() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return this.getEvents(today, tomorrow);
    }
    /**
     * Get this week's events for broader context
     */
    async getWeekEvents() {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
        endOfWeek.setHours(23, 59, 59, 999);
        return this.getEvents(startOfWeek, endOfWeek);
    }
    /**
     * Parse Google Calendar event to our CalendarEvent interface
     */
    parseCalendarEvent(event) {
        try {
            if (!event.id)
                return null;
            return {
                id: event.id,
                summary: event.summary || '(No title)',
                description: event.description,
                start: {
                    dateTime: event.start?.dateTime || event.start?.date,
                    timeZone: event.start?.timeZone
                },
                end: {
                    dateTime: event.end?.dateTime || event.end?.date,
                    timeZone: event.end?.timeZone
                },
                attendees: event.attendees?.map((attendee) => ({
                    email: attendee.email,
                    displayName: attendee.displayName,
                    responseStatus: attendee.responseStatus
                })),
                status: event.status || 'confirmed',
                location: event.location
            };
        }
        catch (error) {
            console.error('Error parsing calendar event:', error);
            return null;
        }
    }
    /**
     * Generate a text summary of calendar data for LLM consumption
     */
    generateCalendarSummary(events, availability) {
        let summary = '';
        if (availability) {
            summary += `AVAILABILITY CHECK:\n`;
            summary += `Status: ${availability.isFree ? 'FREE' : 'BUSY'}\n`;
            if (availability.conflictingEvents.length > 0) {
                summary += `Conflicts: ${availability.conflictingEvents.map(e => `"${e.summary}" (${e.start.dateTime} - ${e.end.dateTime})`).join(', ')}\n`;
            }
            if (availability.suggestedTimes) {
                summary += `Suggested alternatives: ${availability.suggestedTimes.map(t => `${t.start} - ${t.end}`).join(', ')}\n`;
            }
            summary += '\n';
        }
        if (events.length > 0) {
            summary += `RELEVANT CALENDAR EVENTS:\n`;
            events.forEach(event => {
                summary += `- "${event.summary}" on ${event.start.dateTime}`;
                if (event.attendees && event.attendees.length > 0) {
                    summary += ` (with ${event.attendees.map(a => a.email).join(', ')})`;
                }
                if (event.location) {
                    summary += ` at ${event.location}`;
                }
                summary += '\n';
            });
        }
        else {
            summary += 'No relevant calendar events found.\n';
        }
        return summary;
    }
}
exports.CalendarService = CalendarService;
