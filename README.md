# NEAR Balance Checker

A simple, elegant web application for checking NEAR Protocol account balances. This app fetches both liquid (available) and staked balances from the NEAR mainnet and displays the total balance for any NEAR account (implicit addresses, named addresses like `.near`, or Ethereum-like addresses).

## Features

- **Balance Checking**: View available, staked, and total balance for any NEAR account
- **Error Handling**: Comprehensive error handling with user-friendly messages including:
  - Account validation
  - Network error detection
  - RPC provider failover handling
  - Request timeout management (30 seconds)
- **Accessibility**: Full ARIA support with screen reader compatibility
- **Performance**: Optimized with request cancellation, parallel API calls, and proper cleanup
- **NEAR Brand Compliant**: Designed according to [NEAR Brand Guidelines](https://pages.near.org/about/brand/)
- **External Links**: Quick access to account details on:
  - [Pikes Peak](https://pikespeak.ai) - Money Flow Explorer
  - [NEAR Explorer](https://explorer.mainnet.near.org) - Official NEAR Explorer
  - [NEAR Blocks](https://nearblocks.io) - Block Explorer

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) 16.0.1 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Blockchain SDK**: [near-api-js](https://github.com/near/near-api-js) 6.5.0
- **Font**: Geist (optimized via Next.js font optimization)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd near-balance-checker
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
near-balance-checker/
├── app/
│   ├── page.tsx          # Main application component
│   ├── layout.tsx         # Root layout with metadata
│   └── globals.css        # Global styles with NEAR brand colors
├── next.config.ts         # Next.js configuration (static export)
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## Configuration

The app is configured to connect to NEAR mainnet with multiple RPC providers for failover:
- `https://rpc.mainnet.near.org` (Primary)
- `https://free.rpc.fastnear.com` (Failover)
- `https://near.blockpi.network/v1/rpc/public` (Failover)

## Build & Deploy

### Build for Production

```bash
npm run build
```

This creates a static export in the `out/` directory, ready for deployment to any static hosting service.

### Deploy

I deploy to a NameCrane shared hosting environment. It's cheap and reliable.
You can support me by signing up with my [affiliate link](https://namecrane.com/r/196/).

All you do is copy the `out/` directory to any static hosting service:
- [Name Crane](https://namecrane.com/r/196/)
- GitHub Pages
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront
- Any static file host

I hear you can deploy Next apps to [Vercel](https://vercel.com/) as well.

## NEAR Brand Compliance

This application follows the [NEAR Brand Guidelines](https://pages.near.org/about/brand/):

- **Colors**: Uses NEAR primary colors (Green #00ec97, Off White #f2f1e9, Black #000000)
- **Typography**: Left-aligned text with proper spacing and font weights
- **Design**: Clean, simple, and intuitive interface with generous whitespace
- **Brand Voice**: Professional, confident, and optimistic

## Technical Improvements

This project includes several best practices and optimizations:

- ✅ Request cancellation to prevent race conditions
- ✅ Timeout handling (30 seconds) with proper cleanup
- ✅ Parallel API calls for better performance
- ✅ Comprehensive error handling with specific error messages
- ✅ Full TypeScript type safety
- ✅ Accessibility features (ARIA labels, live regions, semantic HTML)
- ✅ Input validation with regex pattern matching
- ✅ Performance optimizations (useCallback, proper cleanup)
- ✅ Memory leak prevention (timeout cleanup, abort controllers)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [NEAR Protocol Documentation](https://docs.near.org)
- [near-api-js Documentation](https://docs.near.org/tools/near-api-js)
- [NEAR Brand Guidelines](https://pages.near.org/about/brand/)

## License

This project is open source and available under the MIT License.
