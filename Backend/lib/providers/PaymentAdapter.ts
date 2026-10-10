export interface PaymentIntentRequest {
  referenceId: string;
  category: "membership" | "booking" | "order";
  userId: string;
  amountPaise: number;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  intentId: string;
  clientSecret: string;
  amountPaise: number;
  mode: "demo" | "live";
}

export interface PaymentWebhookVerification {
  isValid: boolean;
  event?: {
    intentId: string;
    referenceId: string;
    category: "membership" | "booking" | "order";
    amountPaise: number;
    status: "succeeded" | "failed";
  };
}

export interface PaymentAdapter {
  createIntent(request: PaymentIntentRequest): Promise<PaymentIntentResult>;
  verifyWebhook(rawBody: string, signature: string): Promise<PaymentWebhookVerification>;
}
