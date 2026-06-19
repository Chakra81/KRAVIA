import React from 'react';
import { Download, ExternalLink } from 'lucide-react';

const CalendarSync = ({ eventTitle, description, startTime, endTime, location = 'Online' }) => {
  
  const formatDateForGoogle = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');
  
  const handleGoogleCalendar = () => {
    const start = formatDateForGoogle(new Date(startTime));
    const end = formatDateForGoogle(new Date(endTime));
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${start}/${end}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
    window.open(url, '_blank');
  };

  const handleOutlookCalendar = () => {
    const start = new Date(startTime).toISOString();
    const end = new Date(endTime).toISOString();
    const url = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(eventTitle)}&startdt=${start}&enddt=${end}&body=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
    window.open(url, '_blank');
  };

  const handleICSDownload = () => {
    const start = formatDateForGoogle(new Date(startTime));
    const end = formatDateForGoogle(new Date(endTime));
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${start}
DTEND:${end}
SUMMARY:${eventTitle}
DESCRIPTION:${description}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${eventTitle.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center mt-4">
      <button 
        onClick={handleGoogleCalendar} 
        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors border border-blue-200"
      >
        <ExternalLink size={16} /> Google
      </button>
      <button 
        onClick={handleOutlookCalendar} 
        className="px-3 py-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors border border-sky-200"
      >
        <ExternalLink size={16} /> Outlook
      </button>
      <button 
        onClick={handleICSDownload} 
        className="px-3 py-1.5 bg-[var(--bg-card)] hover:bg-[var(--glass)] text-[var(--text-main)] border border-[var(--border)] rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors shadow-sm"
      >
        <Download size={16} /> .ics File
      </button>
    </div>
  );
};

export default CalendarSync;
