import { NextRequest, NextResponse } from 'next/server';
import { sanitizeString } from '@/lib/security';

// Get BACKEND_URL from environment variable
const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(request: NextRequest) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { detail: 'Backend URL not configured' },
      { status: 500 }
    );
  }
  try {
    const body = await request.json();

    // Validate request body
    if (!body.student_profile || !body.grant_requirements) {
      return NextResponse.json(
        { detail: 'Missing required fields: student_profile, grant_requirements' },
        { status: 400 }
      );
    }

    // Sanitize and validate input
    if (typeof body.grant_requirements !== 'string' || body.grant_requirements.length > 5000) {
      return NextResponse.json(
        { detail: 'Invalid grant requirements' },
        { status: 400 }
      );
    }

    // Sanitize grant requirements
    const sanitizedBody = {
      ...body,
      grant_requirements: sanitizeString(body.grant_requirements, 5000),
      policy_context: Array.isArray(body.policy_context) 
        ? body.policy_context.map((ctx: string) => sanitizeString(ctx, 500))
        : []
    };

    // Forward to backend
    const response = await fetch(`${BACKEND_URL}/api/write-grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitizedBody),
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
    console.error('Error in write-grant route:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

