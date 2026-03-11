// type: 'unlimited' | 'visits' | 'single'
// status: 'active' | 'expired' | 'frozen'

export const subscriptions = [
  // c1 — активний безліміт
  {
    id: 's1',
    clientId: 'c1',
    type: 'unlimited',
    label: 'Безліміт',
    startDate: '2026-02-01',
    endDate: '2026-03-01',
    totalVisits: null,
    usedVisits: null,
    status: 'active',
    price: 1200,
    createdAt: '2026-02-01',
  },
  // c1 — попередній абонемент
  {
    id: 's2',
    clientId: 'c1',
    type: 'visits',
    label: '10 відвідувань',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    totalVisits: 10,
    usedVisits: 10,
    status: 'expired',
    price: 900,
    createdAt: '2026-01-01',
  },
  // c2 — активний, майже вичерпаний
  {
    id: 's3',
    clientId: 'c2',
    type: 'visits',
    label: '10 відвідувань',
    startDate: '2026-02-10',
    endDate: '2026-03-10',
    totalVisits: 10,
    usedVisits: 9,
    status: 'active',
    price: 900,
    createdAt: '2026-02-10',
  },
  // c3 — прострочений
  {
    id: 's4',
    clientId: 'c3',
    type: 'unlimited',
    label: 'Безліміт',
    startDate: '2026-01-01',
    endDate: '2026-02-01',
    totalVisits: null,
    usedVisits: null,
    status: 'expired',
    price: 1200,
    createdAt: '2026-01-01',
  },
  // c4 — активний безліміт
  {
    id: 's5',
    clientId: 'c4',
    type: 'unlimited',
    label: 'Безліміт',
    startDate: '2026-02-15',
    endDate: '2026-03-15',
    totalVisits: null,
    usedVisits: null,
    status: 'active',
    price: 1200,
    createdAt: '2026-02-15',
  },
  // c5 — активний 10 відвідувань
  {
    id: 's6',
    clientId: 'c5',
    type: 'visits',
    label: '10 відвідувань',
    startDate: '2026-02-20',
    endDate: '2026-03-20',
    totalVisits: 10,
    usedVisits: 4,
    status: 'active',
    price: 900,
    createdAt: '2026-02-20',
  },
  // c6 — немає абонементу
]
