# 🚀 Imagify Deployment Guide

## Overview
Imagify is a React-based web application that uses Google Gemini AI for intelligent image analysis. This guide covers multiple deployment options from development to production.

## 📋 Prerequisites

### System Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Modern browser** with JavaScript enabled
- **Google Gemini API Key** (required for AI functionality)

### API Setup
1. **Get Google Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Keep it secure for configuration

## 🛠️ Local Development

### 1. Clone and Setup
```bash
git clone <repository-url>
cd WebApp\ Imagify
npm install
```

### 2. Environment Configuration
Create a `.env.local` file (optional):
```env
VITE_DEFAULT_API_MODEL=gemini-1.5-flash
VITE_APP_NAME=Imagify
```

### 3. Start Development Server
```bash
npm run dev
```
- Application runs on `http://localhost:5173`
- Hot reloading enabled
- DevTools available

## 🌐 Production Deployment

### Option 1: Vercel (Recommended)
**Free tier available, perfect for React apps**

1. **Prepare for deployment**:
```bash
npm run build
```

2. **Deploy via Vercel CLI**:
```bash
npm install -g vercel
vercel
```

3. **Or deploy via GitHub**:
   - Connect repository to Vercel
   - Auto-deploys on push to main branch
   - Custom domain support

**Vercel Configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "functions": {},
  "routes": [
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ]
}
```

### Option 2: Netlify
**Great for static sites with easy setup**

1. **Build the application**:
```bash
npm run build
```

2. **Deploy via Netlify CLI**:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**Netlify Configuration** (`netlify.toml`):
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: GitHub Pages
**Free hosting for public repositories**

1. **Install gh-pages**:
```bash
npm install --save-dev gh-pages
```

2. **Add to package.json**:
```json
{
  "homepage": "https://yourusername.github.io/imagify",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. **Deploy**:
```bash
npm run deploy
```

### Option 4: Self-Hosted (VPS/Dedicated Server)

#### Using Nginx
1. **Build the application**:
```bash
npm run build
```

2. **Copy files to server**:
```bash
scp -r dist/* user@your-server:/var/www/imagify/
```

3. **Nginx configuration** (`/etc/nginx/sites-available/imagify`):
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/imagify;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

4. **Enable site and restart Nginx**:
```bash
sudo ln -s /etc/nginx/sites-available/imagify /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### SSL Certificate (Let's Encrypt)
```bash
sudo certbot --nginx -d your-domain.com
```

### Option 5: Docker Deployment

**Dockerfile**:
```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf**:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Deploy with Docker**:
```bash
docker build -t imagify .
docker run -p 80:80 imagify
```

**Docker Compose** (`docker-compose.yml`):
```yaml
version: '3.8'
services:
  imagify:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
```

## 🔧 Build Optimization

### 1. Vite Configuration (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react']
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
})
```

### 2. Performance Optimizations
- **Code splitting** implemented automatically by Vite
- **Image compression** built into the app
- **Lazy loading** for components
- **Tree shaking** for unused code elimination

## 🌍 CDN and Global Distribution

### Cloudflare Integration
1. **Add site to Cloudflare**
2. **Configure DNS**:
   - A record: `@` → Your server IP
   - CNAME: `www` → `your-domain.com`
3. **Enable optimizations**:
   - Auto Minify (CSS, JS, HTML)
   - Brotli compression
   - Polish (image optimization)

### Performance Features
- **Global CDN** for faster loading
- **DDoS protection**
- **SSL/TLS encryption**
- **Caching optimizations**

## 🔐 Security Considerations

### API Key Security
- **Never expose API keys** in client-side code
- **Use environment variables** for sensitive data
- **Implement rate limiting** if possible
- **Monitor API usage** regularly

### Content Security Policy
Add to your HTML head:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline';">
```

### HTTPS Enforcement
Always use HTTPS in production:
- **SSL certificates** (Let's Encrypt recommended)
- **HSTS headers**
- **Secure cookies**

## 📊 Monitoring and Analytics

### 1. Error Tracking
Integrate Sentry:
```bash
npm install @sentry/react
```

### 2. Analytics
- **Google Analytics 4**
- **Plausible** (privacy-focused)
- **Vercel Analytics** (if using Vercel)

### 3. Performance Monitoring
- **Web Vitals** tracking
- **Lighthouse** scores
- **Real User Monitoring (RUM)**

## 🔄 CI/CD Pipeline

### GitHub Actions Example (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version compatibility
   - Clear `node_modules` and reinstall
   - Verify all dependencies are installed

2. **API Key Issues**:
   - Ensure correct API key format
   - Check API quotas and billing
   - Verify model name (gemini-1.5-flash)

3. **Routing Issues (SPA)**:
   - Configure server for single-page applications
   - Set up proper redirects to `index.html`

4. **Performance Issues**:
   - Enable compression (gzip/brotli)
   - Optimize images before deployment
   - Use CDN for static assets

### Health Checks
Create a simple health check endpoint for monitoring:
```javascript
// In your nginx config
location /health {
    return 200 'healthy\n';
    add_header Content-Type text/plain;
}
```

## 📱 Mobile Considerations

- **Responsive design** built-in
- **Touch-friendly** interface
- **Fast loading** on mobile networks
- **PWA features** can be added later

## 🔄 Updates and Maintenance

### Regular Tasks
1. **Update dependencies** monthly
2. **Monitor API usage** and costs
3. **Check security vulnerabilities**
4. **Backup configuration** files
5. **Test on multiple browsers**

### Version Control
- Use semantic versioning
- Tag releases
- Maintain changelog
- Document breaking changes

---

## 🎯 Quick Start Commands

```bash
# Development
npm install && npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

This deployment guide provides comprehensive coverage for deploying Imagify in various environments, from simple static hosting to complex containerized deployments.
