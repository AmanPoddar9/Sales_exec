import { AnalysisResult } from '../types';

export const analyzeAudio = async (file: File): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();
    return result as AnalysisResult;
  } catch (error) {
    console.error("API Analysis Error:", error);
    throw error;
  }
};
