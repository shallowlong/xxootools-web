import { ToolCategory } from '@/types/tool';

export const toolCategories: ToolCategory[] = [
  {
    id: 'text',
    name: '文本工具',
    tools: [
      {
        id: 'text-converter',
        name: '文本转换',
        description: '大小写转换、简繁转换等',
        icon: 'FileText',
        path: '/tools/text-converter'
      },
      {
        id: 'text-diff',
        name: '文本对比',
        description: '对比两段文本的差异',
        icon: 'FileText',
        path: '/tools/text-diff'
      }
    ]
  },
  {
    id: 'image',
    name: '图片工具',
    tools: [
      {
        id: 'image-compress',
        name: '图片压缩',
        description: '压缩图片文件大小',
        icon: 'Image',
        path: '/tools/image-compress'
      },
      {
        id: 'image-converter',
        name: '图片格式转换',
        description: '转换图片格式',
        icon: 'Image',
        path: '/tools/image-converter'
      }
    ]
  },
  {
    id: 'video',
    name: '视频工具',
    tools: [
      {
        id: 'video-compress',
        name: '视频压缩',
        description: '压缩视频文件大小',
        icon: 'FileVideo',
        path: '/tools/video-compress'
      }
    ]
  },
  {
    id: 'audio',
    name: '音频工具',
    tools: [
      {
        id: 'audio-converter',
        name: '音频转换',
        description: '转换音频格式',
        icon: 'FileAudio',
        path: '/tools/audio-converter'
      }
    ]
  }
];