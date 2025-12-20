import { NextRequest, NextResponse } from 'next/server';
import { sanitizeString, validateFileName } from '@/lib/security';

// Require BACKEND_URL environment variable
const BACKEND_URL = process.env.BACKEND_URL;
if (!BACKEND_URL) {
  throw new Error('BACKEND_URL environment variable is required');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    let universityName = formData.get('university_name') as string || 'Custom University';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file name
    if (!validateFileName(file.name)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file name' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!['application/pdf', 'text/plain'].includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Only PDF or text files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 20MB for handbooks)
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 20MB limit' },
        { status: 400 }
      );
    }

    // Sanitize university name
    universityName = sanitizeString(universityName, 100);

    // Forward to backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('university_name', universityName);

    const response = await fetch(`${BACKEND_URL}/api/upload-handbook`, {
      method: 'POST',
      body: backendFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || 'Failed to upload handbook' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error uploading handbook:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload handbook' },
      { status: 500 }
    );
  }
}

