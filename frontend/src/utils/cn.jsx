import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Joins conditional class names and resolves Tailwind conflicts (the last one wins). */
export const cn = (...inputs) => twMerge(clsx(inputs));
