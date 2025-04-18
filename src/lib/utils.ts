
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Determines if text should be light or dark based on background color
 * @param backgroundColor Hex color code (e.g., #FFFFFF)
 * @returns 'light' or 'dark'
 */
export function getContrastText(backgroundColor: string): 'light' | 'dark' {
  // Remove the # if it exists
  const hex = backgroundColor.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return light for dark backgrounds, dark for light backgrounds
  return luminance > 0.5 ? 'dark' : 'light';
}