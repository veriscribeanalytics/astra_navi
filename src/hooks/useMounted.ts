import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Hook to determine if the component has mounted on the client.
 * Uses useSyncExternalStore to safely handle hydration without 
 * triggering extra re-renders or "set-state-in-effect" warnings.
 */
export const useMounted = () => {
    return useSyncExternalStore(
        emptySubscribe, 
        () => true, 
        () => false
    );
};
