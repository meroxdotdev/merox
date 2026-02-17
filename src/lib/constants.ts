/**
 * Animation and timing constants
 */
export const ANIMATION = {
  // Infinite scroll durations (in milliseconds)
  SCROLL_DURATION_DEFAULT: 40000,
  SCROLL_DURATION_SKILLS: 45000,
  
  // Fade in animation
  FADE_IN_DURATION: 500, // milliseconds
  FADE_IN_DELAY_STEP: 50, // milliseconds between each badge
  
  // Stagger delays
  STAGGER_DELAYS: {
    FIRST: 0.05,
    SECOND: 0.1,
    THIRD: 0.15,
    FOURTH: 0.2,
    FIFTH: 0.25,
    SIXTH: 0.3,
    SEVENTH: 0.35,
    EIGHTH: 0.4,
    NTH: 0.45,
  },
} as const

/**
 * Performance constants
 */
export const PERFORMANCE = {
  // Intersection Observer thresholds
  INTERSECTION_THRESHOLD: 0.1,
  INTERSECTION_ROOT_MARGIN: '50px',
  
  // Debounce delays
  SEARCH_DEBOUNCE: 150, // milliseconds
  
  // Focus delay for better UX
  FOCUS_DELAY: 100, // milliseconds
  
  // Scroll reset delay
  SCROLL_RESET_DELAY: 100, // milliseconds
} as const

/**
 * Search constants
 */
export const SEARCH = {
  // Cache settings
  CACHE_VERSION: '1.0',
  CACHE_TTL: 3600000, // 1 hour in milliseconds
  
  // Search settings
  MAX_SEARCH_RESULTS: 50,
  INITIAL_DISPLAY_RESULTS: 10,
  LOAD_MORE_INCREMENT: 10,
  MAX_SEARCH_HISTORY: 10,
  MAX_RECENT_POSTS: 5,
  MAX_DISPLAYED_SEARCH_HISTORY: 6, // Show one more than recent posts for better UX
  
  // Snippet settings
  SNIPPET_MAX_LENGTH: 150,
  SNIPPET_CONTEXT_LENGTH: 50,
} as const

/**
 * Carousel constants
 */
export const CAROUSEL = {
  // Swipe threshold in pixels
  SWIPE_THRESHOLD: 50,
} as const

/**
 * Last.fm card animation constants
 */
export const LASTFM_ANIMATION = {
  // Animation duration (must match CSS)
  DURATION: 15000, // 15 seconds in milliseconds
  
  // Physics simulation
  FRICTION: 0.92, // Friction coefficient (0-1, lower = more friction)
  MIN_VELOCITY: 0.1, // Minimum velocity to stop rotation completely
  
  // Sensitivity
  SENSITIVITY: 0.8, // Scratch sensitivity factor
  
  // Performance
  FRAME_RATE: 16.67, // ~60fps in milliseconds
  RECT_CACHE_DURATION: 100, // Cache bounding rect for 100ms
} as const
