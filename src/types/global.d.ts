interface File {
  new(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag): File;
}

interface Window {
  File: {
    new(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag): File;
  };
} 