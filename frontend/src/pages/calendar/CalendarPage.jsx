import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plane,
  Clock,
  User,
  ArrowUpRight,
  X
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';

export const CalendarPage = () => {
  const navigate = useNavigate();

  const [view, setView] = useState('month'); // 'month', 'week', 'day'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/calendar/events');
      if (res.data.success) {
        setEvents(res.data.events || []);
      }
    } catch (e) {
      console.error('Failed to load calendar events:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month grid generator
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(new Date(year, month, d));
  }

  const formatMonthTitle = () => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getEventsForDate = (dateObj) => {
    if (!dateObj) return [];
    const dateStr = dateObj.toISOString().split('T')[0];
    return events.filter((e) => e.start === dateStr);
  };

  const formatCurrency = (val) => `₹${parseFloat(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      <PageHeader
        title="Bookings & Flights Calendar"
        subtitle="Visual timeline of passenger departures and flight schedules by journey date"
        icon={CalendarIcon}
      />

      {/* Calendar Toolbar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 w-full min-w-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleToday}
            className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] sm:text-xs font-bold rounded-lg transition"
          >
            Today
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1 sm:p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-slate-600"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1 sm:p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-slate-600"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          <h2 className="text-xs sm:text-base font-bold text-slate-900 ml-1 sm:ml-2">{formatMonthTitle()}</h2>
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-100 p-0.5 sm:p-1 rounded-lg sm:rounded-xl gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
          {['month', 'week', 'day'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-semibold capitalize transition ${
                view === v ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Month View Grid */}
      {view === 'month' && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs overflow-hidden w-full min-w-0">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 text-[10px] sm:text-xs">
            {daysArray.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="min-h-[70px] sm:min-h-[110px] bg-slate-50/40 p-1 sm:p-2" />;
              }

              const dayEvents = getEventsForDate(day);
              const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[70px] sm:min-h-[110px] p-1 sm:p-2 transition hover:bg-slate-50/80 flex flex-col ${
                    isToday ? 'bg-brand-50/30' : ''
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs ${
                        isToday ? 'bg-brand-600 text-white' : 'text-slate-700'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold hidden sm:inline">
                        {dayEvents.length} flight(s)
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 sm:space-y-1 flex-1 overflow-y-auto max-h-[50px] sm:max-h-[80px]">
                    {dayEvents.map((evt) => {
                      let tagBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                      if (evt.status === 'pending') tagBg = 'bg-amber-50 text-amber-800 border-amber-200';
                      if (evt.status === 'cancelled') tagBg = 'bg-rose-50 text-rose-800 border-rose-200';

                      return (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          className={`p-1 rounded text-[9px] sm:text-[10px] font-bold cursor-pointer hover:shadow-xs transition truncate ${tagBg}`}
                          title={`${evt.title} - ${evt.passengers}`}
                        >
                          <span className="font-mono">{evt.flightNumber}</span> {evt.sector}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week / Day View Placeholder List */}
      {(view === 'week' || view === 'day') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4">
            Flights Timeline ({view === 'week' ? 'Week View' : 'Single Day View'})
          </h3>
          <div className="space-y-3">
            {events.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className="p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 flex flex-col items-center justify-center font-bold font-mono border border-brand-100">
                    <span className="text-xs">{evt.start.split('-')[2]}</span>
                    <span className="text-[9px] uppercase">{new Date(evt.start).toLocaleString('en-US', { month: 'short' })}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{evt.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Passenger(s): <strong className="text-slate-700">{evt.passengers}</strong> &bull; Customer: {evt.customerName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={evt.status} />
                  <p className="text-xs font-mono font-bold text-slate-900 mt-1">{formatCurrency(evt.totalAmount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Details Popup Modal */}
      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title="Flight Journey Particulars"
          subtitle={`Departure Date: ${selectedEvent.start}`}
          footer={
            <>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => navigate(`/bookings/${selectedEvent.id || selectedEvent._id}`)}
                className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 flex items-center gap-1"
              >
                Open Full File <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Flight Date:</span>
                <span className="font-bold text-brand-700">{formatDate(selectedEvent.start)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Route / Sector:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedEvent.sector}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Airline & Flight:</span>
                <span className="font-semibold text-slate-900 font-mono">{selectedEvent.airline} ({selectedEvent.flightNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Passenger(s):</span>
                <span className="font-semibold text-slate-900">{selectedEvent.passengers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Customer:</span>
                <span className="font-semibold text-slate-900">{selectedEvent.customerName}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-mono">
                <span className="text-slate-500 font-sans">Total Fare:</span>
                <span className="font-bold text-slate-900">{formatCurrency(selectedEvent.totalAmount)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
