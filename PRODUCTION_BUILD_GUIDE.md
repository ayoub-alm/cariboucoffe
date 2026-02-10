# Production Build & Deployment Guide

## 🏗️ Building for Production

### Option 1: Using npm script (Recommended)
```bash
npm run build:prod
```

### Option 2: Using Angular CLI directly
```bash
ng build --configuration production
```

### Option 3: Default build (also uses production)
```bash
npm run build
```
> Note: By default, `ng build` uses the production configuration as specified in `angular.json`

## 📦 What Happens During Production Build

When you build with production configuration:

1. **Environment File Replacement**: 
   - Uses `src/environments/environment.ts` (production settings)
   - API Base URL: Update this in the file before building!

2. **Optimizations Applied**:
   - Code minification and uglification
   - Tree shaking (removes unused code)
   - Ahead-of-Time (AOT) compilation
   - Output hashing for cache busting
   - Bundle size optimization

3. **Output Location**:
   - Built files are generated in: `dist/cariboucoffee/browser/`

## ⚙️ Before Building for Production

**IMPORTANT**: Update your production API URL in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://your-actual-backend-url.com/api'  // ← Update this!
};
```

## 🚀 Running the Production Build Locally

After building, you can test the production build locally:

### Option 1: Using http-server (Simple)
```bash
# Install http-server globally (one time only)
npm install -g http-server

# Navigate to the build output
cd dist/cariboucoffee/browser

# Serve the files
http-server -p 8080
```

Then open: `http://localhost:8080`

### Option 2: Using serve (Recommended)
```bash
# Install serve globally (one time only)
npm install -g serve

# Serve the production build
serve -s dist/cariboucoffee/browser -p 8080
```

Then open: `http://localhost:8080`

## 🌐 Deploying to Production

### Deploy to Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build for production
npm run build:prod

# Deploy
netlify deploy --prod --dir=dist/cariboucoffee/browser
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Build for production
npm run build:prod

# Deploy
vercel --prod
```

### Deploy to Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (first time only)
firebase init hosting

# Build for production
npm run build:prod

# Deploy
firebase deploy --only hosting
```

### Deploy to Traditional Web Server (Apache/Nginx)

1. Build for production:
   ```bash
   npm run build:prod
   ```

2. Copy the contents of `dist/cariboucoffee/browser/` to your web server's root directory

3. Configure your web server for Angular routing:

   **For Nginx** (`nginx.conf`):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /path/to/dist/cariboucoffee/browser;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

   **For Apache** (`.htaccess`):
   ```apache
   <IfModule mod_rewrite.c>
       RewriteEngine On
       RewriteBase /
       RewriteRule ^index\.html$ - [L]
       RewriteCond %{REQUEST_FILENAME} !-f
       RewriteCond %{REQUEST_FILENAME} !-d
       RewriteRule . /index.html [L]
   </IfModule>
   ```

## 📊 Build Output Analysis

To analyze your bundle size:
```bash
npm run build:prod -- --stats-json
npx webpack-bundle-analyzer dist/cariboucoffee/browser/stats.json
```

## ✅ Pre-Deployment Checklist

- [ ] Update production API URL in `src/environments/environment.ts`
- [ ] Test the application locally with `ng serve`
- [ ] Run production build: `npm run build:prod`
- [ ] Check for build errors or warnings
- [ ] Test production build locally using `serve` or `http-server`
- [ ] Verify all API calls work with production backend
- [ ] Check browser console for errors
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test responsive design on mobile devices
- [ ] Verify all routes work correctly
- [ ] Check that environment variables are correct

## 🔍 Troubleshooting

### Build fails with errors
- Check TypeScript errors: `ng build --configuration production`
- Review error messages and fix code issues

### API calls not working in production
- Verify `apiBaseUrl` in `src/environments/environment.ts`
- Check CORS settings on your backend
- Verify backend is accessible from production domain

### Routing issues (404 on refresh)
- Configure web server to redirect all routes to `index.html`
- See server configuration examples above

### Large bundle size
- Use lazy loading for feature modules
- Optimize images and assets
- Remove unused dependencies
- Use `ng build --stats-json` to analyze bundle

## 📝 Quick Reference

| Command | Description |
|---------|-------------|
| `npm run build:prod` | Build for production |
| `npm run build` | Build (defaults to production) |
| `npm run watch` | Build in watch mode (development) |
| `npm start` | Run development server |
| `ng serve --configuration production` | Serve with production config |

## 🔗 Useful Links

- [Angular Deployment Guide](https://angular.dev/tools/cli/deployment)
- [Angular Build Configuration](https://angular.dev/tools/cli/build)
- [Environment Configuration](https://angular.dev/tools/cli/environments)
