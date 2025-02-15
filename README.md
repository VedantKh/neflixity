# Netflixity

A modern movie discovery platform with semantic search capabilities powered by OpenAI embeddings. Built with Next.js and Flask, this application provides an intuitive interface for finding movies based on natural language queries.

[Deployed Website](https://neflixity.vercel.app/)
![Example](screenshot.png)

## Features

- 🎬 Semantic movie search using OpenAI embeddings
- 🔍 Uses pgvector with HNSW indexing under the hood

## Project Structure

```
client/
├── src/
│ ├── app/         # Next.js app directory
│ │ ├── api/       # API routes
│ │ └── page.tsx   # Main page
│ ├── components/  # React components
│ ├── scripts/     # Data processing scripts
│ ├── types/       # TypeScript definitions
│ └── utils/       # Utility functions
```

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- OpenAI API key
- TMDb API key (for data updates)

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/netflixity.git
   cd netflixity
   ```

2. Install dependencies:

   ```bash
   cd client
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the client directory with:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Database**: Supabase
- **AI/ML**: OpenAI Embeddings

## Note

- This project inherits from the [Suflix repo](https://github.com/VedantKh/suflix)
