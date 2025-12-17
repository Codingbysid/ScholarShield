import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

const ALLOWED_LANGUAGES = ['es', 'hi', 'zh-Hans', 'ar', 'en'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    if (!body.risk_summary) {
      return NextResponse.json(
        { detail: 'Missing required field: risk_summary' },
        { status: 400 }
      );
    }

    // Validate language code
    const language = body.language || 'es';
    if (!ALLOWED_LANGUAGES.includes(language)) {
      return NextResponse.json(
        { detail: `Invalid language code. Allowed: ${ALLOWED_LANGUAGES.join(', ')}` },
        { status: 400 }
      );
    }

    // Forward to backend
    const response = await fetch(`${BACKEND_URL}/api/explain-to-parent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        risk_summary: body.risk_summary,
        language: language,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { detail: data.detail || 'Backend request failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in explain-to-parent route:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

