import { buildPaginatedResult, getSkipTake } from './pagination.util';

describe('pagination utils', () => {
  it('computes skip and take from page and limit', () => {
    expect(getSkipTake(1, 10)).toEqual({ skip: 0, take: 10 });
    expect(getSkipTake(3, 20)).toEqual({ skip: 40, take: 20 });
  });

  it('builds paginated metadata', () => {
    const result = buildPaginatedResult([{ id: 1 }], 25, 2, 10);

    expect(result.meta).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });
});
