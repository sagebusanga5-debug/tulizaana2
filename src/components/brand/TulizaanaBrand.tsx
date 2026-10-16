import React, { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../../utils/storage';

export const BRAND_ICON_STORAGE_KEY = STORAGE_KEYS.customBrandIcon;
export const BRAND_ICON_EVENT = 'tlz_brand_icon_updated';

/**
 * Returns the currently published brand icon URL (data URL or external URL) or null
 */
export function getPublishedBrandIcon(): string | null {
  try {
    return localStorage.getItem(BRAND_ICON_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Publishes a new official brand icon across the entire application in real time
 */
export function publishBrandIcon(iconUrl: string): void {
  try {
    localStorage.setItem(BRAND_ICON_STORAGE_KEY, iconUrl);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(BRAND_ICON_EVENT, { detail: { iconUrl } }));
    }
  } catch (err) {
    console.error('Failed to publish brand icon:', err);
  }
}

/**
 * Resets the brand icon to the original default vector SVG
 */
export function resetBrandIcon(): void {
  try {
    localStorage.removeItem(BRAND_ICON_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(BRAND_ICON_EVENT, { detail: { iconUrl: null } }));
    }
  } catch (err) {
    console.error('Failed to reset brand icon:', err);
  }
}

/**
 * React hook to listen to published brand icon updates across all components
 */
export function useBrandIcon(): { customIcon: string | null; isCustom: boolean } {
  const [customIcon, setCustomIcon] = useState<string | null>(getPublishedBrandIcon);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ iconUrl: string | null }>;
      if (customEvent.detail && customEvent.detail.iconUrl !== undefined) {
        setCustomIcon(customEvent.detail.iconUrl);
      } else {
        setCustomIcon(getPublishedBrandIcon());
      }
    };

    window.addEventListener(BRAND_ICON_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(BRAND_ICON_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return { customIcon, isCustom: Boolean(customIcon) };
}

interface IconProps {
  className?: string;
  size?: number | string;
  forceDefault?: boolean;
}

export const TulizaanaIcon: React.FC<IconProps> = ({
  className = 'w-8 h-8',
  size,
  forceDefault = false,
}) => {
  const { customIcon } = useBrandIcon();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [customIcon]);

  const style = size ? { width: size, height: size } : undefined;

  // If a custom published icon is available and valid, render it with perfect scaling
  if (customIcon && !forceDefault && !hasError) {
    return (
      <img
        src={customIcon}
        alt="Logo icône Tulizaana"
        className={`shrink-0 object-contain aspect-square select-none transition-transform ${className}`}
        style={style}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 1000 1000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${className}`}
      style={style}
      aria-label="Logo icône Tulizaana"
    >
      <defs>
        <linearGradient id="tulizaanaIconGrad" x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#00F0D0" />
          <stop offset="50%" stopColor="#00D2C4" />
          <stop offset="100%" stopColor="#00B4D8" />
        </linearGradient>
      </defs>

      {/* Outer Circle Ring */}
      <circle
        cx="500"
        cy="500"
        r="460"
        stroke="url(#tulizaanaIconGrad)"
        strokeWidth="52"
        fill="none"
      />

      {/* Left Ring */}
      <circle
        cx="160"
        cy="500"
        r="64"
        stroke="url(#tulizaanaIconGrad)"
        strokeWidth="36"
        fill="none"
      />

      {/* Main Center & Right Silhouette Emblem */}
      <path
        d="M 265 110
           L 545 55
           L 545 680
           C 545 700, 560 710, 580 710
           L 900 690
           C 840 840, 710 935, 540 955
           C 430 965, 330 915, 265 830
           C 265 780, 265 600, 265 110 Z"
        fill="url(#tulizaanaIconGrad)"
      />

      {/* Top Right Arc Accent */}
      <path
        d="M 545 55
           C 730 65, 885 185, 940 350
           L 850 420
           C 800 300, 680 200, 545 180 Z"
        fill="url(#tulizaanaIconGrad)"
      />

      {/* Right Head Circle / Dot */}
      <circle cx="710" cy="360" r="142" fill="url(#tulizaanaIconGrad)" />
    </svg>
  );
};

interface LogoProps {
  className?: string;
  iconClassName?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const TulizaanaLogo: React.FC<LogoProps> = ({
  className = '',
  iconClassName = 'w-7 h-7 sm:w-8 sm:h-8',
  showIcon = true,
  size = 'md',
}) => {
  const textSizes = {
    sm: 'text-lg sm:text-xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl',
    xl: 'text-4xl sm:text-5xl',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5 sm:w-2 sm:h-2',
    md: 'w-2 h-2 sm:w-2.5 sm:h-2.5',
    lg: 'w-2.5 h-2.5 sm:w-3 sm:h-3',
    xl: 'w-3 h-3 sm:w-3.5 sm:h-3.5',
  };

  return (
    <div className={`inline-flex items-center gap-2 sm:gap-2.5 select-none ${className}`}>
      {showIcon && <TulizaanaIcon className={iconClassName} />}
      <div className="inline-flex items-baseline font-poppins font-bold tracking-tight text-white group">
        <span className={textSizes[size]}>
          Tulizaana
        </span>
        <span
          className={`inline-block rounded-full bg-gradient-to-tr from-cyan-400 to-teal-300 shadow-xs shadow-cyan-400/80 shrink-0 ml-0.5 sm:ml-1 ${dotSizes[size]}`}
          aria-hidden="true"
        />
      </div>
    </div>
  );
};
