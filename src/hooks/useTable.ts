import { useState, useMemo } from "react";

type SortOrder = "asc" | "desc";

interface UseTableOptions<T> {
  data: T[];
  pageSize?: number;
  initialSortKey?: keyof T;
  initialSortOrder?: SortOrder;
  filterKeys?: (keyof T)[];
}

export function useTable<T>({
  data,
  pageSize = 10,
  initialSortKey = null,
  initialSortOrder = "asc",
  filterKeys = [],
}: UseTableOptions<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof T | null>(initialSortKey);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);
  const [searchTerm, setSearchTerm] = useState("");

  // Filtering
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((item) =>
      filterKeys.some((key) =>
        String(item[key]).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm, filterKeys]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = String(a[sortKey]);
      const valB = String(b[sortKey]);
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortOrder]);

  // Pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Sort handler
  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // Total pages
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const totalItems = sortedData.length;
  return {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    sortKey,
    sortOrder,
    handleSort,
    searchTerm,
    setSearchTerm,
     totalItems,   // ✅ add this
  };
}
