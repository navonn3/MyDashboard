# Application Management Dashboard

A full-stack dashboard for managing applications, tracking ideas, and generating AI-powered implementation prompts.

## Features

- **Application Management**: Track all your applications with links to GitHub, databases, frontend platforms, and live sites
- **Multi-step Add Wizard**: Easy 4-step wizard for adding new applications
- **Notes & Ideas System**: Rich text notes and feature ideas for each application
- **Global Ideas Box**: Capture new application ideas that can be converted to apps
- **Platform Status**: Check the online/offline status of your applications
- **AI Prompt Generator**: Generate implementation prompts using Claude AI
- **Dark/Light Mode**: Toggle between themes
- **RTL Support**: Full Hebrew language and RTL layout support
- **Export Functionality**: Export all data as JSON for backup

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Zustand for state management
- Vite for development and building
- Lucide React for icons
- React Hot Toast for notifications

### Backend
- Express.js with TypeScript
- SQLite with better-sqlite3
- Rate limiting for API protection

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
cd app-dashboard
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Initialize the database with sample data:
```bash
npm run db:seed
```

4. Start the server:
```bash
npm run dev
```

5. In a new terminal, install client dependencies:
```bash
cd client
npm install
```

6. Start the client:
```bash
npm run dev
```

7. Open http://localhost:5173 in your browser

## Project Structure

```
app-dashboard/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ApplicationTable.tsx
│   │   │   ├── AddAppWizard.tsx
│   │   │   ├── AppDetailsModal.tsx
│   │   │   ├── NotesPanel.tsx
│   │   │   ├── IdeasList.tsx
│   │   │   ├── GlobalIdeasBox.tsx
│   │   │   ├── PromptModal.tsx
│   │   │   ├── SettingsModal.tsx
│   │   │   └── ...
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API services
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utility functions
│   │   └── App.tsx
│   └── package.json
├── server/                    # Express backend
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   ├── services/          # Business logic
│   │   ├── database.ts        # SQLite configuration
│   │   ├── types.ts           # TypeScript types
│   │   └── index.ts           # Server entry point
│   └── package.json
└── README.md
```

## API Endpoints

### Applications
- `GET /api/applications` - List all applications
- `POST /api/applications` - Create new application
- `GET /api/applications/:id` - Get single application
- `PUT /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Delete application
- `GET /api/applications/:id/status` - Check platform status

### Notes
- `GET /api/notes/:appId` - Get notes for an application
- `PUT /api/notes/:appId` - Update notes

### Ideas
- `GET /api/ideas/app/:appId` - Get ideas for an application
- `POST /api/ideas/app/:appId` - Create idea for application
- `PUT /api/ideas/:id` - Update idea
- `DELETE /api/ideas/:id` - Delete idea
- `GET /api/ideas/global` - Get global ideas
- `POST /api/ideas/global` - Create global idea
- `POST /api/ideas/global/:id/convert` - Convert to application

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings/:key` - Update setting
- `DELETE /api/settings/:key` - Delete setting

### Prompt Generator
- `POST /api/generate-prompt` - Generate AI prompt
- `GET /api/generate-prompt/history/:appId` - Get prompt history

## Configuration

### Environment Variables

The server uses the following defaults (can be overridden with environment variables):

- `PORT` - Server port (default: 3001)

### API Keys

To use the AI Prompt Generator feature:

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Open Settings in the dashboard
3. Enter your Anthropic API key (starts with `sk-ant-`)
4. The key is encrypted and stored securely

## Keyboard Shortcuts

- `Ctrl+N` - New Application
- `Ctrl+,` - Open Settings
- `Escape` - Close Modal

## Development

### Running in Development Mode

```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

### Building for Production

```bash
# Build server
cd server
npm run build

# Build client
cd client
npm run build
```

## Database Schema

The application uses SQLite with the following tables:

- `applications` - Main application data
- `app_notes` - Rich text notes per application
- `app_ideas` - Feature ideas per application
- `global_ideas` - New application ideas
- `settings` - User settings and API keys
- `generated_prompts` - History of AI-generated prompts

## License

MIT
