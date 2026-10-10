import { nanoid } from "nanoid";
import { PaymentAdapter, PaymentIntentRequest, PaymentIntentResult, PaymentWebhookVerification } from "./PaymentAdapter";
import { SkylineError } from "@/lib/api/errors";

export class DemoPaymentAdapter implements PaymentAdapter {
  constructor() {
    // Assert demo mode check
    if (process.env.PAYMENT_MODE && process.env.PAYMENT_MODE !== "demo") {
      throw new Error("DemoPaymentAdapter cannot be instantiated in live payment mode");
    }
  }

  async createIntent(request: PaymentIntentRequest): Promise<PaymentIntentResult> {
    const intentId = `demo_intent_${nanoid(16)}`;

    return {
      intentId,
      clientSecret: `demo_secret_${nanoid(24)}`,
      amountPaise: request.amountPaise,
      mode: "demo",
    };
  }

  async verifyWebhook(rawBody: string, signature: string): Promise<PaymentWebhookVerification> {
    try {
      const payload = JSON.parse(rawBody);

      // In demo mode, verify demo token signature header
      if (signature !== "demo_valid_signature" && signature !== process.env.PAYMENT_WEBHOOK_SECRET) {
        return { isValid: false };
      }

      return {
        isValid: true,
        event: {
          intentId: payload.intentId || `demo_intent_${nanoid(8)}`,
          referenceId: payload.referenceId,
          category: payload.category,
          amountPaise: Number(payload.amountPaise),
          status: payload.status === "failed" ? "failed" : "succeeded",
        },
      };
    } catch {
      return { isValid: false };
    }
  }

  /**
   * Helper to simulate zero-cost instant confirmation in demo mode.
   * Guarded against live environments.
   */
  static assertDemoMode(): void {
    if (process.env.PAYMENT_MODE !== "demo") {
      throw new SkylineError("DEMO_MODE_ONLY", "Demo payment confirmation is only available in demo mode", 404);
    }
  }
}
