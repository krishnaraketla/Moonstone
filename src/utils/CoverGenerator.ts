import { callPplxApi } from './pplxApi';

interface CoverLetterGenerationParams {
  resumeContent: string;
  jobDescription: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  targetCompany?: string;
  additionalNotes?: string;
}

interface CoverLetterResponse {
  success: boolean;
  content: string;
  error?: string;
}

/**
 * Generates a cover letter based on the provided resume and job description
 */
export async function generateCoverLetter(params: CoverLetterGenerationParams): Promise<CoverLetterResponse> {
  try {
    const { 
      resumeContent, 
      jobDescription, 
      userName, 
      userEmail, 
      userPhone, 
      targetCompany,
      additionalNotes
    } = params;

    if (!resumeContent || !jobDescription) {
      return {
        success: false,
        content: '',
        error: 'Resume and job description are required to generate a cover letter.'
      };
    }

    const targetCompanyText = targetCompany ? `The company I'm applying to is ${targetCompany}.` : '';
    const userInfoText = userName ? `My name is ${userName}.` : '';
    const contactInfoText = (userEmail || userPhone) 
      ? `My contact information is ${userEmail || ''} ${userPhone || ''}.` 
      : '';
    const additionalNotesText = additionalNotes 
      ? `Additional customization notes: ${additionalNotes}` 
      : '';

    const systemPrompt = `You are a professional cover letter writer with expertise in creating personalized, compelling cover letters that highlight relevant skills and experiences.`;
    
    const userPrompt = `
Generate a professional, personalized cover letter based on the following resume and job description.
The cover letter should highlight the most relevant skills and experiences from my resume that align with the job requirements.
Structure the cover letter with a proper greeting, introduction, 2-3 paragraphs showcasing relevant experience, and a conclusion with call to action.
Make the tone professional but conversational. Avoid generic statements and clichés.

${userInfoText}
${contactInfoText}
${targetCompanyText}
${additionalNotesText}

RESUME:
${resumeContent}

JOB DESCRIPTION:
${jobDescription}

Format the cover letter in a professional business format with proper spacing.
`;

    const response = await callPplxApi({
      systemPrompt,
      userPrompt,
      maxTokens: 1500,
      temperature: 0.2
    });

    return {
      success: true,
      content: response
    };
  } catch (error) {
    console.error('Error generating cover letter:', error);
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 