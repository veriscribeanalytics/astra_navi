import { useState, useEffect } from "react";

export const getGreetingKey = () => {
    const hour = new Date().getHours();
    if (hour < 5) return "dashboard.greetingNight";
    if (hour < 12) return "dashboard.greetingMorning";
    if (hour < 17) return "dashboard.greetingAfternoon";
    if (hour < 21) return "dashboard.greetingEvening";
    return "dashboard.greetingNight";
};

export function useGreeting() {
    const [greetingKey, setGreetingKey] = useState(getGreetingKey());

    useEffect(() => {
        const interval = setInterval(() => setGreetingKey(getGreetingKey()), 60000);
        return () => clearInterval(interval);
    }, []);

    return greetingKey;
}
