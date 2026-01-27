'use client'

import { useState, useEffect } from 'react'
import { AdvancedVideo } from '@cloudinary/react'
import { Cloudinary } from '@cloudinary/url-gen'
import type { Lesson } from '@/lib/types'

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''

const cld = new Cloudinary({
  cloud: {
    cloudName: cloudName,
  },
})

interface VideoPlayerProps {
  lesson: Lesson
  lessons: Lesson[]
  courseId: string
}

export function VideoPlayer({ lesson, lessons, courseId }: VideoPlayerProps) {
  const [currentLesson, setCurrentLesson] = useState(lesson)

  useEffect(() => {
    setCurrentLesson(lesson)
  }, [lesson])

  // Extract public ID from URL or use as-is
  const getPublicId = (url: string) => {
    if (!url) return ''
    
    // If it's already a Cloudinary URL, extract public ID
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/')
      const videoIndex = parts.findIndex((p) => p === 'video' || p === 'upload')
      if (videoIndex !== -1) {
        const publicId = parts.slice(videoIndex + 2).join('/').split('.')[0]
        return publicId
      }
    }
    // Otherwise, assume it's already a public ID
    return url
  }

  const publicId = getPublicId(currentLesson.video_url)

  if (!publicId || !cloudName) {
    return (
      <div className="aspect-video bg-gray-900 flex items-center justify-center rounded-lg">
        <p className="text-white">Video not available</p>
      </div>
    )
  }

  const video = cld.video(publicId)

  return (
    <div>
      <div className="aspect-video bg-gray-900 rounded-t-lg overflow-hidden mb-4">
        <AdvancedVideo
          cldVid={video}
          controls
          className="w-full h-full"
        />
      </div>
      <div className="mt-4 p-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {currentLesson.title}
        </h2>
        {/* <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Next Lessons:
        </h3>
        <div className="space-y-2">
          {lessons
            .filter((l) => l.id !== currentLesson.id)
            .slice(0, 3)
            .map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setCurrentLesson(l)
                  window.history.pushState(
                    {},
                    '',
                    `/courses/${courseId}?lesson=${l.id}`
                  )
                }}
                className="block w-full text-left p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                {l.title}
              </button>
            ))}
        </div> */}
      </div>
    </div>
  )
}

