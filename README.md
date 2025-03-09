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