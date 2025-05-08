declare module '@/components/icon-picker' {
  export interface IconPickerProps {
    onSelect: (iconUrl: string) => void;
  }

  export const IconPicker: React.FC<IconPickerProps>;
} 