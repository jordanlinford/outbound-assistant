# Outbound Assistant

An AI-powered outreach automation tool for entrepreneurs and businesses to automate their outbound campaigns.

## Features

- Email sequence generation with GPT-4
- Campaign management
- Prospect tracking
- Meeting scheduling with Google Calendar and Microsoft Calendar
- Analytics and reporting

## Tech Stack

- Frontend: Next.js 14 with TypeScript and Tailwind CSS
- Backend: FastAPI with Python
- Database: PostgreSQL with Prisma
- Authentication: NextAuth.js
- Email: SendGrid
- Calendar Integration: Google Calendar API and Microsoft Graph API
- AI: OpenAI GPT-4

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/outbound-assistant.git
cd outbound-assistant
```

2. Install dependencies:
```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r api/requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your credentials.

4. Run the development servers:
```bash
# Run both frontend and backend
npm run dev

# Or run them separately
npm run dev:frontend  # Next.js frontend
npm run dev:backend   # FastAPI backend
```

The frontend will be available at http://localhost:3000 and the backend at http://localhost:8000.

## Deployment

1. Push your code to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Connect your repository to Vercel:
   - Go to [Vercel](https://vercel.com)
   - Import your repository
   - Add the following environment variables:
     - `OPENAI_API_KEY`
     - `GOOGLE_CLIENT_ID`
     - `GOOGLE_CLIENT_SECRET`
     - `NEXTAUTH_URL`
     - `NEXTAUTH_SECRET`
     - `DATABASE_URL`
     - `SMTP_HOST`
     - `SMTP_PORT`
     - `SMTP_USER`
     - `SMTP_PASSWORD`

3. Deploy:
   - Vercel will automatically deploy your application
   - The frontend will be deployed to Vercel
   - The backend API will be deployed as serverless functions

## Testing the End-to-End Flow

1. Connect your email:
   - Click "Connect Email" on the dashboard
   - Choose between Google or Microsoft
   - Authorize the application

2. Create a campaign:
   - Click "New Campaign"
   - Enter campaign details
   - Add prospects
   - Select email template
   - Review and launch

3. Monitor progress:
   - View campaign status
   - Track email opens and replies
   - Schedule meetings with interested prospects

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
