import { NextRequest, NextResponse } from "next/server";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "TX3LPaxmHKxFdv7VOQHJ"; // Liam — energetic, confident (free-tier premade)

export async function POST(req: NextRequest) {
  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY not configured" },
      { status: 501 }
    );
  }

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = body.text;
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing text field" }, { status: 400 });
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(VOICE_ID)}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: text.slice(0, 1000),
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.35,
          similarity_boost: 0.85,
        },
      }),
    }
  );

  if (!response.ok) {
    const msg = await response.text().catch(() => "unknown error");
    return NextResponse.json(
      { error: `ElevenLabs: ${msg}` },
      { status: response.status }
    );
  }

  const audioBuffer = await response.arrayBuffer();
  return new NextResponse(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
