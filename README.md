# HR Recruitment AI Agent

A modern, futuristic AI-powered recruitment platform built with Next.js, TypeScript, TailwindCSS, and Supabase. This platform integrates with N8N workflows to automate the recruitment process using AI.

## 🚀 Features

- **Modern Authentication**: Secure sign-up and sign-in with Supabase Auth
- **AI-Powered Screening**: Automated resume analysis and candidate matching
- **Real-time Dashboard**: Live metrics and analytics for recruitment processes
- **N8N Integration**: Seamless workflow automation with webhook endpoints
- **Responsive Design**: Beautiful, futuristic UI that works on all devices
- **TypeScript**: Full type safety throughout the application

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: TailwindCSS with custom design system
- **UI Components**: Radix UI primitives with custom styling
- **Animations**: Framer Motion for smooth transitions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Workflow Automation**: N8N integration via webhooks
- **Forms**: React Hook Form with Zod validation

## 🎨 Design System

- **Font**: Figtree (Light 300, Medium 500, SemiBold 600)
- **Colors**: 
  - Primary: #E51AE5 (Magenta)
  - Secondary: #00C2D4 (Cyan)
  - Background: #FFFFFF (White)
  - Text: #000000 (Black)
- **Typography**: 
  - Headings: Figtree SemiBold 600, 45px
  - Sub-headings: Figtree Medium 500, 39px
  - Body text: Figtree Light 300, 21px

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- N8N instance (for workflow automation)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd hr-recruitment-ai-agent
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Set up environment variables

Copy the example environment file:

```bash
cp env.example .env.local
```

Update the following variables in `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# N8N Webhook URLs
N8N_WEBHOOK_URL=your_n8n_webhook_url_for_outgoing_data
N8N_INCOMING_WEBHOOK_URL=your_n8n_webhook_url_for_incoming_data
```

### 4. Set up Supabase Database

1. Create a new Supabase project
2. Run the SQL schema from `database-schema.sql` in your Supabase SQL editor
3. Enable Row Level Security (RLS) policies as defined in the schema

### 5. Run the development server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔄 N8N Workflow Integration

### Outgoing Webhook (To N8N)
When a job posting is created, the system sends data to N8N via:
- **Endpoint**: `/api/webhooks/n8n-outgoing`
- **Payload**: Job posting details, company information, and interview details

### Incoming Webhook (From N8N)
N8N sends processed applicant data back via:
- **Endpoint**: `/api/webhooks/n8n-incoming`
- **Payload**: Applicant analysis results, matching scores, and status updates

## 📊 Database Schema

The application uses the following main tables:

- **companies**: Company information and HR details
- **job_postings**: Job descriptions and requirements
- **applicants**: Candidate information and AI analysis results
- **recruitment_analytics**: Aggregated metrics and processing status

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📚 Storybook

```bash
# Start Storybook
npm run storybook

# Build Storybook
npm run build-storybook
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run storybook` - Start Storybook

## 📱 Features Overview

### Authentication
- Secure sign-up and sign-in
- Protected routes and API endpoints
- User session management

### Company Setup
- Modern form for company and job details
- Validation with Zod schemas
- Skills management with tags
- Interview scheduling integration

### Dashboard
- Real-time metrics and analytics
- Job posting management
- AI processing status indicators
- Responsive design with animations

### AI Integration
- Automated resume screening
- Candidate matching scores
- Status categorization (shortlisted/rejected/flagged)
- Reasoning explanations from AI

## 🎯 User Flow

1. **Sign Up/In**: User creates account or signs in
2. **Company Setup**: Fill company and job details form
3. **Job Creation**: System creates job posting and sends to N8N
4. **AI Processing**: N8N workflow processes applications
5. **Dashboard Monitoring**: Real-time updates on recruitment progress
6. **Analytics**: View comprehensive metrics and insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@example.com or create an issue in the repository.

---

Built with ❤️ using modern web technologies and AI automation.
# N8N-WORKFLOW
# RECRUITMENT-HIRING-AGENT
