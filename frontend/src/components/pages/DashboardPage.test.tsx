/**
 * Test de contrato del Dashboard (H-17): la "Tendencia de Movimientos" debe alimentarse
 * con la data REAL de `reportsService.getDashboardKPIs().movementTrend`, no con datos
 * generados aleatoriamente. Espiamos las props del gráfico para comprobarlo.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from './DashboardPage';

const { getDashboardKPIs, getUnread, trendSpy } = vi.hoisted(() => ({
  getDashboardKPIs: vi.fn(),
  getUnread: vi.fn(),
  trendSpy: vi.fn(),
}));

vi.mock('../../api', () => ({
  reportsService: { getDashboardKPIs },
  alertsService: { getUnread },
}));

vi.mock('../charts', () => ({
  MovementTrendChart: (props: { data: unknown }) => {
    trendSpy(props.data);
    return null;
  },
  CategoryPieChart: () => null,
  CategoryBarChart: () => null,
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <DashboardPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getUnread.mockResolvedValue([]);
});

describe('DashboardPage · tendencia de movimientos (H-17)', () => {
  it('alimenta el gráfico con la data REAL del endpoint (no random)', async () => {
    getDashboardKPIs.mockResolvedValue({
      stockValuation: { totalProducts: 0, totalUnits: 0, totalValue: 0, averageValue: 0 },
      lowStockCount: 0,
      outOfStockCount: 0,
      totalMovementsToday: 0,
      totalMovementsThisMonth: 0,
      recentAlerts: 0,
      topProducts: [],
      categoryDistribution: [],
      movementTrend: [
        { date: '2026-06-30', totalIn: 12, totalOut: 4, netChange: 8 },
        { date: '2026-07-01', totalIn: 7, totalOut: 9, netChange: -2 },
      ],
    });

    renderPage();

    await waitFor(() => expect(trendSpy).toHaveBeenCalled());

    const calls = trendSpy.mock.calls;
    const data = calls[calls.length - 1][0] as Array<{ entradas: number; salidas: number }>;
    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({ entradas: 12, salidas: 4 });
    expect(data[1]).toMatchObject({ entradas: 7, salidas: 9 });
  });
});
