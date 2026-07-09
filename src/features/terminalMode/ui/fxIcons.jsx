import React from 'react';

/*
 * Shared media-player icons for the easy-3dkit controls, so the draggable
 * mini-player (FxHud) and the wallpaper menu (FxWallpaperBar) render pixel-
 * identical transport buttons. Stroke follows `currentColor`.
 */

const Svg = ({ children, size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

export const IconPrev = () => <Svg><polygon points="19 20 9 12 19 4 19 20" fill="currentColor" stroke="none" /><line x1="6" y1="19" x2="6" y2="5" /></Svg>;
export const IconNext = () => <Svg><polygon points="5 4 15 12 5 20 5 4" fill="currentColor" stroke="none" /><line x1="18" y1="5" x2="18" y2="19" /></Svg>;
export const IconShuffle = () => <Svg><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></Svg>;
export const IconPlay = () => <Svg><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" /></Svg>;
export const IconPause = () => <Svg><rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none" /><rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none" /></Svg>;
export const IconChevron = ({ open }) => <Svg size={13}><polyline points={open ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} /></Svg>;
