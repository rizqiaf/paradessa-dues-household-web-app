import { BULAN_INDONESIA_SHORT } from './format';

export interface UnpaidDueItem {
  id?: string;
  year_month: string; // "YYYY-MM"
  component_name: string; // "Pokok", "Air", "Sampah"
  amount: number; // standard dues amount
  paid_amount: number; // already paid
  remaining: number; // amount - paid_amount
}

export interface SubscribedComponent {
  component_name: string;
  amount: number;
}

export interface ProposedAllocation {
  due_id?: string | null;
  year_month: string;
  component_name: string;
  amount: number;
  is_future_prepayment?: boolean;
}

export interface AllocationResult {
  allocations: ProposedAllocation[];
  totalAllocated: number;
  houseCredit: number; // any remaining balance not allocated
  coverageSummary: string; // e.g. "Iuran 2 bulan: Jan'26, Feb'26" or "Sebagian Jan'26"
  monthsCovered: string[]; // ["2026-01", "2026-02"]
}

// Helper to get next month string "YYYY-MM"
export function getNextYearMonth(currentYearMonth: string): string {
  const [yStr, mStr] = currentYearMonth.split('-');
  let y = parseInt(yStr, 10);
  let m = parseInt(mStr, 10) + 1;
  if (m > 12) {
    m = 1;
    y += 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

// Generate future dues for a given month and subscriptions
export function generateMonthComponents(
  yearMonth: string,
  subscriptions: SubscribedComponent[]
): UnpaidDueItem[] {
  // Sort priority: Pokok first, Air second, Sampah third
  const order: Record<string, number> = { Pokok: 1, Air: 2, Sampah: 3 };
  return [...subscriptions]
    .sort((a, b) => (order[a.component_name] || 99) - (order[b.component_name] || 99))
    .map((sub) => ({
      year_month: yearMonth,
      component_name: sub.component_name,
      amount: sub.amount,
      paid_amount: 0,
      remaining: sub.amount,
    }));
}

/**
 * Auto-allocates an incoming payment amount:
 * 1. Oldest unpaid dues first (arrears)
 * 2. If money remains, next future months in sequence (prepayment)
 * 3. Any leftover change beyond full or partial components becomes house credit
 */
export function calculateAutoAllocation(
  amount: number,
  existingUnpaidDues: UnpaidDueItem[],
  subscriptions: SubscribedComponent[],
  referenceYearMonth: string = new Date().toISOString().slice(0, 7)
): AllocationResult {
  let remainingMoney = Math.max(0, Math.floor(amount));
  const allocations: ProposedAllocation[] = [];
  const coveredMonthsSet = new Set<string>();

  // 1. Allocate to existing unpaid dues (sorted chronologically)
  // Sort by year_month ASC, then Pokok -> Air -> Sampah
  const order: Record<string, number> = { Pokok: 1, Air: 2, Sampah: 3 };
  const sortedUnpaid = [...existingUnpaidDues].sort((a, b) => {
    if (a.year_month !== b.year_month) {
      return a.year_month.localeCompare(b.year_month);
    }
    return (order[a.component_name] || 99) - (order[b.component_name] || 99);
  });

  for (const due of sortedUnpaid) {
    if (remainingMoney <= 0) break;
    const need = due.remaining;
    if (need <= 0) continue;

    const allocAmount = Math.min(remainingMoney, need);
    allocations.push({
      due_id: due.id || null,
      year_month: due.year_month,
      component_name: due.component_name,
      amount: allocAmount,
      is_future_prepayment: false,
    });

    remainingMoney -= allocAmount;
    coveredMonthsSet.add(due.year_month);
  }

  // 2. If money remains and subscriptions exist, generate future months as prepayment
  if (remainingMoney > 0 && subscriptions.length > 0) {
    // Find highest month already allocated or reference month
    let lastMonth = referenceYearMonth;
    for (const alloc of allocations) {
      if (alloc.year_month > lastMonth) {
        lastMonth = alloc.year_month;
      }
    }

    let nextMonth = getNextYearMonth(lastMonth);
    // Limit to 36 future months to prevent infinite loops on crazy numbers
    let iterations = 0;
    while (remainingMoney > 0 && iterations < 36) {
      iterations++;
      const futureComponents = generateMonthComponents(nextMonth, subscriptions);
      for (const comp of futureComponents) {
        if (remainingMoney <= 0) break;
        const allocAmount = Math.min(remainingMoney, comp.remaining);
        allocations.push({
          due_id: null,
          year_month: nextMonth,
          component_name: comp.component_name,
          amount: allocAmount,
          is_future_prepayment: true,
        });
        remainingMoney -= allocAmount;
        coveredMonthsSet.add(nextMonth);
      }
      nextMonth = getNextYearMonth(nextMonth);
    }
  }

  const totalAllocated = amount - remainingMoney;
  const houseCredit = remainingMoney;

  // Build human friendly coverage description
  const monthsCovered = Array.from(coveredMonthsSet).sort();
  let coverageSummary = '';

  if (monthsCovered.length === 1) {
    const ym = monthsCovered[0];
    const [y, m] = ym.split('-');
    const mName = BULAN_INDONESIA_SHORT[parseInt(m, 10)];
    coverageSummary = `Iuran ${mName}'${y.slice(2)}`;
  } else if (monthsCovered.length > 1) {
    const formattedList = monthsCovered.map((ym) => {
      const [y, m] = ym.split('-');
      return `${BULAN_INDONESIA_SHORT[parseInt(m, 10)]}'${y.slice(2)}`;
    });
    coverageSummary = `Iuran ${monthsCovered.length} bulan: ${formattedList.join(', ')}`;
  } else {
    coverageSummary = 'Titipan / Kelebihan Saldo';
  }

  if (houseCredit > 0) {
    coverageSummary += ` (Kelebihan Rp ${houseCredit.toLocaleString('id-ID')})`;
  }

  return {
    allocations,
    totalAllocated,
    houseCredit,
    coverageSummary,
    monthsCovered,
  };
}
