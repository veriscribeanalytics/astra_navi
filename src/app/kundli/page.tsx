import type { Metadata } from 'next';
import KundliClient from './KundliClient';

export const metadata: Metadata = {
  title: 'My Vedic Birth Chart (Kundli) | AstraNavi',
  description: 'Explore your complete Vedic birth chart with precise planetary positions, nakshatras, and mahadashas.',
};

export default function KundliPage() {
  return <KundliClient />;
}
