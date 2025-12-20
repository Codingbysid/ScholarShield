import { NextRequest, NextResponse } from 'next/server';
import { sanitizeString, validateLanguageCode } from '@/lib/security';

// Require BACKEND_URL environment variable
const BACKEND_URL = process.env.BACKEND_URL;
if (!BACKEND_URL) {
  throw new Error('BACKEND_URL environment variable is required');
}

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

    // Validate and sanitize risk_summary
    if (typeof body.risk_summary !== 'string' || body.risk_summary.length > 1000) {
      return NextResponse.json(
        { detail: 'Invalid risk summary' },
        { status: 400 }
      );
    }

    // Validate language code
    const language = body.language || 'es';
    if (!validateLanguageCode(language)) {
      return NextResponse.json(
        { detail: 'Invalid language code' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedRiskSummary = sanitizeString(body.risk_summary, 1000);

    // Forward to backend
    const response = await fetch(`${BACKEND_URL}/api/explain-to-parent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        risk_summary: sanitizedRiskSummary,
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

