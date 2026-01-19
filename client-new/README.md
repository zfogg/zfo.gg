# zfo.gg - Modern React Website

This is the modernized version of zfo.gg, built with the latest web technologies.

## Tech Stack

- **Bun** - Fast JavaScript runtime and package manager
- **Vite** - Next-generation frontend build tool
- **React 19** - UI library
- **React Router 7** - Client-side routing
- **Tailwind CSS 4** - Utility-first CSS framework
- **React Query** - Data fetching and state management
- **Font Awesome** - Icon library

## Features

✅ Custom Aleo font family (6 variants)
✅ Responsive typography (FlowType.js replacement)
✅ Google Tag Manager (GTM-T6D5ZZ)
✅ Google Analytics (G-B3YQT9SSJF)
✅ OpenGraph meta tags for social sharing
✅ Custom Z emoji favicon
✅ Sitemap generation
✅ Robots.txt
✅ Social media footer links
✅ Bitcoin donation page
✅ Gravity canvas placeholder (ready for TypeScript rewrite)
✅ Custom 404 page

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Pages

- **/** - Home page with "things I make" showcase
- **/bitcoin** - Bitcoin donation page
- **/thing/gravity** - Gravity simulation placeholder (canvas ready)
- **404** - Custom 404 error page

## Migration Notes

### What's New
- Modern React with hooks instead of Angular.js
- Tailwind CSS instead of Bootstrap/Sass
- Vite instead of Grunt build system
- Custom `useFlowType` hook replicates FlowType.js behavior
- Font Awesome React components instead of icon fonts
- Automatic sitemap generation on build

### What's Preserved
- All custom Aleo fonts
- Exact same typography settings (18px base, 1.45 line height)
- FlowType.js responsive sizing (20-32px range)
- All social media links
- Google Analytics and Tag Manager
- OpenGraph metadata
- Robots.txt and sitemap
- Page routes and content

### Next Steps
- Rewrite gravity simulation in TypeScript
- Add any additional features or pages as needed
- Deploy to production

## SEO & Analytics

The site includes:
- Google Tag Manager (GTM-T6D5ZZ) - Full tracking suite
- Google Analytics (G-B3YQT9SSJF) - Direct analytics tracking
- OpenGraph tags for rich social sharing
- Sitemap at `/sitemap.xml`
- Robots.txt at `/robots.txt`

## License

Personal website of Zachary Fogg (@zfogg)
