/**
 * Backend/lib/events/eventImages.ts
 *
 * Shared helper providing stable local event images for synthetic and club events.
 * Keyed by stable activity ID, referencing permitted local assets under public/demo/events/.
 */

import eventImagesMap from "../../../database/synthetic-data/event-images.json";

export const DEFAULT_EVENT_IMAGE = "/demo/events/tech-workshop.jpg";

/**
 * Returns the stable local demo image URL for a given event ID.
 * Keyed by stable ID (e.g. 'synth-event-001' -> '/demo/events/music-concert.jpg').
 */
export function getEventImageUrl(eventId: string): string {
  const map = eventImagesMap as Record<string, string>;
  return map[eventId] || DEFAULT_EVENT_IMAGE;
}

export { eventImagesMap };
