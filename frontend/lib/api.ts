/**
 * API client configuration
 * All API calls go through Next.js API routes to keep backend URL secret
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

export const apiClient = {
  /**
   * Assess financial health by uploading a bill
   */
  async assessFinancialHealth(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/assess-financial-health`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Failed to assess financial health');
    }

    return response.json();
  },

  /**
   * Write grant essay
   */
  async writeGrant(data: {
    student_profile: Record<string, any>;
    grant_requirements: string;
    policy_context?: string[];
  }): Promise<{ success: boolean; essay: string }> {
    const response = await fetch(`${API_BASE}/write-grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Failed to generate grant essay');
    }

    return response.json();
  },

  /**
   * Explain to parent in native language
   */
  async explainToParent(data: {
    risk_summary: string;
    language: string;
  }): Promise<{ success: boolean; translated_text: string; audio_base64: string }> {
    const response = await fetch(`${API_BASE}/explain-to-parent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Failed to generate explanation');
    }

    return response.json();
  },

  /**
   * Upload custom university handbook
   */
  async uploadHandbook(
    file: File,
    universityName: string = "Custom University"
  ): Promise<{ success: boolean; index_name: string; university_name: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('university_name', universityName);

    const response = await fetch(`${API_BASE}/upload-handbook`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Failed to upload handbook');
    }

    return response.json();
  },
};

