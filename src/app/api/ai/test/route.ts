import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const clientKey = body.apiKey?.trim();
    const serverKey = process.env.GEMINI_API_KEY?.trim() || process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim();
    const keyToTest = clientKey || serverKey;

    if (!keyToTest) {
      return NextResponse.json(
        {
          success: false,
          error: 'No Gemini API key provided. Please supply an API key to test.',
        },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    // Test with Gemini 1.5 Flash
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
      keyToTest
    )}`;

    const testPayload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Respond with the word "ACTIVE" only.' }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 10,
        temperature: 0,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const errorMsg =
        errorJson?.error?.message ||
        `Google API returned status ${response.status} (${response.statusText})`;
      return NextResponse.json(
        {
          success: false,
          status: response.status,
          error: errorMsg,
        },
        { status: 400 }
      );
    }

    const data = await response.json().catch(() => ({}));
    const replyText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'ACTIVE';

    return NextResponse.json({
      success: true,
      model: 'gemini-1.5-flash',
      latencyMs,
      verified: true,
      reply: replyText,
      message: `Gemini API key is verified and operational (${latencyMs}ms response time).`,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Unexpected error while testing API key.',
      },
      { status: 500 }
    );
  }
}
