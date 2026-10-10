import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { ReceiptService } from "@/lib/services/ReceiptService";
import { ClaimService } from "@/lib/services/ClaimService";
import { SkylineError } from "@/lib/api/errors";

test("ReceiptService - Magic Byte Inspection & Path Traversal Prevention", async (t) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "skyline-receipts-"));
  const receiptService = new ReceiptService(tempDir);

  await t.test("accepts valid JPEG buffer with FF D8 FF signature", () => {
    const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const mime = receiptService.detectMimeType(validJpeg, "receipt.jpg");
    assert.equal(mime, "image/jpeg");
  });

  await t.test("accepts valid PNG buffer with 89 50 4E 47 signature", () => {
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const mime = receiptService.detectMimeType(validPng, "bill.png");
    assert.equal(mime, "image/png");
  });

  await t.test("accepts valid PDF buffer with %PDF signature", () => {
    const validPdf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const mime = receiptService.detectMimeType(validPdf, "invoice.pdf");
    assert.equal(mime, "application/pdf");
  });

  await t.test("rejects spoofed file with .pdf extension containing plain text", () => {
    const fakePdf = Buffer.from("Hello world, this is a plain text file pretending to be PDF");
    assert.throws(
      () => receiptService.detectMimeType(fakePdf, "fake.pdf"),
      (err: any) => {
        assert(err instanceof SkylineError);
        assert.equal(err.code, "VALIDATION_ERROR");
        assert.equal(err.statusCode, 422);
        return true;
      }
    );
  });

  await t.test("rejects file exceeding 5 MB limit", async () => {
    const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024, 0); // 6 MB
    await assert.rejects(
      async () => {
        await receiptService.saveReceipt(oversizedBuffer, "large.pdf");
      },
      (err: any) => {
        assert(err instanceof SkylineError);
        assert.equal(err.code, "VALIDATION_ERROR");
        assert.equal(err.statusCode, 422);
        return true;
      }
    );
  });

  await t.test("prevents directory traversal attempts", () => {
    assert.throws(
      () => receiptService.resolveSafePath("../../etc/passwd"),
      (err: any) => {
        assert(err instanceof SkylineError);
        assert.equal(err.code, "FORBIDDEN");
        assert.equal(err.statusCode, 400);
        return true;
      }
    );
  });

  // Cleanup
  await fs.rm(tempDir, { recursive: true, force: true });
});

test("ClaimService - Separation of Duties & Financial Invariants", async (t) => {
  const mockClaims: any[] = [];
  const mockCashbook: any[] = [];

  const fakePrisma: any = {
    claim: {
      findUnique: async ({ where }: any) => {
        return mockClaims.find((c) => c.id === where.id) || null;
      },
      create: async ({ data }: any) => {
        const item = {
          id: `claim-${mockClaims.length + 1}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockClaims.push(item);
        return item;
      },
      update: async ({ where, data }: any) => {
        const idx = mockClaims.findIndex((c) => c.id === where.id);
        if (idx === -1) throw new Error("Claim not found");
        mockClaims[idx] = { ...mockClaims[idx], ...data, updatedAt: new Date() };
        return mockClaims[idx];
      },
      updateMany: async ({ where, data }: any) => {
        const matching = mockClaims.filter((c) => {
          if (where.id && c.id !== where.id) return false;
          if (where.status && c.status !== where.status) return false;
          return true;
        });
        matching.forEach((c) => Object.assign(c, data, { updatedAt: new Date() }));
        return { count: matching.length };
      },
    },
    cashbookEntry: {
      create: async ({ data }: any) => {
        const entry = { id: `cash-${mockCashbook.length + 1}`, ...data };
        mockCashbook.push(entry);
        return entry;
      },
    },
    $transaction: async (fn: any) => fn(fakePrisma),
  };

  const service = new ClaimService();
  const originalPrisma = (globalThis as any).prismaGlobal;
  (globalThis as any).prismaGlobal = fakePrisma;

  let submittedClaimId = "";

  await t.test("submits reimbursement claim with positive amount in paise", async () => {
    const claim = await service.submitClaim("claimant-1", {
      title: "Audio Cable Replacements",
      description: "Purchased two 10m XLR cables for stage mixer",
      amountPaise: 250000, // INR 2,500.00
    });
    submittedClaimId = claim.id;
    assert.equal(claim.status, "submitted");
    assert.equal(claim.amountPaise, 250000);
  });

  await t.test("prohibits claimant from self-approving their own claim", async () => {
    await assert.rejects(
      async () => {
        await service.approveClaim("claimant-1", submittedClaimId, "Self approval attempt");
      },
      (err: any) => {
        assert(err instanceof SkylineError);
        assert.equal(err.code, "SELF_APPROVAL_FORBIDDEN");
        assert.equal(err.statusCode, 403);
        return true;
      }
    );
  });

  await t.test("treasurer approval changes status but writes ZERO cashbook entries", async () => {
    const approved = await service.approveClaim(
      "treasurer-1",
      submittedClaimId,
      "Receipt verified with electronics store"
    );
    assert.equal(approved.status, "approved");
    assert.equal(mockCashbook.length, 0); // Approval does NOT reduce cash balance!
  });

  await t.test("prohibits claimant from executing payout for their own claim", async () => {
    await assert.rejects(
      async () => {
        await service.payoutClaim("claimant-1", submittedClaimId, "UPI-REF-001");
      },
      (err: any) => {
        assert(err instanceof SkylineError);
        assert.equal(err.code, "SELF_PAYOUT_FORBIDDEN");
        assert.equal(err.statusCode, 403);
        return true;
      }
    );
  });

  await t.test("treasurer (even if same person who reviewed) can execute payout for a member claim", async () => {
    // MVP rule: Reviewer can record payout, provided they are not the claimant!
    const paid = await service.payoutClaim("treasurer-1", submittedClaimId, "UPI-REF-001");
    assert.equal(paid.status, "paid");
    assert.equal(mockCashbook.length, 1);
    const entry = mockCashbook[0];
    assert.equal(entry.direction, "OUTFLOW");
    assert.equal(entry.category, "claim_payout");
    assert.equal(entry.amountPaise, BigInt(250000));
    assert.equal(entry.claimId, submittedClaimId);
  });

  await t.test("duplicate simultaneous payout is rejected by atomic state transition", async () => {
    await assert.rejects(
      async () => {
        await service.payoutClaim("treasurer-1", submittedClaimId, "UPI-REF-DUP");
      },
      (err: any) => {
        assert(err instanceof SkylineError);
        assert.equal(err.code, "CONFLICT");
        assert.equal(err.statusCode, 409);
        return true;
      }
    );
    assert.equal(mockCashbook.length, 1); // Zero duplicate cashbook entries!
  });

  (globalThis as any).prismaGlobal = originalPrisma;
});
