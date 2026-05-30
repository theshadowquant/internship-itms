export function exportCSV(logs, fileName = 'daily-logs-export') {
  if (!logs || logs.length === 0) return;

  const headers = ['Date', 'Check In', 'Check Out', 'Hours Worked', 'Work Summary', 'Mood', 'Status', 'Supervisor Note'];
  const rows = logs.map(log => [
    new Date(log.logDate).toLocaleDateString(),
    log.checkIn,
    log.checkOut,
    log.hoursWorked,
    `"${log.workSummary.replace(/"/g, '""')}"`,
    log.mood,
    log.status,
    log.supervisorNote ? `"${log.supervisorNote.replace(/"/g, '""')}"` : 'N/A'
  ]);

  const csvContent = "data:text/csv;charset=utf-8," 
    + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${fileName}-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
