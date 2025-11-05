# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-05

### Added
- Initial release of NEAR Balance Checker
- Support for checking available, staked, and total balances for NEAR accounts
- Support for multiple NEAR account formats:
  - Implicit addresses (64 hexadecimal characters)
  - Named addresses (e.g., `alice.near`, `sub.account.testnet`)
  - Ethereum-like addresses (e.g., `0x85f17cf997934a597031b2e18a9ab6ebd4b9f6a4`)
- Comprehensive error handling with user-friendly messages
- Request timeout handling (30 seconds)
- RPC provider failover support
- Request cancellation to prevent race conditions
- Full accessibility support (ARIA labels, live regions, semantic HTML)
- Input validation with regex pattern matching
- Loading states with visual indicators
- Links to external NEAR explorers:
  - Pikes Peak - Money Flow Explorer
  - NEAR Explorer - Account Details
  - NEAR Blocks - Account Explorer
- NEAR brand compliant design following official brand guidelines
- "Built on NEAR" badge
- Next.js and TypeScript badges
- Custom NEAR token favicon

### Technical
- Built with Next.js 16.0.1 (App Router)
- TypeScript for type safety
- Tailwind CSS v4 for styling
- near-api-js 6.5.0 for blockchain integration
- Performance optimizations (useCallback, parallel API calls, proper cleanup)
- Memory leak prevention (timeout cleanup, abort controllers)
- Static export configuration for easy deployment

