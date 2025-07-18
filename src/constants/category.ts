import { ToolCategory } from '@/types/tool';

export const TOOL_CATEGORY: ToolCategory[] = [
  
  {
    id: 'image',
    name: 'image',
    tools: [
      {
        id: 'image-compress',
        name: 'image-compress',
        description: 'image-compress',
        icon: 'ImageMinus',
        path: '/image/image-compress'
      },
      {
        id: 'image-converter',
        name: 'image-converter',
        description: 'image-converter',
        icon: 'Image',
        path: '/image/image-converter'
      },
      {
        id: 'image-removebg',
        name: 'image-removebg',
        description: 'image-removebg',
        icon: 'Image',
        path: '/image/image-removebg'
      },
      {
        id: 'image-mosaic',
        name: 'image-mosaic',
        description: 'image-mosaic',
        icon: 'Grid',
        path: '/image/image-mosaic'
      },
      {
        id: 'image-resize',
        name: 'image-resize',
        description: 'image-resize',
        icon: 'Grid',
        path: '/image/image-resize'
      }
    ]
  },
  {
    id: 'svg',
    name: 'svg',
    tools: [
      {
        id: 'svg-preview',
        name: 'svg-preview',
        description: 'svg-preview',
        icon: 'FileVector',
        path: '/svg/svg-preview'
      },
      {
        id: 'svg-to-png',
        name: 'svg-to-png',
        description: 'svg-to-png',
        icon: 'ImageIcon',
        path: '/svg/svg-to-png'
      },
      {
        id: 'svg-to-jpg',
        name: 'svg-to-jpg',
        description: 'svg-to-jpg',
        icon: 'Image',
        path: '/svg/svg-to-jpg'
      },
      {
        id: 'svg-to-pdf',
        name: 'svg-to-pdf',
        description: 'svg-to-pdf',
        icon: 'FileText',
        path: '/svg/svg-to-pdf'
      },
      {
        id: 'png-to-svg',
        name: 'png-to-svg',
        description: 'png-to-svg-desc',
        icon: 'FileVector',
        path: '/svg/png-to-svg'
      },
      {
        id: 'jpg-to-svg',
        name: 'jpg-to-svg',
        description: 'jpg-to-svg-desc',
        icon: 'FileVector',
        path: '/svg/jpg-to-svg'
      },
      {
        id: 'svg-optimizer',
        name: 'svg-optimizer',
        description: 'svg-optimizer',
        icon: 'FileVector',
        path: '/svg/svg-optimizer'
      }
    ]
  },
  {
    id: 'favicon',
    name: 'favicon',
    tools: [
      {
        id: 'favicon-converter',
        name: 'favicon-converter',
        description: 'favicon-converter',
        icon: 'Globe',
        path: '/favicon/converter'
      },
      {
        id: 'favicon-generator',
        name: 'favicon-generator',
        description: 'favicon-generator',
        icon: 'Palette',
        path: '/favicon/generator'
      }
    ]
  },
  {
    id: 'video',
    name: 'video',
    tools: [
      {
        id: 'video-compress',
        name: 'video-compress',
        description: 'video-compress',
        icon: 'FileVideo',
        path: '/video/video-compress'
      }
    ]
  },
  {
    id: 'audio',
    name: 'audio',
    tools: [
      {
        id: 'audio-converter',
        name: 'audio-converter',
        description: 'audio-converter',
        icon: 'FileAudio',
        path: '/audio/audio-converter'
      }
    ]
  },
  {
    id: 'date',
    name: 'date',
    tools: [
      {
        id: 'dayjs-utils',
        name: 'dayjs-utils',
        description: 'dayjs-utils',
        icon: 'Calendar',
        path: '/date/dayjs-utils'
      },
      {
        id: 'moment-utils',
        name: 'moment-utils',
        description: 'moment-utils',
        icon: 'CalendarDays',
        path: '/date/moment-utils'
      },
      {
        id: 'date-utils',
        name: 'date-utils',
        description: 'date-utils',
        icon: 'CalendarClock',
        path: '/date/date-utils'
      }
    ]
  },
  {
    id: 'text',
    name: 'text',
    tools: [
      {
        id: 'text-converter',
        name: 'text-converter',
        description: 'text-converter',
        icon: 'FileText',
        path: '/text/text-converter'
      },
      {
        id: 'text-diff',
        name: 'text-diff',
        description: 'text-diff',
        icon: 'FileDiff',
        path: '/text/text-diff'
      }
    ]
  },
  {
    id: 'writer',
    name: 'writer',
    tools: [
      {
        id: 'word-count',
        name: 'word-count',
        description: 'word-count',
        icon: 'Pencil',
        path: '/writer/word-count'
      }
    ]
  },
  {
    id: 'screenshot',
    name: 'screenshot',
    tools: [
      {
        id: 'appstore-cover',
        name: 'appstore-cover',
        description: 'AppStore 封面生成',
        icon: 'Image',
        path: '/screenshot/appstore-cover'
      },
      {
        id: 'xiaohongshu-cover',
        name: 'xiaohongshu-cover',
        description: 'xiaohongshu-cover',
        icon: 'Heart',
        path: '/screenshot/xiaohongshu-cover'
      }
    ]
  }
];