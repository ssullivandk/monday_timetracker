This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Time Tracker App

A time tracking application with Monday.com integration for saving time entries to Monday boards.

### Features

- ⏱️ Timer functionality with start/pause/stop controls
- 📊 Time entry management and display
- 🔗 Monday.com API integration for board management
- 💾 SQLite database for local time tracking

## Monday.com Integration

This app includes Monday.com API integration to fetch boards from a specific workspace and eventually save time entries as subitems.

### Setup

1. **Install Dependencies**

   ```bash
   npm install @mondaydotcomorg/api
   ```

2. **Environment Variables**
   Create a `.env.local` file in the root directory:

   ```env
   MONDAY_API_KEY=your_monday_api_token_here
   ```

3. **Get Monday API Key**
   - Go to your Monday.com account
   - Navigate to Admin → API
   - Generate a new API token
   - Copy the token to your `.env.local` file

### API Endpoints

#### GET /api/boards

Fetches all boards from the specified Monday workspace.

**Response:**

```json
{
  "success": true,
  "workspaceId": 9960133,
  "boards": [
    {
      "id": "123456789",
      "name": "Project Board",
      "description": "Main project tracking",
      "board_kind": "public",
      "state": "active",
      "updated_at": "2025-10-30T07:23:05.441Z",
      "workspace": {
        "id": "9960133",
        "name": "Main Workspace"
      },
      "columns": [...],
      "groups": [...]
    }
  ],
  "count": 1
}
```

**Error Responses:**

- `401`: Invalid Monday API key
- `403`: Insufficient permissions for Monday API
- `500`: Server error or API errors

### Testing the Integration

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Test the boards endpoint:

   ```bash
   curl http://localhost:3000/api/boards
   ```

3. Expected response (if no boards in workspace):

   ```json
   {"success":true,"workspaceId":9960133,"boards":[],"count":0}
   ```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
