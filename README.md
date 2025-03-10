# Resume Tuner

A desktop application for fine-tuning your resume based on job descriptions. Built with Electron, React, and Material UI.

## Features

- Paste job descriptions to tailor your resume
- Upload PDF or DOCX resume files
- Edit your resume in a rich text editor
- Request AI-assisted edits through a side panel
- Accept or reject suggested changes
- Smart keyword extraction using Perplexity AI API

## Development

### Prerequisites

- Node.js (v14 or later)
- npm
- Perplexity AI API key (for enhanced keyword extraction)

### Installation

1. Clone the repository
2. Install dependencies
```
npm install
```
3. Set up environment variables
   - Copy `.env.example` to `.env`
   - Add your Perplexity AI API key to the `.env` file
   ```
   REACT_APP_PPLX_API_KEY=your_pplx_api_key_here
   ```

### Running the app

In development mode:
```
npm run dev
```

### Building the app

To build the application for distribution:
```
npm run build
```

## Usage

1. Paste a job description in the text area
2. Upload your resume (PDF or DOCX format)
3. The resume will be parsed and displayed in the rich text editor
4. Use the side panel to enter prompts for suggested edits
5. Accept or reject the suggested changes
6. Toggle between basic and AI-powered keyword extraction using the toggle switch in the keyword visualizer

## API Integration

Resume Tuner uses the Perplexity AI API for enhanced keyword extraction:

- The app extracts keywords from job descriptions using Perplexity's LLM models
- If the API is unavailable or the toggle is turned off, it falls back to basic keyword extraction
- Get your API key from [Perplexity AI Settings](https://www.perplexity.ai/settings/api)

## License

ISC 

# Resume Formatting Example

## Original Plain Text

```
 RAKETLA KRISHNA

 +1 617 820 0415 | krishrak@outlook.com | linkedin.com/in/krishna-raketla/



 EDUCATION



 Northeastern University

 January 2023 - May 2025

 Master's, Computer Science

 GPA: 3.5



 Vellore Institute of Technology

 July 2016 - August 2019

 Bachelor's, Computer Science

 GPA: 7.23



 PROFESSIONAL EXPERIENCE



 HP Inc

 Bengaluru, Karnataka, India

 Senior Software Engineer

 January 2021 - November 2022

 • Spearheaded the Fax UI workflow, specifically developing and validating specs by coordinating with cross-functional teams for design reviews, resulting in early delivery with 20% increased efficiency and highest quality

 • Employed agile methodologies, emphasizing continuous unit testing to validate robustness and reliability

 • Mentored two interns to resolve critical memory leak issues identified through address sanitizer.



 Hewlett Packard (HP)

 Bengaluru, Karnataka, India

 Software Engineer

 August 2019 - December 2020

 • Programmed APIs to serialize and deserialize the fax communication data and modified it from XML to Google FlatBuffers for reducing source code memory size by 95% and data decoding time by 45%

 • Integrated a common data collection interface at the network and job layers of the T30 protocol stack and generated fax reports, thereby decreasing code duplicity and expediting the fax issues' triage by 35%

 • Implemented the CDM adapters for Receive Fax job ticket to enable seamless communication between the resource and application layers.



 Hewlett Packard (HP)

 Bengaluru, Karnataka, India

 Research and Development Intern

 January 2019 - July 2019

 • Developed a testing automation system for printer firmware to identify the failure commit and minimize physical intervention, ultimately reducing the effort to triage from 3 person-days to 10 minutes

 • Engineered a model of firmware architecture using .NET framework for printer's native code to expedite the integration of a performance profiling tool with the firmware, thereby uncovering issues in advance.



 Reliance Industries

 Navi Mumbai, Maharashtra, India

 Software Development Intern

 April 2018 - May 2018

 • Monitored network traffic of Enterprise IDC's data centre and resolved congestion issues by using leaky bucket and token bucket algorithms, thereby improving its resiliency by 4%



 SKILLS

 Skills: Python, Java, JavaScript, Adobe After Effects, ASP.NET, MySQL, NoSQL, Digital Ocean, JIRA, MATLAB, Data Structures & Algorithms, Natural Language Processing (NLP), HTML/CSS, Git, C/C++, Agile, React.js
```

## Formatted Version

```
# RAKETLA KRISHNA
+1 617 820 0415 | krishrak@outlook.com | linkedin.com/in/krishna-raketla/

## EDUCATION

**Northeastern University**  
*January 2023 - May 2025*  
Master's, Computer Science  
GPA: 3.5

**Vellore Institute of Technology**  
*July 2016 - August 2019*  
Bachelor's, Computer Science  
GPA: 7.23

## PROFESSIONAL EXPERIENCE

**HP Inc**  
*Bengaluru, Karnataka, India*  
**Senior Software Engineer**  
*January 2021 - November 2022*
- Spearheaded the Fax UI workflow, specifically developing and validating specs by coordinating with cross-functional teams for design reviews, resulting in early delivery with 20% increased efficiency and highest quality
- Employed agile methodologies, emphasizing continuous unit testing to validate robustness and reliability
- Mentored two interns to resolve critical memory leak issues identified through address sanitizer.

**Hewlett Packard (HP)**  
*Bengaluru, Karnataka, India*  
**Software Engineer**  
*August 2019 - December 2020*
- Programmed APIs to serialize and deserialize the fax communication data and modified it from XML to Google FlatBuffers for reducing source code memory size by 95% and data decoding time by 45%
- Integrated a common data collection interface at the network and job layers of the T30 protocol stack and generated fax reports, thereby decreasing code duplicity and expediting the fax issues' triage by 35%
- Implemented the CDM adapters for Receive Fax job ticket to enable seamless communication between the resource and application layers.

**Hewlett Packard (HP)**  
*Bengaluru, Karnataka, India*  
**Research and Development Intern**  
*January 2019 - July 2019*
- Developed a testing automation system for printer firmware to identify the failure commit and minimize physical intervention, ultimately reducing the effort to triage from 3 person-days to 10 minutes
- Engineered a model of firmware architecture using .NET framework for printer's native code to expedite the integration of a performance profiling tool with the firmware, thereby uncovering issues in advance.

**Reliance Industries**  
*Navi Mumbai, Maharashtra, India*  
**Software Development Intern**  
*April 2018 - May 2018*
- Monitored network traffic of Enterprise IDC's data centre and resolved congestion issues by using leaky bucket and token bucket algorithms, thereby improving its resiliency by 4%

## SKILLS
Python, Java, JavaScript, Adobe After Effects, ASP.NET, MySQL, NoSQL, Digital Ocean, JIRA, MATLAB, Data Structures & Algorithms, Natural Language Processing (NLP), HTML/CSS, Git, C/C++, Agile, React.js 