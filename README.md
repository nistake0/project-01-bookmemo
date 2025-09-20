# BookMemo App — 100% Cursor AI Generated Project

## Table of Contents

* [About the Project](#about-the-project)
* [App Overview & Features](#app-overview--features)
* [Tech Stack](#tech-stack)
* [Setup Instructions](#setup-instructions)
* [Testing](#testing)
* [Project Structure](#project-structure)
* [Project Documentation](#project-documentation)
* [Operations & Security](#operations--security)
* [Production Deployment](#production-deployment)
* [License](#license)

A web application for managing reading notes using React + Firebase.

## About the Project

This project was **completely created by Cursor AI**. All coding was done by AI without any human assistance. Cursor AI is an AI assistant that supports the entire development process, including code generation, refactoring, and test creation. In this project, Cursor AI played the following roles:

* Initial project setup and structure design
* Application logic implementation (authentication, data management, UI/UX)
* Feature implementation including screen transitions and animations
* Test code creation and execution (unit tests & E2E tests)
* Code refactoring and optimization
* Bug fixes and debugging
* Documentation generation (README, ARCHITECTURE.md, daily reports, etc.)
* Production deployment environment setup

Cursor AI achieved efficient development by understanding developer intentions and proposing appropriate code. This project serves as an example of the possibilities of complete AI-driven coding.

### Development Records

You can check specific interactions with Cursor and daily development progress in the following documents:

* `cursor-chats/`: Contains conversation logs with Cursor (prompts and AI responses)
* `doc/`: Contains daily development reports

## App Overview & Features

A simple web application for managing reading notes. It retrieves bibliographic information based on book ISBNs and saves and manages them together with notes.

**Technical Details**: For detailed technical specifications, architecture, and implementation details of the project, check [DeepWiki](https://deepwiki.com/nistake0/project-01-bookmemo).

### Main Features

* **Book Management**: Book registration via ISBN scanning and manual input
* **Memo Functionality**: Reading notes, impressions, and tag management per book
* **Search & Filter**: Integrated search, tag filters, status filters
* **Statistics Dashboard**: Visualization of reading data (graphs & rankings)
* **Tag Management**: Tag editing, deletion, and consolidation features
* **PWA Support**: Offline capability, installable
* **OCR Functionality**: Text recognition via camera and paste
* **Responsive Design**: Mobile and PC compatible

## Tech Stack

* **Frontend**: React 18 + Vite
* **UI Framework**: Material-UI (MUI)
* **Database**: Firebase Firestore
* **Authentication**: Firebase Authentication
* **Hosting**: GitHub Pages
* **Testing**: Jest + React Testing Library + Cypress
* **PWA**: Service Worker + Web App Manifest

## Setup Instructions

### Prerequisites

* Node.js (v16+ recommended)
* npm (v7+ recommended)
* Firebase project creation

### Installation

```bash
# Install dependencies
npm install
```

### Environment Variables Setup

Create a `.env.local` file in the project root and add your Firebase project information:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Development Server

```bash
npm run dev
```

The development server will start, and you can access the app at `http://localhost:5173` in your browser. Code changes will be automatically reflected.

### Build

```bash
npm run build
```

Builds the project and outputs to the `dist` directory.

### Preview Build

```bash
npm run preview
```

You can preview the built app locally.

## Testing

This project uses Jest and Cypress for testing.

### Unit Tests

```bash
# Run unit tests
npm run test:unit

# Watch mode (automatically runs on file changes)
npm run test:unit:watch

# Check test coverage
npm run test:coverage
```

Test coverage reports are generated in the `coverage` directory.

### E2E Tests (Cypress)

#### Test Implementation Policy

- **Deterministic element identification via data-testid attributes**: All test target elements have `data-testid` attributes
- **Avoid text-based element identification**: Implement stable tests that are not affected by UI changes
- **Ensure consistency**: Unify naming conventions for test elements to improve maintainability

#### Execution Method

1. Place Firebase service account key (`serviceAccountKey.json`) in the project root
2. Automatically create test users
   ```bash
   npm run test:setup
   ```
3. **Start development server** (required for E2E test execution)
   ```bash
   npm run dev
   ```
4. Run Cypress tests
   - Run all: `npm run test:e2e`
   - GUI mode: `npm run test:e2e:open`
   - Run all tests (unit + E2E): `npm run test:all`

#### Important Notes

- **Never commit `serviceAccountKey.json` to Git**
- **Always start the development server (`npm run dev`) before running E2E tests**
- **HTTPS development environment**: Development server runs on HTTPS, so Cypress configuration is also HTTPS-compatible

## Project Structure

```
src/
├── components/      # React components
│   ├── auth/       # Authentication related
│   ├── common/     # Common components
│   ├── search/     # Search related
│   └── tags/       # Tag management
├── hooks/          # Custom hooks
├── pages/          # Page components
├── constants/      # Constant definitions
├── firebase.js     # Firebase configuration
└── utils/          # Utility functions
```

## Project Documentation

Detailed documentation for this project can be found in the following locations:

* **ARCHITECTURE.md**: Detailed design and operational policies
* **doc/bug-feature-memo.md**: Important memos about bugs, features, and improvement ideas
* **doc/daily/**: Daily development reports (progress, discussions, technical insights)
* **cursor-chats/**: Conversation logs with Cursor (complete record of AI auto-generation)

These documents allow you to efficiently understand the project structure and implementation details.

## Known Limitations & Future Issues

- Image attachment is currently not supported (Firebase Storage free tier limitations)
- Some bugs in smartphone camera/barcode reading
- Full-text search services like Algolia, tag analysis features, etc. are also future expansion candidates

## Operations & Security

### Security Measures
- Firestore security rules are set for production, allowing only authenticated users to access their own data
- **Important security fix (2025-08-12)**: Discovered and fixed `.env` file Git commit issue
  - Completely removed confidential information from Git history (cleaned up 163 commits with `git filter-branch`)
  - Added environment variable files to `.gitignore` to prevent recurrence
  - Added security warnings and management procedures to documentation

### Production Deployment Environment
- **Production deployment environment completed (2025-08-13)**: Production Firebase project setup completed
  - Operation confirmation completed in production environment
  - GitHub Actions automatic deployment preparation completed
  - Complete implementation of security settings

### Commit Message Operation Rules
- All commit messages are written in Japanese
- Add category prefix (e.g., `feat`, `fix`, `docs`, `refactor`, `test`, `chore`)
- Keep summary to about 50 characters, add details in the body if necessary

### Development Startup Procedure

When starting a new development session, please follow these steps:

1. Check the `doc/development-startup-prompts.md` file
2. Execute the three prompts listed in order:
   - Project status confirmation
   - Test status confirmation
   - Development policy discussion

## Production Deployment

### GitHub Pages

This app is deployed using GitHub Pages.

#### Deployment Steps

```bash
# Build
npm run build

# Deploy to GitHub Pages
npm run deploy
```

#### Access to Production Environment

- **Production URL**: https://nistake0.github.io/project-01-bookmemo/
- **GitHub Repository**: https://github.com/nistake0/project-01-bookmemo

## License

This project is released under the MIT License.
