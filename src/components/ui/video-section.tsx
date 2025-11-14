'use client'

import VideoPlayerPro from './video-player-pro'

interface VideoSectionProps {
  videoSrc?: string
  poster?: string
  title?: string
  description?: string
}

export default function VideoSection({
  videoSrc = '/assets/videos/demo-video.mp4',
  poster,
  title = "See It in Action",
  description = "Watch how our AI-powered platform transforms your hiring process"
}: VideoSectionProps) {

  return (
    <section className="relative w-full bg-black pt-2 sm:pt-4 md:pt-12 pb-20 px-4 md:pb-24">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        {(title || description) && (
          <div className="text-center mb-12 md:mb-16">
            {title && (
              <h2 className="text-[27px] sm:text-[57px] md:text-[69px] font-extralight font-figtree leading-[1.05] tracking-tight text-white mb-4">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm sm:text-base md:text-lg text-white/70 max-w-2xl mx-auto">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Video Container with Glow Effect */}
        <div className="relative">
          {/* Glow Effect - Outer Layer */}
          <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r opacity-75 blur-xl animate-pulse" style={{ background: 'linear-gradient(to right, rgba(74, 13, 186, 0.8), rgba(74, 13, 186, 0.6), rgba(74, 13, 186, 0.8))' }} />
          {/* Glow Effect - Inner Layer */}
          <div className="absolute -inset-0.5 rounded-[32px] bg-gradient-to-r opacity-50 blur-lg animate-pulse" style={{ animationDelay: '0.5s', background: 'linear-gradient(to right, rgba(74, 13, 186, 0.6), rgba(74, 13, 186, 0.4), rgba(74, 13, 186, 0.6))' }} />

          {/* Video Box - Same styling as before */}
          <div className="relative rounded-[32px] overflow-hidden bg-black shadow-2xl border" style={{ borderColor: 'rgba(74, 13, 186, 0.3)' }}>
            <div className="aspect-video sm:aspect-video h-[280px] sm:h-auto w-full relative group">
              {videoSrc ? (
                <VideoPlayerPro 
                  src={videoSrc} 
                  poster={poster}
                  className="w-full h-full rounded-[32px]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                  <div className="text-center p-8">
                    <svg
                      className="w-16 h-16 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: '#4a0dba' }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-white/60 text-sm md:text-base">
                      Video placeholder
                    </p>
                    <p className="text-white/40 text-xs mt-2">
                      Add your video to /public/assets/videos/
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

