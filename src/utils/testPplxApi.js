// Test utility for directly testing the PPLX API
require('dotenv').config(); // Load environment variables from .env file
const axios = require('axios');

// Sample job description for testing (Snowflake ML Platform job)
const sampleJobDescription = `
Build the future of the AI Data Cloud. Join the Snowflake team.

The Snowflake Machine Learning Platform team's mission is to enable customers to bring their ML/AI workload to Snowflake. Our customers want to leverage ML/AI to extract business values from ever increasing data in Snowflake but face several challenges including infrastructure management, scaling, orchestration, performance and security. The team aims to solve these challenges by building highly integrated platform solutions that are simple, secure and scalable to enable end to end ML workflows. We are on an early journey to build the best machine learning and data platform for Snowflake customers without sacrificing the benefits of a single platform and governance.

We are looking for a driven engineer who will play a pivotal role in this journey by understanding Snowflake's core platform architecture and evolving it to enable state of the art ML/AI workloads. Join us to design and execute, engage and deliver innovation and unlock the power of AI for thousands of enterprise customers. 

YOU WILL:

Design easy-to-use & intuitive APIs & systems for ML experts and non-experts to accelerate the E2E ML development and production lifecycle

Design and optimize systems to scale up and out ML data and training

Collaboratively build and execute a vision for incorporating new advances in machine learning in ways that best achieve the customers' business objectives.

Be a strong contributor to the product vision and team planning.

Build operational and release rigor with every feature/bug fix deployments.

QUALIFICATIONS:

Have 2+ years of industry experience designing, building, and supporting machine learning platforms, machine learning services & frameworks or data intensive systems.

Working experience with several of the following frameworks: SKLearn, XGBoost, PyTorch, Tensorflow.

Fluent in Python. C++, Java, Go experience is a plus.

Familiarity with Kubernetes (K8s) for container orchestration and scaling, plus experience setting up and maintaining CI/CD pipelines (e.g., Jenkins, GitLab, GitHub Actions), is a plus.

A growth mindset and excitement about breaking the status quo by seeking innovative solutions.

BS in Computer Science or related degree; Masters or PhD Preferred.

Every Snowflake employee is expected to follow the company's confidentiality and security standards for handling sensitive data. Snowflake employees must abide by the company's data security plan as an essential part of their duties. It is every employee's duty to keep customer information secure and confidential.

Snowflake is growing fast, and we're scaling our team to help enable and accelerate our growth. We are looking for people who share our values, challenge ordinary thinking, and push the pace of innovation while building a future for themselves and Snowflake.

How do you want to make your impact?

The following represents the expected range of compensation for this role:

The estimated base salary range for this role is $157,000 - $230,000.
Additionally, this role is eligible to participate in Snowflake's bonus and equity plan.
The successful candidate's starting salary will be determined based on permissible, non-discriminatory factors such as skills, experience, and geographic location. This role is also eligible for a competitive benefits package that includes: medical, dental, vision, life, and disability insurance; 401(k) retirement plan; flexible spending & health savings account; at least 12 paid holidays; paid time off; parental leave; employee assistance program; and other company benefits.

Snowflake is growing fast, and we're scaling our team to help enable and accelerate our growth. We are looking for people who share our values, challenge ordinary thinking, and push the pace of innovation while building a future for themselves and Snowflake.

How do you want to make your impact?
`;

/**
 * Extract keywords from job description
 * @param {string} jobDescription - The job description text
 * @returns {Promise<string[]>} Promise containing array of keywords
 */
