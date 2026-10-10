import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { jobRunnerService } from "@/lib/services/JobRunnerService";
import { handleApiError, SkylineError } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
  const requestId = nanoid();
  try {
    const authHeader = request.headers.get("authorization");
    const secretHeader = request.headers.get("x-job-secret");
    const expectedSecret = process.env.JOB_RUNNER_SECRET;

    const providedSecret = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : secretHeader;

    if (!expectedSecret || providedSecret !== expectedSecret) {
      throw new SkylineError(
        "UNAUTHORIZED",
        "Invalid or missing background job runner authorization secret",
        401
      );
    }

    const report = await jobRunnerService.runAllJobs();
    return NextResponse.json({ data: report });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
