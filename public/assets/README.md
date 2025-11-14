# Assets Folder

This folder contains all static assets for the application.

## Folder Structure

```
assets/
├── videos/     # Video files (MP4, WebM, etc.)
├── images/     # Image files (PNG, JPG, SVG, etc.)
└── icons/      # Icon files (SVG, PNG, etc.)
```

## Usage

### Videos
- Place your video files in the `videos/` folder
- Supported formats: MP4, WebM
- Default video path: `/assets/videos/demo-video.mp4`
- The video component automatically looks for videos in this location

### Images
- Place your image files in the `images/` folder
- Supported formats: PNG, JPG, JPEG, SVG, WebP
- Reference in code: `/assets/images/your-image.jpg`

### Icons
- Place your icon files in the `icons/` folder
- Supported formats: SVG, PNG
- Reference in code: `/assets/icons/your-icon.svg`

## Example

To use a video in the VideoSection component:

1. Add your video file to `public/assets/videos/my-video.mp4`
2. The component will automatically use it if it's named `demo-video.mp4`
3. Or pass it as a prop: `<VideoSection videoSrc="/assets/videos/my-video.mp4" />`

