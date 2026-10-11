/**
 * frontend/src/lib/eventImages.ts
 *
 * Client-friendly helper to map event IDs or categories to local demo images.
 * Stored locally under public/demo/events/ for fast, offline demo rendering.
 */

import eventImagesMap from "../../../database/synthetic-data/event-images.json";

export const DEFAULT_EVENT_IMAGE = "/demo/events/tech-workshop.jpg";

/**
 * Returns the local demo image path for a given event ID.
 */
export function getEventImageUrl(eventId: string): string {
  const map = eventImagesMap as Record<string, string>;
  return map[eventId] || DEFAULT_EVENT_IMAGE;
}

export { eventImagesMap };
