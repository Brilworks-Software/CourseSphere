# Cloudinary Setup Guide

## Creating the Upload Preset

To upload videos to Cloudinary, you need to create an **unsigned upload preset**. Here's how:

### Step 1: Log in to Cloudinary Dashboard

1. Go to [cloudinary.com](https://cloudinary.com) and log in
2. Navigate to your dashboard

### Step 2: Create Upload Preset

1. Go to **Settings** → **Upload** (or click the gear icon in the top right)
2. Scroll down to **Upload presets** section
3. Click **Add upload preset**
4. Configure the preset:
   - **Preset name**: `course_videos` (or any name you prefer)
   - **Signing mode**: Select **Unsigned** (this is important!)
   - **Folder** (optional): You can organize videos in a folder like `course-videos/`
   - **Resource type**: Select **Video**
   - **Format**: Leave as default or select specific formats
   - **Max file size**: Set to 500MB or your preferred limit
   - **Allowed formats**: mp4, mov, webm (or leave empty for all)

5. Click **Save**

### Step 3: Update Environment Variable

Add the preset name to your `.env.local` file:

```env
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=course_videos
```

(Replace `course_videos` with your actual preset name if different)

### Step 4: Restart Your Development Server

After updating the environment variable, restart your Next.js server:

```bash
npm run dev
```

## Troubleshooting

### Error: "Upload preset not found"

- Make sure the preset name in `.env.local` matches exactly the preset name in Cloudinary
- Ensure the preset is set to **Unsigned** mode
- Check that the preset is **Active** in Cloudinary dashboard

### Error: "File too large"

- Increase the max file size in your Cloudinary upload preset settings
- Or reduce the video file size before uploading

### Error: "CORS error"

- Cloudinary should handle CORS automatically for unsigned uploads
- If you see CORS errors, check your browser console for more details

## Security Notes

- **Never** commit your `.env.local` file to git
- The upload preset should be **unsigned** for client-side uploads
- Consider setting folder restrictions in the preset to organize uploads
- You can set up additional security rules in Cloudinary if needed

