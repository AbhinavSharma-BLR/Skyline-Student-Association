export interface EmailJobData {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  body: string;
  kind: "announcement" | "renewal_reminder";
}

export type EmailSendResult =
  | { success: true; messageId: string }
  | { success: false; retryable: boolean; error: string };

export interface EmailProvider {
  send(job: EmailJobData, idempotencyKey: string): Promise<EmailSendResult>;
}
