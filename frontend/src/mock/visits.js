// exitedAt: null — зараз в залі
export const visits = [
  // зараз в залі (сьогодні 2026-03-02)
  { id: 'v1', clientId: 'c1', enteredAt: '2026-03-02T09:30:00', exitedAt: null },
  { id: 'v2', clientId: 'c2', enteredAt: '2026-03-02T10:15:00', exitedAt: null },
  { id: 'v3', clientId: 'c4', enteredAt: '2026-03-02T11:00:00', exitedAt: null },
  { id: 'v4', clientId: 'c5', enteredAt: '2026-03-02T08:45:00', exitedAt: null },

  // вже пішли сьогодні
  { id: 'v16', clientId: 'c3', enteredAt: '2026-03-02T07:00:00', exitedAt: '2026-03-02T09:00:00' },
  { id: 'v17', clientId: 'c6', enteredAt: '2026-03-02T09:30:00', exitedAt: '2026-03-02T11:15:00' },

  // історія c1
  { id: 'v5', clientId: 'c1', enteredAt: '2026-02-25T09:10:00', exitedAt: '2026-02-25T11:20:00' },
  { id: 'v6', clientId: 'c1', enteredAt: '2026-02-22T10:00:00', exitedAt: '2026-02-22T12:30:00' },
  { id: 'v7', clientId: 'c1', enteredAt: '2026-02-19T09:45:00', exitedAt: '2026-02-19T11:00:00' },
  { id: 'v8', clientId: 'c1', enteredAt: '2026-02-15T08:30:00', exitedAt: '2026-02-15T10:15:00' },

  // історія c2
  { id: 'v9',  clientId: 'c2', enteredAt: '2026-02-24T10:00:00', exitedAt: '2026-02-24T12:00:00' },
  { id: 'v10', clientId: 'c2', enteredAt: '2026-02-21T11:00:00', exitedAt: '2026-02-21T13:00:00' },
  { id: 'v11', clientId: 'c2', enteredAt: '2026-02-18T09:30:00', exitedAt: '2026-02-18T11:00:00' },

  // історія c3
  { id: 'v12', clientId: 'c3', enteredAt: '2026-01-30T08:00:00', exitedAt: '2026-01-30T10:30:00' },
  { id: 'v13', clientId: 'c3', enteredAt: '2026-01-27T09:00:00', exitedAt: '2026-01-27T11:30:00' },

  // історія c5
  { id: 'v14', clientId: 'c5', enteredAt: '2026-02-25T08:00:00', exitedAt: '2026-02-25T10:00:00' },
  { id: 'v15', clientId: 'c5', enteredAt: '2026-02-22T08:30:00', exitedAt: '2026-02-22T10:30:00' },
]
