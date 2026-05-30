const prisma = require('../../config/db');
const { Parser } = require('json2csv');

const computeHours = (checkIn, checkOut) => {
  const [inHour, inMin] = checkIn.split(':').map(Number);
  const [outHour, outMin] = checkOut.split(':').map(Number);

  let totalMins = (outHour * 60 + outMin) - (inHour * 60 + inMin);
  if (totalMins < 0) {
    // If shift crossed midnight
    totalMins += 24 * 60;
  }

  return parseFloat((totalMins / 60).toFixed(2));
};

const createDailyLog = async (userId, data) => {
  const { logDate, checkIn, checkOut, workSummary, mood } = data;

  // 1. Fetch active application for student to link
  const activeApp = await prisma.application.findFirst({
    where: { userId, status: 'HIRED' },
  });

  // Calculate hours worked
  const hoursWorked = computeHours(checkIn, checkOut);

  // 2. Create the daily log
  const log = await prisma.dailyLog.create({
    data: {
      userId,
      applicationId: activeApp ? activeApp.id : null,
      logDate: new Date(logDate),
      checkIn,
      checkOut,
      hoursWorked,
      workSummary,
      mood: mood || 'GOOD',
      status: 'PENDING',
    },
  });

  // Create Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: 'daily_log.create',
      entityType: 'DailyLog',
      entityId: log.id,
    },
  });

  return log;
};

const getMyLogs = async (userId, filters = {}) => {
  const { startDate, endDate } = filters;
  const where = { userId };

  if (startDate || endDate) {
    where.logDate = {};
    if (startDate) where.logDate.gte = new Date(startDate);
    if (endDate) where.logDate.lte = new Date(endDate);
  }

  return await prisma.dailyLog.findMany({
    where,
    orderBy: { logDate: 'desc' },
  });
};

const getAllLogs = async (filters = {}) => {
  const { status, page = 1, limit = 10 } = filters;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {};
  if (status) {
    where.status = status;
  }

  const [logs, total] = await Promise.all([
    prisma.dailyLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { logDate: 'desc' },
      skip,
      take,
    }),
    prisma.dailyLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page: parseInt(page),
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

const updateDailyLog = async (userId, id, data) => {
  const { checkIn, checkOut, workSummary, mood } = data;

  const log = await prisma.dailyLog.findUnique({ where: { id } });
  if (!log || log.userId !== userId) {
    throw new Error('Daily log record not found.');
  }

  if (log.status !== 'PENDING') {
    throw new Error('Only pending logs can be edited.');
  }

  const hoursWorked = checkIn && checkOut ? computeHours(checkIn, checkOut) : log.hoursWorked;

  return await prisma.dailyLog.update({
    where: { id },
    data: {
      checkIn,
      checkOut,
      hoursWorked,
      workSummary,
      mood,
    },
  });
};

const deleteDailyLog = async (userId, id) => {
  const log = await prisma.dailyLog.findUnique({ where: { id } });
  if (!log || log.userId !== userId) {
    throw new Error('Daily log record not found.');
  }

  if (log.status !== 'PENDING') {
    throw new Error('Only pending logs can be deleted.');
  }

  await prisma.dailyLog.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: 'daily_log.delete',
      entityType: 'DailyLog',
      entityId: id,
    },
  });

  return true;
};

const approveLog = async (adminId, id, supervisorNote) => {
  const log = await prisma.dailyLog.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!log) {
    throw new Error('Daily log record not found.');
  }

  const updatedLog = await prisma.dailyLog.update({
    where: { id },
    data: {
      status: 'APPROVED',
      supervisorNote,
    },
  });

  // Notify student
  await prisma.notification.create({
    data: {
      userId: log.userId,
      type: 'log_approved',
      title: 'Daily Log Approved ✅',
      body: `Your daily log for ${new Date(log.logDate).toLocaleDateString()} was approved by the supervisor.`,
      actionUrl: '/daily-logs',
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: 'daily_log.approve',
      entityType: 'DailyLog',
      entityId: id,
    },
  });

  return updatedLog;
};

const rejectLog = async (adminId, id, supervisorNote) => {
  if (!supervisorNote) {
    throw new Error('A supervisor note is required to reject a daily log.');
  }

  const log = await prisma.dailyLog.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!log) {
    throw new Error('Daily log record not found.');
  }

  const updatedLog = await prisma.dailyLog.update({
    where: { id },
    data: {
      status: 'REJECTED',
      supervisorNote,
    },
  });

  // Notify student
  await prisma.notification.create({
    data: {
      userId: log.userId,
      type: 'log_rejected',
      title: 'Daily Log Rejected ⚠️',
      body: `Your daily log for ${new Date(log.logDate).toLocaleDateString()} was rejected. Note: ${supervisorNote}`,
      actionUrl: '/daily-logs',
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: 'daily_log.reject',
      entityType: 'DailyLog',
      entityId: id,
    },
  });

  return updatedLog;
};

const exportLogsToCSV = async (userId) => {
  const logs = await prisma.dailyLog.findMany({
    where: { userId },
    orderBy: { logDate: 'desc' },
  });

  if (logs.length === 0) {
    throw new Error('No daily logs available to export.');
  }

  // Format dates for CSV representation
  const formattedLogs = logs.map(log => ({
    Date: new Date(log.logDate).toLocaleDateString(),
    'Check In': log.checkIn,
    'Check Out': log.checkOut,
    'Hours Worked': log.hoursWorked,
    'Work Summary': log.workSummary.replace(/,/g, ' '), // replace commas to prevent CSV breakage
    Mood: log.mood,
    Status: log.status,
    'Supervisor Note': log.supervisorNote ? log.supervisorNote.replace(/,/g, ' ') : 'N/A',
  }));

  const fields = ['Date', 'Check In', 'Check Out', 'Hours Worked', 'Work Summary', 'Mood', 'Status', 'Supervisor Note'];
  const parser = new Parser({ fields });
  return parser.parse(formattedLogs);
};

module.exports = {
  createDailyLog,
  getMyLogs,
  getAllLogs,
  updateDailyLog,
  deleteDailyLog,
  approveLog,
  rejectLog,
  exportLogsToCSV,
};
