import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://scholarshield-backend.redstone-65874e35.eastus.azurecontainerapps.io';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const universityName = formData.get('university_name') as string || 'Custom University';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

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

