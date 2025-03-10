import axios from 'axios';
// Environment variables in React are loaded automatically through the build process
// No need to use dotenv directly in browser code
/**
 * Interface for the PPLX API response
 */
interface PplxResponse {
  id: string;
  model: string;
  created: number;
  object: string;
  choices: {
    index: number;
    finish_reason: string;
    message: {
      content: string;
      role: string;
    };
    delta: {
      role: string;
      content: string;
    };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];
}

/**
 * Function to extract keywords from a job description using PPLX API
 * @param jobDescription - The job description text
 * @returns Promise containing array of keywords
 */
export const extractKeywordsWithPplx = async (jobDescription: string): Promise<string[]> => {
  // Ensure job description is provided
  if (!jobDescription || jobDescription.trim() === '') {
    console.log('No job description provided');
    return [];
  }

  // Clean up job description - remove any problematic characters
  const cleanJobDescription = jobDescription
    .replace(/[^\w\s,.;:'"!?()-]/g, '') // Remove special characters
    .trim();
    
  if (cleanJobDescription.length < 20) {
    console.log('Job description too short after cleaning:', cleanJobDescription);
    return [];
  }

  try {
    // PPLX API endpoint
    const apiUrl = 'https://api.perplexity.ai/chat/completions';
    
    // Get API key from environment variable
    const apiKey = process.env.REACT_APP_PPLX_API_KEY;
    
    if (!apiKey) {
      console.error('PPLX API key not found. Please add REACT_APP_PPLX_API_KEY to your environment variables.');
      return [];
    }

    console.log('Making API request to Perplexity AI...');
    console.log('Job description length:', cleanJobDescription.length);
    
    // Use a simplified prompt that's more direct
    const userPrompt = `Extract 5-10 professional keywords from this job description that would be valuable to include in a resume. Return ONLY a JSON array of strings like this: ["keyword1","keyword2"]. Job description: ${cleanJobDescription.slice(0, 1500)}`;
    
    // Prepare the API request
    const response = await axios.post<PplxResponse>(
      apiUrl,
      {
        model: 'sonar', // Valid model from the documentation
        messages: [
          {
            role: 'system',
            content: 'You extract keywords from job descriptions to help with resume writing. Always respond with only a JSON array of strings.'
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 300,
        temperature: 0.1 // Lower temperature for more consistent results
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Process the API response
    console.log('Received response from API');
    
    // The response format changed in newer API versions
    const result = response.data.choices[0]?.message?.content || '';
    console.log('Raw API response content:', result);
    
    // If the response is empty, return empty array
    if (!result || result.trim() === '') {
      console.error('Empty response from API');
      return [];
    }
    
    // Try different parsing approaches
    try {
      // First try: Direct JSON parse if the response is already a clean JSON array
      try {
        const directParse = JSON.parse(result);
        if (Array.isArray(directParse)) {
          console.log('Successfully parsed keywords using direct JSON parse');
          return directParse.filter(keyword => typeof keyword === 'string' && keyword.length > 0);
        }
      } catch (directParseError) {
        console.log('Direct JSON parse failed, trying regex extraction');
      }
      
      // Second try: Extract with regex
      const keywordsMatch = result.match(/\[([\s\S]*?)\]/);
      if (keywordsMatch && keywordsMatch[0]) {
        const arrayText = keywordsMatch[0];
        console.log('Extracted array text:', arrayText);
        
        // Parse the extracted array
        const keywords = JSON.parse(arrayText);
        if (Array.isArray(keywords)) {
          console.log('Successfully parsed keywords using regex extraction');
          return keywords.filter(keyword => typeof keyword === 'string' && keyword.length > 0);
        }
      }
      
      // Third try: Split by commas and clean up if JSON parsing fails
      if (result.includes(',')) {
        console.log('Trying comma splitting as fallback');
        const keywordCandidates = result
          .replace(/[\[\]"']/g, '')
          .split(',')
          .map(k => k.trim())
          .filter(k => k && k.length > 0);
          
        if (keywordCandidates.length > 0) {
          console.log('Successfully extracted keywords using comma splitting');
          return keywordCandidates;
        }
      }
      
      // Last resort: Look for words or phrases in quotes
      const quotedPhrases = result.match(/"([^"]*)"|'([^']*)'/g);
      if (quotedPhrases && quotedPhrases.length > 0) {
        console.log('Extracted quoted phrases as fallback');
        return quotedPhrases
          .map(phrase => phrase.replace(/["']/g, '').trim())
          .filter(phrase => phrase.length > 0);
      }
      
      // If all else fails, extract any words that look like they could be skills
      const possibleSkills = result.split(/\s+/)
        .filter(word => 
          word.length > 3 && 
          !['the', 'and', 'that', 'with', 'for', 'from'].includes(word.toLowerCase())
        );
        
      if (possibleSkills.length > 0) {
        console.log('Extracted possible skills as last resort');
        return possibleSkills.slice(0, 10); // Limit to 10 skills
      }
      
      console.error('Failed to extract keywords from response:', result);
      return [];
    } catch (parseError) {
      console.error('Error parsing keyword JSON:', parseError);
      console.error('Raw response was:', result);
      return [];
    }
  } catch (error) {
    console.error('Error extracting keywords with PPLX API:', error);
    // Log more details about the error
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
    }
    return [];
  }
};

/**
 * Function to fix formatting issues in a resume using PPLX API
 * @param resumeContent - The resume content to format
 * @returns Promise containing properly formatted resume content
 */
export const fixResumeFormatting = async (resumeContent: string): Promise<string> => {
  console.log('[pplxApi] fixResumeFormatting called');
  console.log('[pplxApi] Input content length:', resumeContent.length);
  
  // Ensure resume content is provided
  if (!resumeContent || resumeContent.trim() === '') {
    console.log('[pplxApi] No resume content provided');
    return '';
  }

  // Remove any existing formatting marker before processing
  const cleanContent = resumeContent.endsWith('___FORMATTED___') 
    ? resumeContent.replace('___FORMATTED___', '') 
    : resumeContent;
    
  console.log('[pplxApi] Content has formatting marker:', resumeContent.endsWith('___FORMATTED___'));
  console.log('[pplxApi] Will process clean content length:', cleanContent.length);

  try {
    // PPLX API endpoint
    const apiUrl = 'https://api.perplexity.ai/chat/completions';
    
    // Get API key from environment variable
    const apiKey = process.env.REACT_APP_PPLX_API_KEY;
    
    if (!apiKey) {
      console.error('PPLX API key not found. Please add REACT_APP_PPLX_API_KEY to your environment variables.');
      return cleanContent + '___FORMATTED___'; // Return original content with marker if no API key
    }

    console.log('Making API request to Perplexity AI for resume formatting...');
    console.log('Resume content length:', cleanContent.length);
    
    // Check if content is HTML or plain text
    const isHtml = cleanContent.includes('<') && cleanContent.includes('>');
    
    // If resume is too long, we should truncate it to prevent API issues
    // Typical token limits are around 4096, but we'll be conservative
    const MAX_CONTENT_LENGTH = 6000;
    const truncatedContent = cleanContent.length > MAX_CONTENT_LENGTH
      ? cleanContent.substring(0, MAX_CONTENT_LENGTH) + (isHtml ? ' ...' : '...')
      : cleanContent;
    
    if (cleanContent.length > MAX_CONTENT_LENGTH) {
      console.log(`Resume content truncated from ${cleanContent.length} to ${MAX_CONTENT_LENGTH} characters for API request`);
    }
    
    // Create a prompt based on the content type
    let userPrompt = '';
    
    if (isHtml) {
      userPrompt = `Format this HTML resume. Fix spacing and alignment only. Preserve all content. 

IMPORTANT: Return ONLY the formatted HTML resume. DO NOT include explanations, markdown code blocks, or "Changes Made" sections.

${truncatedContent}`;
    } else {
      userPrompt = `Convert this plain text resume to markdown format with the following structure EXACTLY:

1. FIRST STEP: Identify and extract all main section headers from the resume (like EDUCATION, WORK EXPERIENCE, TECHNICAL SKILLS, PROJECTS) and each sub header under each section.

2. SECOND STEP: Format the resume following these rules:
   - Name as a level 1 heading (# NAME)
   - Contact details on a single line below the name
   - Main section headers as level 2 headings (## SECTION)
   - Company names and project names as level 3 headings (### Name)
   - Job titles in bold (**Title**)
   - Locations and dates in italics (*Location* / *Dates*)
   - MOST IMPORTANTLY: Every single bullet point MUST be converted from the bullet character (•) to a hyphen (-)
   - Every bullet point line MUST start with a hyphen (-) followed by a space
   - For multiple positions at same company, format EACH position with its own level 3 heading
   - Include blank lines between different positions/roles for readability

EXAMPLE OF EXPECTED FORMAT:
# JOHN DOE
email@example.com | (123) 456-7890 | linkedin.com/in/johndoe

## EDUCATION
### University Name
*Location*  
Degree, Major  
*Dates*
- Related coursework point 1
- Related coursework point 2

## PROFESSIONAL EXPERIENCE
### Company Name
*City, State*  
**Job Title**  
*Start Date - End Date*
- Bullet point describing accomplishment
- Another bullet point

### Another Company Name
*City, State*  
**Job Title**  
*Start Date - End Date*
- Bullet point describing accomplishment
- Another bullet point

## PROJECTS
### Project Name
*Start Date - End Date*
- Bullet point describing accomplishment
- Another bullet point

## SKILLS
Skill 1, Skill 2, Skill 3

DO NOT include markdown fences around your response. Return the raw markdown directly.

Here's the resume to format (preserve ALL content):

${truncatedContent}`;
    }
    
    // Prepare the API request
    console.log('Sending API request...');
    const response = await axios.post<PplxResponse>(
      apiUrl,
      {
        model: 'sonar', // Valid model from the documentation
        messages: [
          {
            role: 'system',
            content: 'You are a resume formatter specializing in clean, professional markdown formatting. Format resumes with the following structure EXACTLY:\n\n1. First, identify all main section headers (EDUCATION, WORK EXPERIENCE, TECHNICAL SKILLS, PROJECTS, etc.)\n2. Format the name as a level 1 heading (# NAME)\n3. Format contact info on one line below the name\n4. Format main section headers as level 2 headings (## SECTION)\n5. Format company names and project names as level 3 headings (### Name)\n6. Put locations and dates in italics (*Location*)\n7. ALWAYS CONVERT ALL BULLET CHARACTERS (•) TO HYPHENS (-). Every single bullet point MUST start with a hyphen character followed by a space.\n8. Each position/project should be separated with blank lines for readability.\n\nReturn ONLY the formatted markdown resume content with NO code fences or explanations. Here is an example of the expected format:\n\n# JOHN DOE\nemail@example.com | (123) 456-7890 | linkedin.com/in/johndoe\n\n## EDUCATION\n### University Name\n*Location*  \nDegree, Major  \nGPA: X.XX\n\n## PROFESSIONAL EXPERIENCE\n### Company Name\n*City, State*  \n**Job Title**  \n*Start Date - End Date*\n- Bullet point describing accomplishment\n- Another bullet point\n\n## PROJECTS\n### Project Name\n*Start Date - End Date*\n- Bullet point describing accomplishment\n- Another bullet point\n\n## SKILLS\nSkill 1, Skill 2, Skill 3'
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 6000, // Increase token limit to ensure complete response
        temperature: 0.1 // Lower temperature for more consistent results
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30-second timeout for the request
      }
    );

    // Process the API response
    console.log('Received formatting response from API');
    
    // Get the formatted content from the response
    let formattedContent = response.data.choices[0]?.message?.content || '';
    console.log('Formatted content length:', formattedContent.length);
    
    // Manual post-processing to ensure bullet points are properly converted
    formattedContent = formattedContent
      // Convert all bullet characters to hyphens
      .replace(/•\s*/g, '- ')
      // Fix any other bullet-like characters
      .replace(/[●○◆◇▪▫■□]\s*/g, '- ')
      // Fix double bullets that might appear as "• •" or "- •"
      .replace(/[-•]\s*[-•]\s*/g, '- ')
      // Ensure each bullet point starts at the beginning of a line with a hyphen
      .replace(/^(\s*)[•●○◆◇▪▫■□]\s*/gm, '$1- ');
      
    // Additional processing for the PROJECTS section
    if (formattedContent.includes('## PROJECTS') || formattedContent.includes('# PROJECTS')) {
      // Find the PROJECTS section and make sure all bullet points are properly formatted
      const projectsSectionRegex = /(## PROJECTS|# PROJECTS)[\s\S]*?(?=##|$)/;
      const projectsSection = formattedContent.match(projectsSectionRegex)?.[0] || '';
      
      if (projectsSection) {
        // Format projects section with proper bullet points
        const formattedProjectsSection = projectsSection
          // Fix project item bullet points
          .replace(/\n\s*•\s*/g, '\n- ')
          // Ensure proper starting of bullet points after project titles/dates
          .replace(/(\*[^*]+\*)\s*([^-\n])/g, '$1\n- $2')
          // Convert bold project names to level 3 headers if not already
          .replace(/\n\s*\*\*([\w\s\-&:,.()]+)\*\*/g, '\n### $1');
          
        // Replace the original projects section with the formatted one
        formattedContent = formattedContent.replace(projectsSectionRegex, formattedProjectsSection);
      }
    }
    
    // Process WORK EXPERIENCE section to ensure company names are level 3 headers
    if (formattedContent.includes('## WORK EXPERIENCE') || formattedContent.includes('## PROFESSIONAL EXPERIENCE')) {
      // Find the EXPERIENCE section
      const experienceSectionRegex = /(## WORK EXPERIENCE|## PROFESSIONAL EXPERIENCE)[\s\S]*?(?=##|$)/;
      const experienceSection = formattedContent.match(experienceSectionRegex)?.[0] || '';
      
      if (experienceSection) {
        // Format experience section with proper headings
        const formattedExperienceSection = experienceSection
          // Fix bullet points
          .replace(/\n\s*•\s*/g, '\n- ')
          // Convert bold company names to level 3 headers if not already
          .replace(/\n\s*\*\*([\w\s\-&:,.()]+)\*\*/g, '\n### $1');
          
        // Replace the original experience section with the formatted one
        formattedContent = formattedContent.replace(experienceSectionRegex, formattedExperienceSection);
      }
    }
    
    // Process EDUCATION section to ensure institution names are level 3 headers
    if (formattedContent.includes('## EDUCATION')) {
      // Find the EDUCATION section
      const educationSectionRegex = /(## EDUCATION)[\s\S]*?(?=##|$)/;
      const educationSection = formattedContent.match(educationSectionRegex)?.[0] || '';
      
      if (educationSection) {
        // Format education section with proper headings
        const formattedEducationSection = educationSection
          // Fix bullet points
          .replace(/\n\s*•\s*/g, '\n- ')
          // Convert bold institution names to level 3 headers if not already
          .replace(/\n\s*\*\*([\w\s\-&:,.()]+)\*\*/g, '\n### $1');
          
        // Replace the original education section with the formatted one
        formattedContent = formattedContent.replace(educationSectionRegex, formattedEducationSection);
      }
    }
    
    // More thorough cleanup to remove code blocks and explanations
    formattedContent = formattedContent
      .replace(/```html/g, '')
      .replace(/```markdown/g, '')
      .replace(/```/g, '')
      .trim();
      
    // Remove any explanatory sections using indexOf
    const explanationMarkers = [
      "### Changes Made:",
      "Changes Made:",
      "Here's the formatted",
      "I've formatted",
      "Here is the formatted"
    ];
    
    for (const marker of explanationMarkers) {
      const index = formattedContent.indexOf(marker);
      if (index > 0) {
        formattedContent = formattedContent.substring(0, index).trim();
      }
    }
    
    // Check if the content appears to be markdown 
    const hasMarkdownHeaders = /^#+ /m.test(formattedContent);
    const hasMarkdownBold = /\*\*[^*]+\*\*/m.test(formattedContent);
    
    // Log whether we detected markdown
    if (hasMarkdownHeaders || hasMarkdownBold) {
      console.log('Detected markdown formatting in API response');
    }
    
    // If the response is empty, return the original content
    if (!formattedContent || formattedContent.trim() === '') {
      console.error('Empty response from API');
      return cleanContent + '___FORMATTED___';
    }
    
    // If the content was truncated but the API returned something
    // We should return the formatted part and keep the original remainder
    let finalContent;
    if (cleanContent.length > MAX_CONTENT_LENGTH && formattedContent.length > 0) {
      console.log('Merging formatted content with original remainder');
      finalContent = formattedContent + cleanContent.substring(MAX_CONTENT_LENGTH);
    } else {
      finalContent = formattedContent;
    }
    
    // Perform one final cleanup to make sure all bullet points are correctly formatted
    finalContent = finalContent
      .replace(/•\s*/g, '- ')
      .replace(/[●○◆◇▪▫■□]\s*/g, '- ')
      .replace(/\n+\s*•\s*/g, '\n- ');
    
    // Add marker to indicate this content has been processed
    return finalContent + '___FORMATTED___';
  } catch (error) {
    console.error('Error fixing resume formatting with PPLX API:', error);
    // Log more details about the error
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
    }
    // Return original content with marker if there's an error to prevent reprocessing
    return cleanContent + '___FORMATTED___';
  }
}; 