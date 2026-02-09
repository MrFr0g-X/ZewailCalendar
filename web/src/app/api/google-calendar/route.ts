import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { google } from "googleapis";
import { z } from "zod";
import { authOptions } from "@/lib/auth";

const eventSchema = z.object({
  events: z
    .array(
      z.object({
        summary: z.string().min(1),
        location: z.string(),
        description: z.string(),
        start: z.object({ dateTime: z.string(), timeZone: z.string() }),
        end: z.object({ dateTime: z.string(), timeZone: z.string() }),
        recurrence: z.array(z.string()),
      })
    )
    .min(1, "At least one event is required"),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    // Distinguish between "not signed in" and "token refresh failed"
    if (session?.error === "RefreshAccessTokenError") {
      return NextResponse.json(
        { error: "Your Google session has expired. Please sign in again.", code: "TOKEN_EXPIRED" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Not authenticated. Please sign in with Google first.", code: "NOT_AUTHENTICATED" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON", code: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: session.accessToken });
  const calendar = google.calendar({ version: "v3", auth });

  const results: Array<{ success: boolean; summary: string; eventId?: string; error?: string }> = [];

  for (const event of parsed.data.events) {
    try {
      const res = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
      });
      results.push({ success: true, summary: event.summary, eventId: res.data.id ?? undefined });
    } catch (error: unknown) {
      let message = "Unknown error";
      if (error && typeof error === "object" && "response" in error) {
        const gError = error as { response?: { data?: { error?: { message?: string; code?: number } } } };
        message = gError.response?.data?.error?.message ?? message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      results.push({ success: false, summary: event.summary, error: message });
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  const status = failed > 0 && succeeded === 0 ? 502 : 200;

  return NextResponse.json(
    {
      message: `Created ${succeeded} event(s)${failed > 0 ? `, ${failed} failed` : ""}`,
      results,
    },
    { status }
  );
}
