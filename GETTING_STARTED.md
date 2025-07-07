# Getting Started with Imagify

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open in Browser**
   Visit `http://localhost:5173`

## First Steps

### 1. Configure API Key
- When you first open the app, you'll be prompted to enter your Google Gemini API key
- Get your API key from: https://aistudio.google.com/app/apikey
- Your API key is stored locally and never sent to external servers

### 2. Create Your First Workflow
1. Click "New Workflow" in the sidebar
2. Give your workflow a descriptive name (e.g., "Photo Analysis")
3. Add a description explaining what you want to analyze

### 3. Define Variables
1. Click "Add Variable" to create your first variable
2. Example variables:
   - **Name**: "color palette" | **Type**: "color" | **Description**: "Extract dominant colors from the image"
   - **Name**: "number of people" | **Type**: "number" | **Description**: "Count how many people are in the photo"
   - **Name**: "mood/emotion" | **Type**: "text" | **Description**: "Describe the overall mood or emotion conveyed"

### 4. Analyze Images
1. Switch to the "Image Analysis" tab
2. Upload or paste an image
3. The AI will analyze the image and extract the variables you defined

### 5. View Results
- Results appear in the "Results" tab
- You can copy individual results or export all data as JSON/CSV

## Example Workflows

### Design Analysis Workflow
Variables to extract:
- **Color Palette**: Primary and secondary colors with hex codes
- **Typography Style**: Font styles and characteristics
- **Layout Type**: Grid system, alignment, spacing
- **Visual Hierarchy**: How elements are organized

### Photography Analysis Workflow
Variables to extract:
- **Number of People**: Count of people in the image
- **Setting/Location**: Indoor/outdoor, specific location type
- **Lighting Conditions**: Natural, artificial, time of day
- **Composition Style**: Rule of thirds, symmetry, etc.

### Product Analysis Workflow
Variables to extract:
- **Product Category**: Type of product shown
- **Brand Elements**: Logos, text, brand colors
- **Product Count**: Number of items visible
- **Background Style**: Clean, lifestyle, studio, etc.

## Advanced Features

### Variable Types
- **Text**: For descriptive information
- **Number**: For counts, measurements, ratings
- **Color**: For color extraction with hex codes
- **Boolean**: For yes/no questions
- **List**: For multiple items or categories

### Tips for Better Results
1. **Be Specific**: Clear variable descriptions help the AI understand what to extract
2. **Use Examples**: Include examples in descriptions when possible
3. **Start Simple**: Begin with basic variables and add complexity gradually
4. **Test Iteratively**: Try different images to refine your workflow

## Troubleshooting

### Common Issues

**API Key Not Working**
- Ensure your API key starts with "AIza"
- Check that your API key has Gemini API access enabled
- Verify your Google Cloud billing is set up

**Poor Analysis Results**
- Make variable descriptions more specific
- Try different image types
- Adjust the AI model temperature in settings

**Image Upload Issues**
- Ensure images are in supported formats (JPEG, PNG, WebP)
- Check image file size (recommended < 10MB)
- Try refreshing the page

### Getting Help
- Check the console for error messages (F12 in browser)
- Ensure all variables are properly configured
- Verify your internet connection for API calls

## Building for Production

```bash
# Build the application
npm run build

# Preview the build
npm run preview
```

The built files will be in the `dist` directory and can be deployed to any static hosting service.

## Next Steps

1. **Enhance Analysis**: Add more sophisticated variables and workflows
2. **Batch Processing**: Process multiple images with the same workflow
3. **Export Integration**: Connect results to your design tools
4. **Team Collaboration**: Share workflows with team members
5. **Custom Prompts**: Fine-tune AI prompts for specific use cases

Happy analyzing! 🎨✨
