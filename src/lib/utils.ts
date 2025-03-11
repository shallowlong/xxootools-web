import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const guarded = <T, U extends T>(data: T, predicate: (input: NonNullable<T>) => U | false) => {
  const guard = (value: T): value is U => value && predicate(value) !== false
  if (guard(data)) return data
  return null
}

export async function isGpuSupported(): Promise<boolean> {
  if (!('gpu' in navigator)) {
    return false
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adapter = await (navigator as any).gpu.requestAdapter()
    if (!adapter) {
      console.error("Couldn't request WebGPU adapter.")
      return false
    }
  } catch (e) {
    console.error(e)
  }
  return true
}