import { EmailJobData, EmailProvider, EmailSendResult } from "./EmailAdapter";

export class ConsoleEmailAdapter implements EmailProvider {
  private sentKeys = new Set<string>();
  public sentMessages: Array<{ job: EmailJobData; key: string; messageId: string }> = [];

  async send(job: EmailJobData, idempotencyKey: string): Promise<EmailSendResult> {
    if (this.sentKeys.has(idempotencyKey)) {
      return {
        success: true,
        messageId: `idempotent_${idempotencyKey}`,
      };
    }

    // Simulation check for invalid email addresses (permanent error)
    if (!job.recipientEmail || !job.recipientEmail.includes("@")) {
      return {
        success: false,
        retryable: false,
        error: "Invalid recipient email address",
      };
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.sentKeys.add(idempotencyKey);
    this.sentMessages.push({ job, key: idempotencyKey, messageId });

    if (process.env.NODE_ENV !== "test") {
      console.log(`[EMAIL_SENT] To: ${job.recipientEmail} | Subject: ${job.subject} | ID: ${messageId}`);
    }

    return {
      success: true,
      messageId,
    };
  }
}

export const emailProvider = new ConsoleEmailAdapter();
