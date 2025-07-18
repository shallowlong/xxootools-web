# XTools

![XTools logo](/public/logo.png)

XTools is a free, open-source, and data-secure toolbox that offers various utilities for everyday file operations. All processing happens locally in your browser, ensuring your data never leaves your device.

⚠️：Please delete the statistical code in index.html before deployment
```
<script defer src="https://stat.deepzero.ai/script.js" data-website-id="6a6c1a00-5ff3-4312-a8a8-bcdc8b16b160"></script>
```
## Features

### Image Tools
- **Compress** - Reduce image file sizes without significant quality loss
- **Convert** - Transform images between different formats (PNG, JPG, WEBP, AVIF, QOI, JXL, etc.)
- **Remove Background** - Automatically remove image backgrounds using AI
- **Mosaic** - Apply mosaic/pixelation effects to images
- **Resize** - Adjust image dimensions and aspect ratios

### SVG Tools
- **Preview** - Real-time SVG code preview and visualization
- **Optimize** - Clean and optimize SVG files
- **Convert** - Transform SVGs to PNG, JPG, PDF formats
- **Raster to Vector** - Convert PNG, JPG to SVG vector graphics

### Screenshot Tools
- **App Store Cover Generator** - Create App Store application covers
- **Xiaohongshu Cover Generator** - Generate Xiaohongshu cover images

### Favicon Tools
- **Converter** - Convert images to favicon formats
- **Generator** - Create favicon packages for websites

### Video Tools
- **Compress** - Reduce video file sizes while maintaining acceptable quality

### Audio Tools
- **Converter** - Convert between different audio formats

### Date Utilities
- **DayJS Utils** - Date manipulation and formatting using DayJS
- **MomentJS Utils** - Date operations with MomentJS
- **Date Utils** - General date conversion and calculation tools

### Text Tools
- **Converter** - Transform text between different formats and encodings (Simplified/Traditional Chinese, etc.)
- **Diff** - Compare and highlight differences between text samples

### Writing Tools
- **Word Count** - Analyze text for word, character, and sentence counts

## Live Demo

Try XTools online at [https://xxoo.tools](https://xxoo.tools)

## Getting Started

### Prerequisites
- Node.js (LTS version recommended)
- PNPM package manager

### Installation

```bash
# Clone the repository
git clone git@github.com:Go7hic/xxootools-web.git

# Navigate to the project directory
cd xxootools-web

# Install dependencies
pnpm install
```

### Development

```bash
# Start the development server
pnpm dev
```

### Building for Production

```bash
# Create a production build
pnpm build

# Preview the build
pnpm preview

# Generate PWA icons
pnpm generate-pwa-icons
```

## Privacy

XTools processes all data locally in your browser. Your files never leave your device, making it a secure option for handling sensitive data.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

XTools is licensed under the MIT License. See the LICENSE file for details.