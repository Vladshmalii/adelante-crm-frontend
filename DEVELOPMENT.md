# Adelante CRM - Development Guide

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment variables:**
   Create a `.env` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   NEXT_PUBLIC_USE_MOCK_DATA=true
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

- `src/app/` - Next.js App Router (pages and layouts)
- `src/features/` - Domain-driven modules (Calendar, Overview, Clients, etc.)
  - `components/` - Module-specific components
  - `modals/` - Modals for specific features
  - `data/` - Mock data and constants
  - `types.ts` - TypeScript interfaces
- `src/shared/` - Global reusable components, hooks, and providers
- `src/lib/` - API clients and utility libraries
- `src/stores/` - Global state management (Zustand)

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Vanilla CSS + Tailwind-like utility patterns
- **State Management:** Zustand
- **Icons:** Lucide React
- **Animations:** Framer Motion / CSS Transitions

## 📡 Mock Data Mode

The project is currently configured to work with mock data for faster UI development. 
Toggle `NEXT_PUBLIC_USE_MOCK_DATA` in `.env` to switch between real API and mocks.

Most mock data is located in `src/features/[feature]/data/`.