async function extractKeywords(jobDescription) {
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
    console.log('Job description length:', cleanJobDescription.length);
    
    // Get API key from environment variables
    const apiKey = process.env.REACT_APP_PPLX_API_KEY;
    
    if (!apiKey) {
      console.error('PPLX API key not found in environment variables. Please check your .env file.');
      return [];
    }
    
    // PPLX API endpoint
    const apiUrl = 'https://api.perplexity.ai/chat/completions';
    
    // More detailed and specific prompts to extract a comprehensive list of skills
    const systemPrompt = 'You are a highly detailed technical skills extractor that identifies ALL technical skills, tools, frameworks, programming languages, methodologies, and domain-specific keywords from job descriptions. Be EXTREMELY thorough and detailed. You MUST extract EVERY single technical skill, tool, and keyword mentioned, no matter how common or obvious they might seem. You should identify at least 15-30 keywords for technical job descriptions. NEVER modify or simplify programming language names - keep "C++" as "C++", not "C". Extract the EXACT terms as they appear - never modify capitalization or expand abbreviations. Always return ONLY a JSON array of strings with no explanations.';
    
    const userPrompt = `Extract ALL keywords, skills, technologies, programming languages, tools, methodologies, and technical terms from this job description that would be valuable to include in a resume.

BE EXTREMELY THOROUGH and identify EVERY SINGLE technical skill, knowledge area, and job-specific term mentioned. For this specific job, be sure to extract:
1. ALL programming languages (Python, C++, Java, etc.) with EXACT names - do NOT simplify "C++" to "C"
2. ALL frameworks/libraries mentioned (even briefly)
3. ALL tools and platforms
4. ALL methodologies and processes
5. ALL domain-specific terms
6. ALL abbreviations like "K8s", "CI/CD", "ML/AI", "E2E" etc. exactly as written
7. ALL soft skills that are specifically emphasized

IMPORTANT: Preserve EXACT technical terminology - NEVER change "C++" to "C", "Node.js" to "Node", etc. The name must match EXACTLY as written in the job description.

This is for a technical resume, so be MUCH MORE detailed than you might normally be. I need a COMPREHENSIVE list of ALL POSSIBLE matching terms from the job description.

Return ONLY a JSON array of strings with EXACT matches, with NO additional text. For proper names and technologies, maintain exact capitalization.

Job description: ${cleanJobDescription}`;
    
    // Prepare the API request with a more thorough configuration
    const response = await axios.post(
      apiUrl,
      {
        model: 'sonar', // Using sonar model
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 800, // Increased token limit to allow for more keywords
        temperature: 0.05 // Lower temperature for more deterministic output
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 40000 // Increased timeout
      }
    );
    
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
          return validateAndEnrichKeywords(directParse, result);
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
          return validateAndEnrichKeywords(keywords, result);
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
          return validateAndEnrichKeywords(keywordCandidates, result);
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
    return [];
  }
}

/**
 * Validate and enrich the keywords by checking for common programming languages
 * @param {string[]} keywords - The extracted keywords
 * @param {string} rawResponse - The raw API response text
 * @returns {string[]} Validated and enriched keywords
 */
function validateAndEnrichKeywords(keywords, rawResponse) {
  if (!keywords || !Array.isArray(keywords)) {
    return [];
  }
  
  // Convert all keywords to strings and filter out empty ones
  const validKeywords = keywords
    .filter(keyword => typeof keyword === 'string' || typeof keyword === 'number')
    .map(keyword => String(keyword).trim())
    .filter(keyword => keyword.length > 0);
  
  // Check if there are any important programming languages or skills missing
  const importantTerms = [
    { term: "C\\+\\+", sanitized: "C++" },
    { term: "C#", sanitized: "C#" },
    { term: "Node\\.js", sanitized: "Node.js" },
    { term: "TypeScript", sanitized: "TypeScript" },
    { term: "ML\\/AI", sanitized: "ML/AI" },
    { term: "CI\\/CD", sanitized: "CI/CD" }
  ];
  
  // Create a set for faster lookups
  const keywordSet = new Set(validKeywords.map(k => k.toLowerCase()));
  
  // Check for each important term
  const missingTerms = [];
  
  importantTerms.forEach(({ term, sanitized }) => {
    // Skip if we already have this term (case insensitive)
    if (keywordSet.has(sanitized.toLowerCase())) {
      return;
    }
    
    // Check if it appears in the raw response
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(rawResponse) || regex.test(sampleJobDescription)) {
      missingTerms.push(sanitized);
      console.log(`Found missing important term: ${sanitized}`);
    }
  });
  
  // If we're still missing C++, try a direct check on the job description
  if (missingTerms.length === 0 && !keywordSet.has('c++') && sampleJobDescription.includes('C++')) {
    missingTerms.push('C++');
    console.log('Found missing C++ by direct text search');
  }
  
  // Add any missing important terms
  const enrichedKeywords = [...validKeywords, ...missingTerms];
  
  // Remove duplicates (case insensitive)
  const seen = new Set();
  const uniqueKeywords = enrichedKeywords.filter(keyword => {
    const lowerKey = keyword.toLowerCase();
    if (seen.has(lowerKey)) {
      return false;
    }
    seen.add(lowerKey);
    return true;
  });
  
  // Log if we added any missing terms
  if (missingTerms.length > 0) {
    console.log(`Added ${missingTerms.length} missing important terms to the keywords list`);
  }
  
  return uniqueKeywords;
}

