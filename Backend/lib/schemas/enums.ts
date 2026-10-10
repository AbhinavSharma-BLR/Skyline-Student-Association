// Import Zod library for building validated schemas and enum types
import { z } from "zod";

// Zod schema defining valid status values for club memberships
export const MembershipStatusSchema = z.enum([
  // Initial state when membership is requested but awaiting payment/activation
  "pending",
  // Active member with full voting and discount privileges
  "active",
  // Membership period has ended without renewal
  "expired",
  // Membership was voided or cancelled by an officer/system
  "cancelled",
]);

// TypeScript union type inferred from the MembershipStatusSchema
export type MembershipStatus = z.infer<typeof MembershipStatusSchema>;

// Zod schema defining the lifecycle states of an activity or event
export const ActivityStatusSchema = z.enum([
  // Draft state visible only to club officers
  "draft",
  // Published state visible to all students and members
  "published",
  // Event has concluded
  "completed",
  // Event was cancelled by organizers
  "cancelled",
]);

// TypeScript union type inferred from ActivityStatusSchema
export type ActivityStatus = z.infer<typeof ActivityStatusSchema>;

// Zod schema defining the reservation states for activity tickets
export const BookingStatusSchema = z.enum([
  // Seat reserved temporarily awaiting payment settlement
  "pending_payment",
  // Payment settled and ticket issued
  "confirmed",
  // Booking cancelled by attendee or officer
  "cancelled",
  // Reservation timed out due to non-payment
  "expired",
]);

// TypeScript union type inferred from BookingStatusSchema
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

// Zod schema defining merchandise order states
export const OrderStatusSchema = z.enum([
  // Order placed awaiting payment confirmation
  "pending_payment",
  // Payment confirmed and inventory reserved
  "confirmed",
  // Items collected by the student at the club desk
  "fulfilled",
  // Order cancelled prior to pickup
  "cancelled",
  // Order expired due to non-payment within timeout window
  "expired",
]);

// TypeScript union type inferred from OrderStatusSchema
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

// Zod schema defining volunteer task workflow states
export const TaskStatusSchema = z.enum([
  // Task created and open for assignment
  "open",
  // Volunteer assigned and actively working on the task
  "in_progress",
  // Task completed and verified
  "done",
  // Task dismissed or no longer needed
  "cancelled",
]);

// TypeScript union type inferred from TaskStatusSchema
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

// Zod schema defining reimbursement claim workflow states
export const ClaimStatusSchema = z.enum([
  // Claim submitted with receipt by member/officer
  "submitted",
  // Claim currently under review by treasurer
  "under_review",
  // Claim approved for reimbursement by treasurer
  "approved",
  // Claim rejected by treasurer with review notes
  "rejected",
  // Payout executed and reference recorded by treasurer
  "paid",
]);

// TypeScript union type inferred from ClaimStatusSchema
export type ClaimStatus = z.infer<typeof ClaimStatusSchema>;

// Zod schema defining administrative database roles stored in the `roles` table
// Database Constraint: chk_role_value CHECK (role IN ('officer', 'treasurer'))
export const AdminRoleSchema = z.enum([
  // Club executive officer with management desk access
  "officer",
  // Finance executive with financial approval and payout authority
  "treasurer",
]);

// TypeScript union type for database administrative roles
export type AdminRole = z.infer<typeof AdminRoleSchema>;

// Zod schema defining user personas for display and API contracts
// Architectural Rule: Keep membership eligibility separate from administrative permissions.
// - "student" = default authenticated account without active membership or officer roles
// - "member" = dynamically derived when active membership exists (not stored in `roles` table)
// - "officer" / "treasurer" = administrative roles stored in `roles` table
export const RoleSchema = z.enum([
  "student",
  "member",
  "officer",
  "treasurer",
]);

// TypeScript union type inferred from RoleSchema
export type Role = z.infer<typeof RoleSchema>;

// Zod schema defining QR ticket scan check-in outcome
export const CheckinResultSchema = z.enum([
  // Valid ticket verified and attendee admitted
  "ACCEPTED",
  // Check-in denied due to invalid, used, or mismatching ticket
  "DENIED",
]);

// TypeScript union type inferred from CheckinResultSchema
export type CheckinResult = z.infer<typeof CheckinResultSchema>;
