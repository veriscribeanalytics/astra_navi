import { test } from '@playwright/test';
import { mockSession, mockAllApis } from './auth-helpers';

const FULL_PROFILE = {
  id: 'test-user',
  email: 'ravinder@test.com',
  name: 'Ravinder Kumar',
  dob: '1990-08-15',
  tob: '14:30',
  pob: 'New Delhi, India',
  birthLatitude: 28.6139,
  birthLongitude: 77.209,
  birthTimezoneName: 'Asia/Kolkata',
  moonSign: 'Leo',
  sunSign: 'Libra',
  lagnaSign: 'Leo',
  astrologyData: { planets: [{ planet: 'Sun', sign: 'Leo' }] },
};

const HOROSCOPE = {
  user: { sign: 'Leo', name: 'Ravinder Kumar' },
  score: {
    overall: 73,
    areas: {
      love: { value: 82 },
      career: { value: 76 },
      finance: { value: 68 },
      health: { value: 71 },
      general: { value: 74 },
      spiritual: { value: 79 },
    },
  },
  areas_text: {
    love: { insight: 'Strong connections and deep understanding.', tone: 'positive' },
    career: { insight: 'Good progress and recognition ahead.', tone: 'positive' },
    finance: { insight: 'Stable flows, avoid impulsive spending.', tone: 'neutral' },
    health: { insight: 'Focus on balance and consistent routines.', tone: 'neutral' },
    general: { insight: 'Positive momentum in your overall journey.', tone: 'positive' },
    spiritual: { insight: 'Inner growth and clarity are strong.', tone: 'positive' },
  },
  alerts: {
    primary: {
      technical: 'Jupiter dasha favorable',
      simple: 'Your current planetary period is on your side - act on the bigger plan now.',
      type: 'opportunity',
      importance: 'high',
    },
    secondary: [],
  },
  tip: { text: 'This is a powerful window to build momentum, make thoughtful moves, and align with your greater purpose.', type: 'guidance' },
};

const TRANSITS = {
  planets: [{ name: 'Sun', sign: 'Leo', house: 1 }],
  panchanga: {
    tithi: 'Purnima',
    nakshatra: 'Anuradha',
    yoga: 'Shiva',
    karana: 'Vishti',
    vara: 'Shanivaar',
    rahukaal: { date: '2026-05-30', weekday: 'Saturday', start: '08:34', end: '10:25', startIso: '', endIso: '', durationMinutes: 111, segment: 2, source: 'calc' },
  },
  notableTransits: [
    "Jupiter's transit enhances your gains and stabilizes growth.",
    "Saturn's transit tests your discipline and builds resilience.",
    "Rahu's transit destabilizes old patterns - stay grounded.",
    "Ketu supports letting go and releasing attachments.",
  ],
  suggestedQuestions: [],
  todayEnergy: 'High',
};

function buildForecast(area: string) {
  const base = [62, 68, 71, 73, 78, 74, 69];
  const days = base.map((score, i) => {
    const d = new Date('2026-05-27T00:00:00');
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString().slice(0, 10),
      is_today: i === 3,
      score,
      text: `${area} outlook`,
      dominant_planet: 'Jupiter',
      personalized_alerts: [],
    };
  });
  return { area, days, summary: { best_day: days[4].date, worst_day: days[0].date, average_score: 70, trend: 'rising' } };
}

async function setup(page: import('@playwright/test').Page, context: import('@playwright/test').BrowserContext) {
  await mockSession(page, context, { id: 'test-user', email: 'ravinder@test.com', name: 'Ravinder Kumar' });
  await mockAllApis(page);

  await page.route('**/api/user/profile*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: FULL_PROFILE, profileComplete: true }) })
  );
  await page.route('**/api/daily-horoscope*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(HOROSCOPE) })
  );
  await page.route('**/api/transits/today*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TRANSITS) })
  );
  await page.route('**/api/forecast/**', (route) => {
    const m = route.request().url().match(/forecast\/([^/?]+)/);
    const area = m ? m[1] : 'general';
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(buildForecast(area)) });
  });
}

test('dashboard desktop', async ({ page, context }) => {
  await setup(page, context);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'scratch/shots/desktop.png', fullPage: true });
});

test('dashboard mobile', async ({ page, context }) => {
  await setup(page, context);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'scratch/shots/mobile.png', fullPage: true });
});

test('dashboard 4k', async ({ page, context }) => {
  await setup(page, context);
  await page.setViewportSize({ width: 3840, height: 2160 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'scratch/shots/uhd.png' });
});
