# BookMemo App — 100% Cursor AI Generated Project

[🇯🇵 日本語](README.ja.md) | [🇺🇸 English](README.md)

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

This project was **completely created by Cursor AI**. All coding was done by AI without any human assistance.

**From the very beginning of development**, Cursor AI has been involved by proposing design, development plans, and task management to the user. When the user expresses requirements such as "I want a reading memo app," the AI proposes architecture ideas, phased plans, and prioritized tasks, and implementation proceeds based on these. The design, plans, and TODOs recorded in `ARCHITECTURE.md` and `doc/bug-feature-memo.md` are also created and updated from such AI proposals.

Cursor AI is an AI assistant that supports the entire development process, including code generation, refactoring, and test creation. In this project, it played the following roles:

* **Design and planning proposals**: Initial structure design, phased plans, task prioritization
* **Application logic implementation**: Authentication, data management, UI/UX
* **Feature implementation**: Screen transitions, animations, themes, search, PWA, etc.
* **Testing**: Unit test and E2E test creation and execution
* **Refactoring and optimization**: Responsibility separation, shared utilities, performance improvements
* **Bug fixes and debugging**
* **Documentation generation**: README, ARCHITECTURE.md, design docs, daily reports, task management
* **Production deployment environment setup**

Cursor AI achieved efficient development by understanding developer intentions and proposing appropriate code and plans. This project serves as an example of the possibilities of complete AI-driven coding.

### Development Records

Daily development progress, design discussions, and status can be found in the following documents:

* `doc/`: Daily reports (`doc/daily/`), design documents, task backlog (`doc/bug-feature-memo.md`), etc.

## App Overview & Features

A simple web application for managing reading notes. It retrieves bibliographic information based on book ISBNs and saves and manages them together with notes.

**Technical Details**: For detailed technical specifications, architecture, and implementation details of the project, check [DeepWiki](https://deepwiki.com/nistake0/project-01-bookmemo).

### Main Features

* **Book Management**: Book registration via ISBN scanning and manual input
* **Memo Functionality**: Reading notes, impressions, ★ rating, and tag management per book
* **Book Status Management**: Track reading progress with status changes (積読/読書中/中断/再読中/読了)
* **Status History**: View timeline of book status changes with timestamps
* **Manual Status History**: Add past status changes for existing books with automatic status updates
* **Search Functionality**:
  - **Full-Text Search Tab**: Simple search with LocalStorage cache and rate limiting
  - **Advanced Search Tab**: Detailed filtering by tags, authors, dates, and memo content
  - **Tag Management Tab**: Tag statistics, editing, deletion, and consolidation
* **Statistics Dashboard**: Visualization of reading data (graphs & rankings)
* **PWA Support**: Offline capability, installable
* **Theme & User Settings**: Multiple presets (library-style, slim, etc.), light/dark mode, profile editing (display name, avatar)
* **OCR Functionality**: Text recognition via camera and paste
* **Responsive Design**: Mobile and PC compatible

## Tech Stack

* **Frontend**: React 19 + Vite 6
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
npm run test -- --watch

# Check coverage
npm run test -- --coverage
```

Coverage reports are generated in the `coverage` directory.

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
├── auth/           # Authentication (AuthProvider, Login, Signup)
├── components/     # React components
│   ├── common/    # Common components
│   ├── search/    # Search related
│   └── tags/      # Tag management
├── config/         # Paths, search config, etc.
├── constants/      # Constant definitions
├── hooks/          # Custom hooks
├── pages/          # Page components
├── theme/          # Theme presets, card styles
├── utils/          # Utilities, logging, storage
└── firebase.js     # Firebase configuration
```

## Project Documentation

Detailed documentation for this project can be found in the following locations:

* **ARCHITECTURE.md**: Design, data model, `src/` layout, theme, search, and implementation overview
* **doc/bug-feature-memo.md**: Task backlog, development startup checklist (primary source for priorities)
* **doc/daily/**: Daily development reports (progress, discussions, technical insights)
* **doc/code-review-20260117.md**: Code review report (technical debt, improvement items)

These documents allow you to efficiently understand the project structure and implementation details.

## Known Limitations & Future Issues

- Image attachment is currently not supported (Firebase Storage free tier limitations)
- Some bugs in smartphone camera/barcode reading
- Full-text search is client-side (LocalStorage cache, rate limiting). Server-side search (e.g., Algolia) is unused and a future expansion candidate

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

When starting a new development session:

1. **`doc/bug-feature-memo.md`** — checklist and task priorities
2. **`ARCHITECTURE.md`** — data model, `src/` layout, theme, search, etc.
3. **`.cursorrules`** — required workflow when using Cursor
4. (Optional) **`doc/development-startup-prompts.md`** — archived prompt list

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
