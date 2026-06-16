import { createContext, useContext } from 'react';

// Holds a ref to the fun-mode scroll container (the 3D-tilted, overflow:auto element).
// Section parallax/ticker effects and the navbar all read from this so they track the
// real scroll position instead of the window (which never scrolls in fun mode).
export const ScrollContainerContext = createContext(null);

export const useScrollContainerRef = () => useContext(ScrollContainerContext);
