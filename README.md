# AstraNavi - AI-Powered Vedic Astrology Platform

Your personal Jyotish is one tap away. Get instant Vedic insights, personalized Kundli generation, and cosmic guidance powered by AI trained on 5,000+ years of Vedic wisdom.

## Features

- **Free Kundli Generation** - Complete Vedic birth chart with all 12 houses and Dashas
- **AI Astrologer Chat** - 24/7 cosmic guidance in Hindi & English
- **Daily Horoscope** - Rashi-based daily and weekly readings
- **Kundli Matching** - 36-gun Milan and Dosha compatibility checks
- **Panchang** - Daily Tithi, Nakshatra, and Muhurat information
- **Gemstone Recommendations** - Personalized gem suggestions based on your chart
- **Instant Results** - No waiting, no scheduling, completely private

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd astranavi-frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── login/             # Authentication pages
│   ├── about/             # About page
│   ├── plans/             # Pricing page
│   └── page.tsx           # Home page
├── components/
│   ├── home/              # Landing page sections
│   ├── chat/              # Chat interface components
│   ├── dashboard/         # Dashboard components
│   ├── layout/            # Layout components
│   └── ui/                # Reusable UI components
├── context/               # React context (Auth, etc.)
├── data/                  # Static data (FAQs, etc.)
├── lib/                   # Utility functions
└── types/                 # TypeScript type definitions
```

## Design System

AstraNavi uses a premium, cosmic-inspired design system with:

- **Color Palette**: Deep purples, warm golds, and ivory tones
- **Typography**: Playfair Display (headlines) + DM Sans (body)
- **Animations**: Smooth transitions, particle effects, cosmic glows
- **Dark/Light Mode**: Full theme support with CSS variables
- **Responsive**: Mobile-first design that scales beautifully

See `DESIGN.md` for detailed design documentation.

## Technology Stack

- **Framework**: Next.js 14+ (React 18+)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Icons**: Material Symbols + Lucide React
- **State Management**: React Context
- **Authentication**: Custom Auth Context

## Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check

# Testing
npm run test         # Run tests (if configured)
```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
# Add other public variables here
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Optimized images with Next.js Image component
- Code splitting and lazy loading
- CSS-in-JS with Tailwind for minimal bundle size
- WebGL particle engine with GPU acceleration (dark mode)

## Accessibility

- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

Proprietary - All rights reserved

## Support

For issues, questions, or feedback, please contact the development team.

---

**AstraNavi** - Decode Your Destiny with AI & Vedic Wisdom
