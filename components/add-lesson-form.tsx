'use client'

import { useState } from 'react'
import { Plus, Upload } from 'lucide-react'

export function AddLessonForm({ courseId }: { courseId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoFile) {
      setError('Please select a video file')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Upload video to Cloudinary
      const formData = new FormData()
      formData.append('file', videoFile)
      
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'course_videos'
      formData.append('upload_preset', uploadPreset)

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      if (!cloudName) {
        throw new Error('Cloudinary cloud name not configured. Please check your .env.local file.')
      }

      if (!uploadPreset) {
        throw new Error('Cloudinary upload preset not configured. Please set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env.local file.')
      }

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        const errorMessage = errorData.error?.message || 'Failed to upload video'
        throw new Error(`Upload failed: ${errorMessage}. Please check that the upload preset "${uploadPreset}" exists in your Cloudinary account.`)
      }

      const uploadData = await uploadResponse.json()

      // Create lesson
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_id: courseId,
          title,
          video_url: uploadData.public_id,
          duration: uploadData.duration ? Math.round(uploadData.duration) : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create lesson')
      }

      // Reset form
      setTitle('')
      setVideoFile(null)
      setIsOpen(false)
      window.location.reload()
    } catch (err: any) {
      setError(err.message)
      setUploading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <Plus className="h-5 w-5" />
        <span>Add Lesson</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Add New Lesson
        </h2>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mb-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="lesson-title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Lesson Title *
            </label>
            <input
              id="lesson-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Enter lesson title"
            />
          </div>

          <div>
            <label
              htmlFor="video-file"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Video File *
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="video-file"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    MP4, MOV, WEBM (MAX. 500MB)
                  </p>
                </div>
                <input
                  id="video-file"
                  type="file"
                  accept="video/mp4,video/mov,video/webm"
                  required
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
            {videoFile && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Selected: {videoFile.name}
              </p>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Add Lesson'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setTitle('')
                setVideoFile(null)
                setError(null)
              }}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

