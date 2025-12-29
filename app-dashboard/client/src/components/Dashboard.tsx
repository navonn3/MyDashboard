/**
 * Dashboard Component
 * Main dashboard view with application table, filters, and search
 */

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useUIStore, useDataStore } from '../hooks/useStore';
import { getApplications } from '../services/api';
import ApplicationTable from './ApplicationTable';
import LoadingSpinner from './LoadingSpinner';
import { debounce } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { filterOptions, sortOption, setFilterOptions, setSortOption, isRTL } = useUIStore();
  const { applications, setApplications } = useDataStore();
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(filterOptions.search || '');
  const [showHidden, setShowHidden] = useState(false);

  // Count hidden apps
  const hiddenCount = applications.filter(app => app.hidden).length;

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setFilterOptions({ search: value });
      }, 300),
    [setFilterOptions]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  // Refresh applications
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await getApplications({
        status: filterOptions.status === 'all' ? undefined : filterOptions.status,
        search: filterOptions.search,
        sortBy: sortOption.column,
        sortOrder: sortOption.order,
      });

      if (response.success && response.data) {
        setApplications(response.data);
        toast.success(isRTL ? 'הנתונים רועננו' : 'Data refreshed');
      } else {
        toast.error(response.error || 'Failed to refresh');
      }
    } catch {
      toast.error('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch applications when filters/sort change
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const response = await getApplications({
          status: filterOptions.status === 'all' ? undefined : filterOptions.status,
          search: filterOptions.search,
          sortBy: sortOption.column,
          sortOrder: sortOption.order,
        });

        if (response.success && response.data) {
          setApplications(response.data);
        }
      } catch {
        console.error('Failed to fetch applications');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [filterOptions, sortOption, setApplications]);

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRTL ? 'אפליקציות' : 'Applications'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isRTL
              ? `נמצאו ${applications.length} אפליקציות`
              : `${applications.length} applications found`}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={isRTL ? 'חיפוש...' : 'Search...'}
              value={searchInput}
              onChange={handleSearchChange}
              className="input pl-10 w-64"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={filterOptions.status || 'all'}
              onChange={(e) => setFilterOptions({ status: e.target.value as 'all' | 'active' | 'archived' | 'maintenance' })}
              className="select pl-10"
            >
              <option value="all">{isRTL ? 'כל הסטטוסים' : 'All Status'}</option>
              <option value="active">{isRTL ? 'פעיל' : 'Active'}</option>
              <option value="archived">{isRTL ? 'ארכיון' : 'Archived'}</option>
              <option value="maintenance">{isRTL ? 'תחזוקה' : 'Maintenance'}</option>
            </select>
          </div>

          {/* Sort */}
          <select
            value={`${sortOption.column}-${sortOption.order}`}
            onChange={(e) => {
              const [column, order] = e.target.value.split('-');
              setSortOption({ column, order: order as 'asc' | 'desc' });
            }}
            className="select"
          >
            <option value="updated_at-desc">{isRTL ? 'עודכן לאחרונה' : 'Recently Updated'}</option>
            <option value="created_at-desc">{isRTL ? 'נוצר לאחרונה' : 'Recently Created'}</option>
            <option value="name-asc">{isRTL ? 'שם (א-ת)' : 'Name (A-Z)'}</option>
            <option value="name-desc">{isRTL ? 'שם (ת-א)' : 'Name (Z-A)'}</option>
            <option value="build_platform-asc">{isRTL ? 'פלטפורמה' : 'Platform'}</option>
          </select>

          {/* Show/Hide Hidden Toggle */}
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowHidden(!showHidden)}
              className={`btn-icon ${showHidden ? 'text-primary-600' : ''}`}
              title={isRTL ? (showHidden ? 'הסתר מוסתרים' : `הצג מוסתרים (${hiddenCount})`) : (showHidden ? 'Hide hidden' : `Show hidden (${hiddenCount})`)}
            >
              {showHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn-icon"
            title={isRTL ? 'רענן' : 'Refresh'}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card overflow-hidden">
        {isLoading && applications.length === 0 ? (
          <div className="py-12">
            <LoadingSpinner text={isRTL ? 'טוען אפליקציות...' : 'Loading applications...'} />
          </div>
        ) : applications.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {filterOptions.search || filterOptions.status !== 'all'
                ? isRTL ? 'לא נמצאו תוצאות' : 'No applications match your filters'
                : isRTL ? 'אין אפליקציות עדיין' : 'No applications yet'}
            </p>
            {!filterOptions.search && filterOptions.status === 'all' && (
              <p className="text-sm text-gray-400 mt-1">
                {isRTL
                  ? 'לחץ על "אפליקציה חדשה" כדי להתחיל'
                  : 'Click "New App" to get started'}
              </p>
            )}
          </div>
        ) : (
          <ApplicationTable applications={applications} isLoading={isLoading} showHidden={showHidden} />
        )}
      </div>
    </section>
  );
}
