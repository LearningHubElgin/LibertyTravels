import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Plane,
  Phone,
  User,
  Search,
  Filter,
  Eye,
  ArrowUpRight
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/formatters';

export const UpcomingJourneysPage = () => {
  const navigate = useNavigate();

  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('7days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  const fetchJourneys = async () => {
    setLoading(true);
    try {
      let query = `filter=${filter}&page=${pagination.page}&limit=${pagination.limit}`;
      if (filter === 'custom' && customStart && customEnd) {
        query += `&startDate=${customStart}&endDate=${customEnd}`;
      }

      const res = await api.get(`/journeys/upcoming?${query}`);
      if (res.data.success) {
        setJourneys(res.data.journeys || []);
        setPagination(res.data.pagination);
      }
    } catch (e) {
      console.error('Failed to load upcoming journeys:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourneys();
  }, [filter, pagination.page]);

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (customStart && customEnd) {
      fetchJourneys();
    }
  };

  const columns = [
    {
      header: 'Departure Date',
      accessor: 'journeyDate',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{formatDate(row.journeyDate)}</span>
          <span className="text-[10px] text-slate-400 font-mono">Ref: {row.referenceNo}</span>
        </div>
      )
    },
    {
      header: 'Passengers Manifest',
      render: (row) => {
        const lead = row.passengers?.[0];
        const count = row.passengers?.length || 0;
        return (
          <div>
            <p className="font-bold text-slate-900 leading-tight">
              {lead ? `${lead.title ? lead.title + ' ' : ''}${lead.firstName} ${lead.lastName}` : 'N/A'}
            </p>
            {count > 1 && (
              <p className="text-[10px] text-brand-600 font-semibold mt-0.5">
                +{count - 1} more accompanying passenger(s)
              </p>
            )}
          </div>
        );
      }
    },
    {
      header: 'Service & Sector',
      render: (row) => {
        const compObj = row.company;
        return (
          <div>
            <span className="font-bold text-slate-900 block">{row.sector}</span>
            <span className="text-[11px] text-slate-500 font-mono">
              {compObj?.code || ''} {row.flightNumber ? `${row.flightNumber} ` : ''}{compObj?.name ? `(${compObj.name})` : ''}
            </span>
          </div>
        );
      }
    },
    {
      header: 'PNR Number',
      render: (row) => (
        <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
          {row.pnr}
        </span>
      )
    },
    {
      header: 'Customer Contact',
      render: (row) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800">{row.customer?.name}</p>
          <p className="text-[11px] text-slate-500 font-mono">{row.customer?.phone}</p>
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Action',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <button
          onClick={() => navigate(`/bookings/${row.id || row._id}`)}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-xs font-semibold rounded-lg transition"
        >
          View Ticket <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      <PageHeader
        title="Upcoming Travel Journeys"
        subtitle="Operational flight departures, passenger manifests, PNR checks and customer alerts"
        icon={CalendarDays}
      />

      {/* Date Filter Tabs */}
      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4 w-full min-w-0">
        <div className="flex bg-slate-100 p-0.5 sm:p-1 rounded-lg sm:rounded-xl gap-0.5 sm:gap-1 text-[10px] sm:text-xs overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'today', label: 'Departing Today' },
            { id: 'tomorrow', label: 'Tomorrow' },
            { id: '7days', label: 'Next 7 Days' },
            { id: '30days', label: 'Next 30 Days' },
            { id: 'custom', label: 'Custom Range' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-semibold whitespace-nowrap transition ${
                filter === tab.id
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filter === 'custom' && (
          <form onSubmit={handleApplyCustom} className="flex items-center gap-1.5 text-[10px] sm:text-xs">
            <input
              type="date"
              required
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 border border-slate-200 rounded-lg bg-white"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              required
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 border border-slate-200 rounded-lg bg-white"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 shadow-xs"
            >
              Apply
            </button>
          </form>
        )}
      </div>

      {/* Journeys Table */}
      <DataTable
        columns={columns}
        data={journeys}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
        emptyTitle="No upcoming flights"
        emptyDescription="There are no scheduled flight departures within the selected time period."
      />
    </div>
  );
};
