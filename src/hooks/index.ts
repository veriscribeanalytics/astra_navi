// Export all custom hooks for easy importing

// Animation & Interaction Hooks
export { useVisibilityObserver } from './useVisibilityObserver';
export { useResizeObserver } from './useResizeObserver';
export { useClickOutside } from './useClickOutside';
export { useAnimationFrame } from './useAnimationFrame';
export { useDebounce, useDebouncedValue } from './useDebounce';
export { useMouseMove } from './useMouseMove';

// Responsive & Viewport Hooks
export { useMediaQuery } from './useMediaQuery';
export { useResponsive, useIsMobileDevice, useIsMobile, BREAKPOINTS } from './useResponsive';
export { useViewport, useIsBrowserUIVisible } from './useViewport';
export { useOrientation } from './useOrientation';

// Performance Optimization Hooks
export { useDeviceCapability } from './useDeviceCapability';
export { useScrollDetection } from './useScrollDetection';

// App-Specific Hooks
export { useTheme } from './useTheme';
export { useToast } from './useToast';
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export { useRealTime } from './useRealTime';
export { useTranslation } from './useTranslation';
export { usePaywall } from './usePaywall';
export { usePaywallContext } from '@/context/PaywallContext';
export { useFocusTrap } from './useFocusTrap';
export { useTransitsToday } from './useTransitsToday';
export type { TransitsTodayData } from './useTransitsToday';
export { useYearlyForecast } from './useYearlyForecast';
export type { YearlyForecastData, YearlyMonthSummary, YearlySummary } from './useYearlyForecast';
export { useChatSummary } from './useChatSummary';
export type { ChatSummaryData } from './useChatSummary';
export { useSwipeDrawer } from './useSwipeDrawer';
export {
    useFamilyMembers,
    useFamilyChart,
    useFamilyCompatibility,
    createFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    useFamilyAvatars,
    useFamilyCompatibilityPreflight,
    useFamilyReports,
    useIncomingInvites,
    useOutgoingInvites,
    useFamilyConnections,
    useFamilyConnectionCompatibility,
    sendInvite,
    acceptInvite,
    acceptInviteMerge,
    declineInvite,
    revokeInvite,
    updateConnection,
    deleteConnection,
} from './useFamily';
export type { CompatibilityFetchResult, MutationResult, FamilyReport } from './useFamily';
export { useAvatarTheme } from './useAvatarTheme';
