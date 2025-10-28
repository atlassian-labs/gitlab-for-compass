import { formatLastSyncTime } from './time';

describe('formatLastSyncTime', () => {
  // Helper to mock Date globally
  const RealDate = Date;

  afterEach(() => {
    global.Date = RealDate;
  });

  it('formats a standard ISO date string', () => {
    expect(formatLastSyncTime('2023-10-28T15:45:30Z')).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}:\d{2} (AM|PM)$/);
  });

  it('formats a date string in a different timezone', () => {
    const dateString = '2023-10-28T10:20:30Z';
    const toLocaleDateStringSpy = jest.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('10/28/2023');
    const toLocaleTimeStringSpy = jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('10:20:30 AM');
    expect(formatLastSyncTime(dateString)).toBe('10/28/2023 10:20:30 AM');
    toLocaleDateStringSpy.mockRestore();
    toLocaleTimeStringSpy.mockRestore();
  });

  it('returns "Invalid Date Invalid Date" for an invalid date string', () => {
    expect(formatLastSyncTime('not-a-date')).toBe('Invalid Date Invalid Date');
  });

  it('returns "Invalid Date Invalid Date" for empty string', () => {
    expect(formatLastSyncTime('')).toBe('Invalid Date Invalid Date');
  });
});
