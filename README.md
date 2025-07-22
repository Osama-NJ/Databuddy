# Databuddy

<div align="center">

[![License: AGPL](https://img.shields.io/badge/License-AGPL-red.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://reactjs.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-1.12-blue.svg)](https://turbo.build/repo)
[![Bun](https://img.shields.io/badge/Bun-1.2-blue.svg)](https://bun.sh/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue.svg)](https://tailwindcss.com/)

[![CI/CD](https://github.com/databuddy/databuddy/actions/workflows/ci.yml/badge.svg)](https://github.com/databuddy/databuddy/actions/workflows/ci.yml)
[![Code Coverage](https://img.shields.io/badge/coverage-85%25-green.svg)](https://github.com/databuddy/databuddy/actions/workflows/coverage.yml)
[![Security Scan](https://img.shields.io/badge/security-A%2B-green.svg)](https://github.com/databuddy/databuddy/actions/workflows/security.yml)
[![Dependency Status](https://img.shields.io/badge/dependencies-up%20to%20date-green.svg)](https://github.com/databuddy/databuddy/actions/workflows/dependencies.yml)

[![Discord](https://img.shields.io/discord/123456789?label=Discord&logo=discord)](https://discord.gg/JTk7a38tCZ)
[![Twitter](https://img.shields.io/twitter/follow/databuddy?style=social)](https://twitter.com/databuddy)
[![GitHub Stars](https://img.shields.io/github/stars/databuddy/databuddy?style=social)](https://github.com/databuddy/databuddy/stargazers)

</div>

A comprehensive analytics and data management platform built with Next.js, TypeScript, and modern web technologies. Databuddy provides real-time analytics, user tracking, and data visualization capabilities for web applications.

## 🌟 Features

- 📊 Real-time analytics dashboard
- 👥 User behavior tracking
- 📈 Advanced data visualization // Soon
- 🔒 Secure authentication
- 📱 Responsive design
- 🌐 Multi-tenant support
- 🔄 Real-time updates // Soon
- 📊 Custom metrics // Soon
- 🎯 Goal tracking
- 📈 Conversion analytics
- 🔍 Custom event tracking
- 📊 Funnel analysis 
- 📈 Cohort analysis // Soon
- 🔄 A/B testing // Soon
- 📈 Export capabilities // Soon
- 🔒 GDPR compliance
- 🔐 Data encryption
- 📊 API access

## 📚 Table of Contents

- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Contributing](#contributing)
- [Security](#security)
- [FAQ](#faq)
- [Support](#support)
- [License](#license)

## 🚀 Getting Started

### Prerequisites

- Bun
- PostgreSQL
- Redis
- Cloudflare account
- Vercel account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/databuddy/databuddy.git
cd databuddy
```

2. Install dependencies (Bun only):
```bash
bun install
```

3. Set up environment variables:
```bash
cp apps/dashboard/.env.example apps/dashboard/.env
cp apps/landing/.env.example apps/landing/.env
cp apps/admin/.env.example apps/admin/.env
cp apps/api/.env.example apps/api/.env
```

4. Start development servers (Bun only):
```bash
bun run dev
```

### Environment Variables

#### Dashboard (`dashboard`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

#### Landing Page (`landing`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

#### Admin Panel (`admin`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

#### API (`api`)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/databuddy
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
```

## 💻 Development

### Available Scripts

- `bun run dev` - Start all applications in development mode
- `bun run build` - Build all applications and packages
- `bun run lint` - Run linting across all packages
- `bun run test` - Run tests across all packages
- `bun run clean` - Clean all build artifacts
- `bun run typecheck` - Run TypeScript type checking
- `bun run format` - Format all files
- `bun run prepare` - Prepare all packages for development
- `bun run changeset` - Create a new changeset
- `bun run version` - Version all packages
- `bun run publish` - Publish all packages

### Development Workflow

1. Create a new branch:
```bash
git checkout -b feature/your-feature
```

2. Make your changes

3. Run tests:
```bash
bun run test
```

4. Create a changeset:
```bash
bun run changeset
```

5. Commit your changes:
```bash
git add .
git commit -m "feat: your feature"
```

6. Push your changes:
```bash
git push origin feature/your-feature
```

7. Create a Pull Request

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 🔒 Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## ❓ FAQ

### General

1. **What is Databuddy?**
   Databuddy is a comprehensive analytics and data management platform.

2. **How do I get started?**
   Follow the [Getting Started](#getting-started) guide.

3. **Is it free?**
   Check our [pricing page](https://databuddy.cc/pricing).

### Technical

1. **What are the system requirements?**
   See [Prerequisites](#prerequisites).

2. **How do I deploy?**
   See [Deployment](#deployment).

3. **How do I contribute?**
   See [Contributing](#contributing).

## 💬 Support

- [Documentation](https://docs.databuddy.cc)
- [Discord](https://discord.gg/JTk7a38tCZ)
- [Twitter](https://twitter.com/databuddyps)
- [GitHub Issues](https://github.com/databuddy/databuddy/issues)
- [Email Support](mailto:support@databuddy.cc)

## 📄 License

AGPL - All rights reserved

Copyright (c) 2025 Databuddy

## 🙏 Acknowledgments

See [ACKNOWLEDGMENTS.md](ACKNOWLEDGMENTS.md) for credits.

## ⚠️ Coding Standards & Rules

- **Bun is required** for all development and scripts. Do not use npm, pnpm, or Node.js CLI for install, run, or dev.
- **Zod v4** (from `zod/v4`) is required everywhere. Do not use Zod v3.
- **Use only Phosphor icons** (not Lucide).
- **Use Dayjs** for date handling (never date-fns).
- **Use Tanstack Query** for hooks (never SWR).
- **Use rounded** for border radius (never rounded-xl or rounded-md).
- **Never add placeholders or mock data.**
- **Always ensure type-safety** and use shared types where possible.
- **Never throw errors in server actions;** use try/catch and return errors to the client.
- **Always use error boundaries properly.**
- **Console usage:** Use `console.error`, `console.time`, `console.json`, `console.table`, etc. appropriately.
- **Almost never use useEffect** unless critical.

See `.cursor/rules/` for the full enforced ruleset.
