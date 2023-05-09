export interface IPaginatedListResponse<T> {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  countOnCurrentPage: number;
  data: T[];
}