/**
 * Test function to directly call the PPLX API
 */
async function testPplxApi() {
  try {
    console.log('Starting PPLX API test...');
    console.log('--------------------------------------');
    
    // Get API key from environment variables
    const apiKey = process.env.REACT_APP_PPLX_API_KEY;
    
    if (!apiKey) {
      console.error('PPLX API key not found in environment variables. Please check your .env file.');
      return;
    }
    
    console.log('API Key found. Starting keyword extraction...');
    console.log('--------------------------------------');
    
    // Extract keywords from the sample job description
    const keywords = await extractKeywords(sampleJobDescription);
    
    // Display results in a more organized way
    console.log('\n======= EXTRACTED KEYWORDS =======');
    if (keywords.length === 0) {
      console.log('No keywords extracted!');
    } else {
      // Display with numbering for better readability
      keywords.forEach((keyword, index) => {
        console.log(`${index + 1}. ${keyword}`);
      });
      
      // Group by category if we have enough keywords
      if (keywords.length >= 10) {
        console.log('\n======= POTENTIAL CATEGORIES =======');
        
        // Simple categorization based on common patterns
        const programmingLanguages = keywords.filter(k => 
          /\b(Python|Java|C\+\+|Go|JavaScript|TypeScript|Ruby|PHP|Swift|Kotlin|SQL|C#|Scala|R|Rust|Julia)\b/i.test(k));
        
        const frameworks = keywords.filter(k => 
          /\b(SKLearn|XGBoost|PyTorch|Tensorflow|React|Angular|Vue|Django|Flask|Spring|Bootstrap|Spark|Hadoop|Kafka|Airflow)\b/i.test(k));
          
        const tools = keywords.filter(k => 
          /\b(Kubernetes|K8s|Docker|Git|GitHub|GitLab|Jenkins|CI\/CD|AWS|Azure|GCP|Jira|Databricks|MLflow|Kubeflow)\b/i.test(k));
          
        const concepts = keywords.filter(k => 
          /\b(ML\/AI|Machine Learning|AI|Data|Cloud|Security|Scalable|Platform|Infrastructure|Orchestration|Pipeline|ETL|API)\b/i.test(k));
          
        if (programmingLanguages.length > 0) {
          console.log('\nProgramming Languages:');
          programmingLanguages.forEach(lang => console.log(`- ${lang}`));
        }
        
        if (frameworks.length > 0) {
          console.log('\nFrameworks & Libraries:');
          frameworks.forEach(framework => console.log(`- ${framework}`));
        }
        
        if (tools.length > 0) {
          console.log('\nTools & Platforms:');
          tools.forEach(tool => console.log(`- ${tool}`));
        }
        
        if (concepts.length > 0) {
          console.log('\nConcepts & Domains:');
          concepts.forEach(concept => console.log(`- ${concept}`));
        }
      }
    }
    
    console.log('\n======= SUMMARY =======');
    console.log(`Total keywords found: ${keywords.length}`);
    console.log('--------------------------------------');
    
    return keywords;
  } catch (error) {
    console.error('Error in PPLX API test:', error);
  }
}

// Execute the test function if this file is run directly
if (require.main === module) {
  testPplxApi()
    .then(() => console.log('Test completed'))
    .catch(error => console.error('Test failed:', error));
}

module.exports = { testPplxApi, extractKeywords }; 