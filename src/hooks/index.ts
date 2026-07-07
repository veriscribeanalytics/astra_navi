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
export type { TransitsTodayData, Rahukaal } from './useTransitsToday';
export { useYearlyForecast } from './useYearlyForecast';
export type { YearlyForecastData, YearlyMonthSummary, YearlySummary } from './useYearlyForecast';
export { useChatSummary } from './useChatSummary';
export type { ChatSummaryData } from './useChatSummary';
export { useSwipeDrawer } from './useSwipeDrawer';
export {
    useFamilyMembers,
    useFamilyChart,
    createFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    useFamilyAvatars,
    useIncomingInvites,
    useOutgoingInvites,
    useFamilyConnections,
    useFamilyFamilyConnections,
    sendInvite,
    acceptInvite,
    declineInvite,
    revokeInvite,
    updateConnection,
    mergeConnection,
    deleteConnection,
    useFamilyDiscover,
    setUsername,
    useFamilyBlocks,
    blockUser,
    unblockUser,
} from './useFamily';
export type { MutationResult } from './useFamily';
export { useFamilyDashboard, useFamilyDashboardWeekly, familyAsk } from './useFamilyDashboard';
export type { FamilyDashboardState, FamilyDashboardWeeklyState, FamilyAskResult } from './useFamilyDashboard';
export { useAvatarTheme } from './useAvatarTheme';
export { useDailyHoroscope } from './useDailyHoroscope';
export { useDailyRewards } from './useDailyRewards';
export type { UseDailyRewardsReturn } from './useDailyRewards';
export { useNotificationFeed } from './useNotifications';
export type { UseNotificationFeedOptions } from './useNotifications';
export { useThreads } from './useThreads';
export type { UseThreadsResult } from './useThreads';
export { useThreadMessages } from './useThreadMessages';
export type { UseThreadMessagesResult, OptimisticMessage, SendResult } from './useThreadMessages';
