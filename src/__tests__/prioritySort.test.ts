import { describe, it, expect } from 'vitest';
import { sortByPriority } from '@/lib/utils';

describe('sortByPriority', () => {
  it('correctly sorts tasks Critical -> High -> Medium -> Low', () => {
    const mockTasks = [
      { id: '1', title: 'Low Priority Task', priority: 'LOW', createdAt: new Date('2026-09-01') },
      { id: '2', title: 'Critical Task 1', priority: 'CRITICAL', createdAt: new Date('2026-09-02') },
      { id: '3', title: 'Medium Priority Task', priority: 'MEDIUM', createdAt: new Date('2026-09-03') },
      { id: '4', title: 'High Priority Task', priority: 'HIGH', createdAt: new Date('2026-09-04') },
      { id: '5', title: 'Critical Task 2 (Newer)', priority: 'CRITICAL', createdAt: new Date('2026-09-05') },
    ];

    const sorted = sortByPriority(mockTasks);

    expect(sorted[0].id).toBe('5'); // Critical, newer
    expect(sorted[1].id).toBe('2'); // Critical, older
    expect(sorted[2].id).toBe('4'); // High
    expect(sorted[3].id).toBe('3'); // Medium
    expect(sorted[4].id).toBe('1'); // Low
  });

  it('handles empty or missing priority values gracefully', () => {
    const mockTasks = [
      { id: '1', title: 'No Priority', priority: null },
      { id: '2', title: 'Critical', priority: 'CRITICAL' },
      { id: '3', title: 'High', priority: 'HIGH' },
    ];

    const sorted = sortByPriority(mockTasks);
    expect(sorted[0].priority).toBe('CRITICAL');
    expect(sorted[1].priority).toBe('HIGH');
    expect(sorted[2].priority).toBe(null);
  });
});
