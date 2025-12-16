# Online Course Platform

A modern, full-stack online course platform built with Next.js, Supabase, and Cloudinary. Features role-based access control, video upload and playback, and dark/light mode support.

## Features

- 🔐 **Authentication & Authorization**: Secure email/password authentication with role-based access control
- 👥 **Three User Roles**:
  - **Super Admin**: Platform-wide management and analytics
  - **Admin/Instructor**: Course creation and management
  - **Student**: Course browsing and enrollment
- 📹 **Video Management**: Upload videos to Cloudinary and stream them securely
- 🎨 **Dark/Light Mode**: Theme customization with persistence
- 📊 **Dashboards**: Role-specific dashboards with analytics
- 📱 **Responsive Design**: Works on mobile, tablet, and desktop

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Video Hosting**: Cloudinary
- **Theme**: next-themes

## Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- A Cloudinary account

## Setup Instructions

### 1. Clone and Install

```bash
cd course
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Get your project URL and anon key from Settings > API

### 3. Set Up Cloudinary

1. Create an account at [cloudinary.com](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret from Settings > Security
3. **Create an unsigned upload preset** (see [CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md) for detailed instructions):
   - Go to Settings > Upload > Upload presets
   - Create a new preset named `course_videos` (or your preferred name)
   - Set it to **Unsigned** mode
   - Set resource type to **Video**
   - Set max file size to 500MB
4. Add the preset name to your `.env.local` file

### 4. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and replace the placeholder values with your actual credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=course_videos
```

**Important**: Make sure the `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` value matches the name of the upload preset you created in Cloudinary.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following main tables:

- **profiles**: User profiles with role and theme preferences
- **courses**: Course information
- **lessons**: Individual lessons with video URLs
- **enrollments**: Student course enrollments

See `supabase/schema.sql` for the complete schema with RLS policies.

## User Roles

### Super Admin
- View all users and courses
- Platform-wide analytics
- Manage user roles
- Enable/disable courses

### Admin/Instructor
- Create and manage own courses
- Upload course videos
- View course-specific analytics

### Student
- Browse available courses
- Enroll in courses
- Watch enrolled course videos

## Creating Your First Super Admin

To create a super admin user:

1. Sign up normally through the signup page
2. In Supabase Dashboard, go to Authentication > Users
3. Find your user and note their ID
4. In SQL Editor, run:

```sql
UPDATE profiles
SET role = 'super_admin'
WHERE id = 'your-user-id';
```

## Video Upload

Videos are uploaded directly to Cloudinary from the browser. Make sure:

1. You have created an **unsigned upload preset** in Cloudinary (see [CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md))
2. The upload preset name in `.env.local` matches the preset name in Cloudinary
3. The preset is set to **Unsigned** mode (required for client-side uploads)
4. Maximum file size is 500MB (configurable in Cloudinary upload preset settings)
5. The preset resource type is set to **Video**

## Project Structure

```
course/
├── app/
│   ├── api/              # API routes
│   ├── courses/           # Course browsing pages
│   ├── dashboard/         # Role-specific dashboards
│   ├── login/             # Authentication pages
│   └── signup/
├── components/            # React components
├── lib/                   # Utilities and helpers
│   ├── supabase/         # Supabase clients
│   ├── auth.ts           # Authentication helpers
│   └── types.ts          # TypeScript types
├── supabase/
│   └── schema.sql        # Database schema
└── middleware.ts         # Next.js middleware
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set all environment variables in your hosting platform's dashboard.

## Security Notes

- Row Level Security (RLS) is enabled on all tables
- API routes verify user roles before allowing operations
- Video URLs are stored securely in the database
- Theme preferences are stored per user

## Troubleshooting

### Videos not playing
- Check that Cloudinary credentials are correct
- Verify the video public ID is stored correctly in the database
- Check browser console for errors

### Authentication issues
- Verify Supabase URL and keys are correct
- Check that RLS policies are set up correctly
- Ensure the `handle_new_user` trigger is created

### Upload failures
- Check Cloudinary upload preset configuration
- Verify CORS settings in Cloudinary
- Check file size limits

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
