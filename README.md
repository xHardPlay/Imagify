# Imagify - AI-Powered Image Analysis for Designers

## Project Overview

Imagify is a web application designed to empower designers by using AI to analyze images and extract dynamic variables. The app allows users to:

1. **Paste or upload images** from clipboard or file system
2. **Define custom variables** dynamically (e.g., "color palette", "number of people")
3. **Extract variable values** automatically using AI and OCR
4. **Manage workflows** with reusable variable templates

## Features

### Core Features
- **Image Input**: Paste from clipboard or upload files
- **Dynamic Variables**: Create custom variables for each workflow
- **AI Analysis**: Extract variable values using Google Gemini API
- **OCR Integration**: Recognize text and data from images
- **User API Key**: Users provide their own Google Gemini API key

### Example Workflow
1. User creates variables: `[color palette]`, `[number of people in photo]`
2. User pastes an image
3. AI analyzes the image and returns:
   - `color palette: blue (#1E3A8A), red (#DC2626)`
   - `number of people in photo: 5`

## Tech Stack

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **React DnD** for drag-and-drop functionality
- **Canvas API** for image handling

### Backend/API
- **Google Gemini API** for AI image analysis
- **Tesseract.js** for OCR capabilities
- **Local Storage** for user settings and API keys

### Build Tools
- **Vite** for fast development and building
- **ESLint** and **Prettier** for code quality

## Project Structure

```
imagify/
├── src/
│   ├── components/
│   │   ├── ImageUpload/
│   │   ├── VariableManager/
│   │   ├── ResultsDisplay/
│   │   └── APIKeyManager/
│   ├── hooks/
│   │   ├── useImageAnalysis.ts
│   │   ├── useClipboard.ts
│   │   └── useLocalStorage.ts
│   ├── services/
│   │   ├── geminiAPI.ts
│   │   ├── ocrService.ts
│   │   └── imageProcessor.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── colorExtractor.ts
│   └── App.tsx
├── public/
├── package.json
├── vite.config.ts
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API key

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd imagify
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm run dev
```

4. Open http://localhost:5173 in your browser

### Configuration

1. **API Key Setup**: Users enter their Google Gemini API key in the app
2. **Variable Templates**: Create and save variable templates for different workflows
3. **Image Analysis**: Configure analysis parameters and output formats

## API Integration

### Google Gemini API
- **Endpoint**: Used for image analysis and variable extraction
- **Authentication**: User-provided API key
- **Features**: Vision capabilities for image understanding

### OCR Service
- **Library**: Tesseract.js for text recognition
- **Use Cases**: Extract text, numbers, and structured data from images

## Development Roadmap

### Phase 1 (MVP)
- [x] Project setup and documentation
- [ ] Basic image upload/paste functionality
- [ ] Variable creation and management
- [ ] Google Gemini API integration
- [ ] Simple results display

### Phase 2 (Enhanced Features)
- [ ] Advanced variable types (color picker, number ranges)
- [ ] Batch processing
- [ ] Export results (JSON, CSV)
- [ ] Workflow templates

### Phase 3 (Advanced Features)
- [ ] User accounts and cloud storage
- [ ] Collaboration features
- [ ] Advanced AI prompts
- [ ] Integration with design tools

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
