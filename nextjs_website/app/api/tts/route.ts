import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5073";

// Allow up to 5 minutes for first model load + generation
const TIMEOUT_MS = 5 * 60 * 1000;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const text = searchParams.get("text");
  const voice = searchParams.get("voice");
  const model = searchParams.get("model");

  if (!text) {
    return NextResponse.json({ detail: "Missing 'text' parameter" }, { status: 400 });
  }

  const params = new URLSearchParams();
  params.set("text", text);
  if (voice) params.set("voice", voice);
  if (model) params.set("model", model);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(`${BACKEND_URL}/tts?${params.toString()}`, {
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: "Backend error" }));
      return NextResponse.json(body, { status: res.status });
    }

    const blob = await res.blob();
    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": 'attachment; filename="output.wav"',
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { detail: "Request timed out. The model may still be loading." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { detail: "Cannot reach the TTS backend. Is it running?" },
      { status: 502 }
    );
  }
}
