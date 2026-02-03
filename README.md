# Pusselmagi 🧩

An AI-powered puzzle game built with Google Gemini AI. Solve puzzles with intelligent hints and guidance.

## Features

- **AI-Powered Hints**: Get intelligent puzzle-solving assistance
- **Modern Interface**: Clean and responsive UI
- **Easy Setup**: Simple configuration with API keys
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API key

### Installation

```bash
npm install
```

### Run Locally

```bash
# Set your Gemini API key in .env.local
GEMINI_API_KEY=your_gemini_api_key

npm run dev
```

### Self-Hosted Setup

This application can be self-hosted easily:

1. **Get Your API Key**
   - Go to [Google AI Studio](https://ai.google.dev)
   - Create a new API key

2. **Set Environment Variables**
   ```bash
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Run the Application**
   ```bash
   npm run dev
   ```

### Build for Production

```bash
npm run build
```

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Google Gemini AI** - AI capabilities
- **shadcn/ui** - Components
- **Tailwind CSS** - Styling

## License

MIT
