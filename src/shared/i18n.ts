import { STRINGS_VI } from '@/shared/strings.vi';

export function t(key: string): string {
  const text = STRINGS_VI[key];
  if (text !== undefined) {
    return text;
  }
  return key;
}
