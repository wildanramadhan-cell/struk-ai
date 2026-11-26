import { getActiveUser, getExpensesAction } from './actions/expenses';
import AuthView from '@/components/AuthView';
import DashboardClient from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getActiveUser();

  if (!user) {
    return <AuthView />;
  }

  const expenses = await getExpensesAction();

  return <DashboardClient initialExpenses={expenses} user={user} />;
}