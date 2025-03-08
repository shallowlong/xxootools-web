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
  }
];