import { redirect } from 'next/navigation';

/**
 * /plan → /plans redirect
 *
 * Users may navigate to /plan (singular) from external links or bookmarks.
 * Redirect them to the canonical /plans page.
 */
export default function PlanPage() {
  redirect('/plans');
}