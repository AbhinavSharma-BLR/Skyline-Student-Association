import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { SkylineError } from "@/lib/api/errors";

export interface StoredReceipt {
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".pdf"]);

// Magic byte signatures
const MAGIC_SIGNATURES: Record<string, number[]> = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
};

export class ReceiptService {
  private uploadDir: string;

  constructor(customUploadDir?: string) {
    this.uploadDir = path.resolve(
      customUploadDir || process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads", "receipts")
    );
  }

  public getUploadDir(): string {
    return this.uploadDir;
  }

  /**
   * Verifies file buffer headers against expected magic byte patterns.
   * Prevents disguised executable or script uploads with spoofed extensions.
   */
  public detectMimeType(buffer: Buffer, originalFilename: string): string {
    const ext = path.extname(originalFilename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new SkylineError(
        "VALIDATION_ERROR",
        `Invalid file extension '${ext}'. Allowed: .jpg, .jpeg, .png, .pdf`,
        422
      );
    }

    if (buffer.length < 4) {
      throw new SkylineError("VALIDATION_ERROR", "Uploaded file is empty or corrupted", 422);
    }

    // Verify JPEG
    if (
      buffer[0] === MAGIC_SIGNATURES.jpeg[0] &&
      buffer[1] === MAGIC_SIGNATURES.jpeg[1] &&
      buffer[2] === MAGIC_SIGNATURES.jpeg[2]
    ) {
      if (ext !== ".jpg" && ext !== ".jpeg") {
        throw new SkylineError(
          "VALIDATION_ERROR",
          "File content does not match extension (detected JPEG)",
          422
        );
      }
      return "image/jpeg";
    }

    // Verify PNG
    if (
      buffer[0] === MAGIC_SIGNATURES.png[0] &&
      buffer[1] === MAGIC_SIGNATURES.png[1] &&
      buffer[2] === MAGIC_SIGNATURES.png[2] &&
      buffer[3] === MAGIC_SIGNATURES.png[3]
    ) {
      if (ext !== ".png") {
        throw new SkylineError(
          "VALIDATION_ERROR",
          "File content does not match extension (detected PNG)",
          422
        );
      }
      return "image/png";
    }

    // Verify PDF
    if (
      buffer[0] === MAGIC_SIGNATURES.pdf[0] &&
      buffer[1] === MAGIC_SIGNATURES.pdf[1] &&
      buffer[2] === MAGIC_SIGNATURES.pdf[2] &&
      buffer[3] === MAGIC_SIGNATURES.pdf[3]
    ) {
      if (ext !== ".pdf") {
        throw new SkylineError(
          "VALIDATION_ERROR",
          "File content does not match extension (detected PDF)",
          422
        );
      }
      return "application/pdf";
    }

    throw new SkylineError(
      "VALIDATION_ERROR",
      "Invalid file format: magic bytes do not match permitted image or PDF formats",
      422
    );
  }

  /**
   * Safely writes uploaded file to private storage outside web root with a UUID filename.
   */
  async saveReceipt(buffer: Buffer, originalFilename: string): Promise<StoredReceipt> {
    if (buffer.length > MAX_BYTES) {
      throw new SkylineError(
        "VALIDATION_ERROR",
        `File exceeds maximum permitted size of 5 MB (${buffer.length} bytes)`,
        422
      );
    }

    const mimeType = this.detectMimeType(buffer, originalFilename);
    const ext = path.extname(originalFilename).toLowerCase();
    const randomizedName = `${crypto.randomUUID()}${ext}`;

    await fs.mkdir(this.uploadDir, { recursive: true });

    const targetPath = this.resolveSafePath(randomizedName);
    await fs.writeFile(targetPath, buffer);

    return {
      storagePath: targetPath,
      mimeType,
      sizeBytes: buffer.length,
    };
  }

  /**
   * Resolves file path while strictly guarding against directory traversal attacks.
   */
  public resolveSafePath(filename: string): string {
    const resolved = path.resolve(this.uploadDir, filename);
    const normalizedUploadDir = path.resolve(this.uploadDir);

    if (
      !resolved.startsWith(normalizedUploadDir + path.sep) &&
      resolved !== normalizedUploadDir
    ) {
      throw new SkylineError("FORBIDDEN", "Path traversal attempt detected", 400);
    }

    return resolved;
  }

  /**
   * Reads receipt buffer from disk for streaming download.
   */
  async readReceipt(storagePath: string): Promise<{ buffer: Buffer; filename: string }> {
    const safePath = this.resolveSafePath(path.basename(storagePath));
    try {
      const buffer = await fs.readFile(safePath);
      return { buffer, filename: path.basename(safePath) };
    } catch {
      throw new SkylineError("NOT_FOUND", "Receipt file not found on disk", 404);
    }
  }
}

export const receiptService = new ReceiptService();
