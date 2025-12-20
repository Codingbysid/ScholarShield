import { NextRequest, NextResponse } from 'next/server';
import { validateIndexName } from '@/lib/security';

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
    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { detail: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { detail: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file name
    if (!file.name || file.name.length > 255) {
      return NextResponse.json(
        { detail: 'Invalid file name' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { detail: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate university_index if provided
    const universityIndex = request.nextUrl.searchParams.get('university_index');
    if (universityIndex && !validateIndexName(universityIndex)) {
      return NextResponse.json(
        { detail: 'Invalid university index name' },
        { status: 400 }
      );
    }

    // Forward to backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const backendUrl = universityIndex 
      ? `${BACKEND_URL}/api/assess-financial-health?university_index=${encodeURIComponent(universityIndex)}`
      : `${BACKEND_URL}/api/assess-financial-health`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      body: backendFormData,
      headers: {
        // Don't set Content-Type, let browser set it with boundary
      },
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
    console.error('Error in assess-financial-health route:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

