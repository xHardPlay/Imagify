# 🚀 Imagify - AI-Powered Image Analysis Platform

<div align="center">
  <img src="https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.6.2-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.4.19-purple?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4.17-blue?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI-orange?style=for-the-badge&logo=google" alt="Gemini AI" />
</div>

<div align="center">
  <h3>✨ Transform your images into actionable business insights with AI-powered analysis ✨</h3>
  <p>A modern, intuitive platform that uses Google Gemini AI to extract meaningful data from images in seconds</p>
</div>

---

## 🎯 **Key Features**

### 🤖 **Intelligent Analysis**
- **AI-Powered Extraction**: Leverages Google Gemini's advanced computer vision
- **Custom Workflows**: Create tailored analysis pipelines for your specific needs
- **Real-time Processing**: Get results in seconds, not hours
- **Multi-Variable Support**: Extract multiple data points from a single image

### 💻 **Modern Interface**
- **Beautiful Design**: Modern, playful UI with smooth animations
- **Drag & Drop**: Intuitive file upload with visual feedback
- **Clipboard Support**: Paste images directly with Ctrl+V
- **Responsive Design**: Works perfectly on desktop and mobile

### 🔄 **Advanced Functionality**
- **Image Download**: Export in multiple formats (JPEG, PNG, WebP, AVIF)
- **Live Chat**: Ask AI questions about your images in real-time
- **Workflow Management**: Create, edit, and delete custom analysis workflows
- **Data Export**: Export results in JSON, CSV formats

### 🏢 **Business Ready**
- **Scalable Architecture**: Built for growth from startup to enterprise
- **Secure Processing**: Client-side image compression and secure API handling
- **Performance Optimized**: Fast loading and efficient processing
- **Cross-Browser Support**: Works on all modern browsers

---

## 🚀 **Quick Start**

### Prerequisites
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Google Gemini API Key** ([Get yours here](https://makersuite.google.com/app/apikey))

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd WebApp\ Imagify

# Install dependencies
npm install

# Start development server
npm run dev
```

### Configuration
1. **Start the application** - it will open at `http://localhost:5173`
2. **Add your API key** - click the Settings button and enter your Google Gemini API key
3. **Create a workflow** - define what information you want to extract from images
4. **Upload and analyze** - drag & drop an image or paste from clipboard

---

## 🎨 **How It Works**

### 1. **Create Workflows** 🛠️
Define custom analysis workflows with specific variables:
- **Text extraction** (product names, descriptions)
- **Number detection** (prices, quantities, measurements)
- **Color analysis** (color palettes, dominant colors)
- **Boolean checks** (quality assessment, feature detection)
- **List generation** (categories, tags, features)

### 2. **Upload Images** 📸
Multiple ways to add images:
- **Drag and drop** files directly
- **Click to browse** and select files
- **Paste from clipboard** with Ctrl+V
- **Automatic compression** for optimal processing

### 3. **AI Analysis** 🤖
Powered by Google Gemini:
- **Advanced computer vision** for accurate recognition
- **Natural language processing** for contextual understanding
- **Custom prompts** tailored to your workflow variables
- **Confidence scoring** for reliability assessment

### 4. **Interactive Results** 📊
- **Structured data display** with confidence scores
- **Image download** in multiple formats
- **Live AI chat** for additional insights
- **Export functionality** for further analysis

---

## 🏗️ **Project Structure**

```
src/
├── components/
│   ├── APIKeyManager/          # API configuration
│   ├── ImageUpload/           # File upload & processing
│   ├── ResultsDisplay/        # Results visualization & chat
│   └── VariableManager/       # Workflow configuration
├── hooks/
│   └── useLocalStorage.ts     # Persistent state management
├── types/
│   └── index.ts              # TypeScript definitions
├── App.tsx                   # Main application
├── main.tsx                  # Entry point
└── index.css                 # Global styles
```

---

## 🛠️ **Tech Stack**

### **Frontend**
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type safety and better developer experience
- **Vite** - Ultra-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework

### **AI & APIs**
- **Google Gemini** - Advanced multimodal AI for image analysis
- **Gemini Vision API** - Specialized computer vision capabilities

### **UI & UX**
- **Lucide React** - Beautiful, customizable icons
- **Custom Animations** - Smooth transitions and micro-interactions
- **Responsive Design** - Mobile-first approach

### **State Management**
- **React Hooks** - Modern state management
- **Local Storage** - Persistent user preferences
- **Custom Hooks** - Reusable state logic

---

## 📱 **Use Cases**

### **E-commerce** 🛒
- Product catalog automation
- Inventory management
- Quality control
- Price monitoring

### **Real Estate** 🏠
- Property feature extraction
- Condition assessment
- Room categorization
- Virtual staging analysis

### **Healthcare** 🏥
- Medical image analysis
- Report generation
- Research data extraction
- Documentation automation

### **Marketing** 📱
- Brand monitoring
- Content analysis
- Social media insights
- Competitor tracking

### **Manufacturing** 🏭
- Quality assurance
- Defect detection
- Process monitoring
- Compliance checking

---

## 🚀 **Deployment**

See our comprehensive [Deployment Guide](./DEPLOYMENT.md) for detailed instructions on:
- **Local development** setup
- **Production deployment** options (Vercel, Netlify, Docker, etc.)
- **Performance optimization**
- **Security considerations**
- **CI/CD pipelines**

---

## 📈 **Marketing & Growth**

Check out our detailed [Marketing Plan](./MARKETING_PLAN.md) covering:
- **Target market analysis**
- **Go-to-market strategy**
- **Customer acquisition tactics**
- **Pricing strategy**
- **Success metrics**

---

## 🤝 **Contributing**

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 **Support**

- **Documentation**: Check our guides and API documentation
- **Issues**: Report bugs and request features via GitHub Issues
- **Community**: Join our Discord server for discussions
- **Email**: Contact us at support@imagify.ai

---

## 🙏 **Acknowledgments**

- **Google Gemini** for providing advanced AI capabilities
- **React Team** for the amazing framework
- **Tailwind CSS** for the utility-first approach
- **Vite** for the lightning-fast build tool
- **Lucide** for beautiful icons

---

<div align="center">
  <h3>✨ Built with ❤️ for the future of visual intelligence ✨</h3>
  <p>Transform your images into insights with Imagify</p>
</div>
