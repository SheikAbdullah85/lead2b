import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { transcript, audioBase64, mimeType = 'audio/webm', clientApiKey } = body;

    const apiKey =
      clientApiKey?.trim() ||
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'No Gemini API key available.',
        },
        { status: 400 }
      );
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
      apiKey
    )}`;

    const promptText = `
You are an expert exhibition sales qualification AI assistant.
Extract lead information and qualification signals from the following booth voice note or transcript.
Return ONLY valid JSON matching this schema:
{
  "full_name": "string or empty",
  "company_name": "string or empty",
  "job_title": "string or empty",
  "email": "string or empty",
  "phone": "string or empty",
  "rating": "hot" | "warm" | "cold",
  "budget_status": "allocated" | "planned" | "exploring" | "unknown",
  "timeline_status": "immediate" | "q1_q2" | "q3_q4" | "next_year" | "unknown",
  "notes": "concise summary of requirements and follow-up action"
}
`;

    let parts: any[] = [{ text: promptText }];

    if (transcript) {
      parts.push({ text: `Transcript:\n"${transcript}"` });
    } else if (audioBase64) {
      const cleanBase64 = audioBase64.replace(/^data:audio\/[a-zA-Z0-9]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Provide either transcript text or audioBase64.' },
        { status: 400 }
      );
    }

    const requestBody = {
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: errJson?.error?.message || `Gemini API error: ${response.status}` },
        { status: 400 }
      );
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    let parsed = {};
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const stripped = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(stripped);
    }

    return NextResponse.json({
      success: true,
      engine: 'gemini-1.5-flash',
      data: parsed,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error during voice analysis.' },
      { status: 500 }
    );
  }
}
