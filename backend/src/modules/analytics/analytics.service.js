const prisma = require('../../config/db');

const getStudentAnalytics = async (userId) => {
  // 1. Total applications
  const totalApplications = await prisma.application.count({ where: { userId } });

  // 2. Fetch all student applications to aggregate status breakdowns
  const apps = await prisma.application.findMany({ where: { userId } });
  const byStatus = {
    APPLIED: 0,
    SHORTLISTED: 0,
    INTERVIEW: 0,
    OFFER_SENT: 0,
    HIRED: 0,
    REJECTED: 0,
    WITHDRAWN: 0,
  };
  apps.forEach(app => {
    if (byStatus[app.status] !== undefined) {
      byStatus[app.status]++;
    }
  });

  // 3. Fetch daily logs to sum hours worked
  const approvedLogs = await prisma.dailyLog.findMany({
    where: { userId, status: 'APPROVED' },
  });
  const totalHoursWorked = approvedLogs.reduce((sum, log) => sum + log.hoursWorked, 0);

  // 4. Calculate average hours worked per day
  const avgHoursPerDay = approvedLogs.length > 0
    ? parseFloat((totalHoursWorked / approvedLogs.length).toFixed(1))
    : 0;

  // 5. Weekly Hours Log (representing Mon-Sun hours for the current week)
  // Fetch all student logs for the past 7 days to compile weekly chart data
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const weeklyLogs = await prisma.dailyLog.findMany({
    where: {
      userId,
      logDate: { gte: sevenDaysAgo },
      status: 'APPROVED',
    },
  });

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyHoursMap = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
  
  weeklyLogs.forEach(log => {
    const dayName = weekdayNames[new Date(log.logDate).getDay()];
    weeklyHoursMap[dayName] += log.hoursWorked;
  });

  const weeklyHours = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
    day,
    hours: parseFloat(weeklyHoursMap[day].toFixed(1)),
  }));

  // Tasks Ratio (Placeholder-free completion representation)
  // We can calculate completion count from logs. Mood rating acts as performance score
  const performanceScore = student1PerformanceRating(approvedLogs, apps);

  return {
    totalApplications,
    byStatus,
    totalHoursWorked: parseFloat(totalHoursWorked.toFixed(1)),
    weeklyHours,
    avgHoursPerDay,
    performanceScore,
    tasksCompleted: approvedLogs.length, // counts number of days checked-in and approved
  };
};

// Custom score calculator out of 100 based on log states and application progress
const student1PerformanceRating = (approvedLogs, apps) => {
  if (apps.length === 0) return 0;
  
  let score = 50; // base score
  
  // Hired state is +25 points
  const hasHired = apps.some(a => a.status === 'HIRED');
  if (hasHired) score += 25;

  // Each approved log adds +5 points (max 25 points)
  score += Math.min(approvedLogs.length * 5, 25);

  return score;
};

const getAdminAnalytics = async () => {
  // 1. Core totals
  const totalUsers = await prisma.user.count();
  const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
  const totalInternships = await prisma.internship.count();
  const totalApplications = await prisma.application.count();

  // 2. Placement Rate: hired students out of total unique students
  const hiredCount = await prisma.application.count({
    where: { status: 'HIRED' },
  });
  const placementRate = totalStudents > 0
    ? Math.round((hiredCount / totalStudents) * 100)
    : 0;

  // 3. Top Companies by applications density
  const allApps = await prisma.application.findMany({
    include: { internship: true },
  });

  const companyMap = {};
  allApps.forEach(app => {
    const name = app.internship.companyName;
    companyMap[name] = (companyMap[name] || 0) + 1;
  });

  const topCompanies = Object.entries(companyMap)
    .map(([companyName, count]) => ({ companyName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 4. Monthly Trend: Application frequency in the past 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1); // Start of month

  const appsPast6Months = await prisma.application.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trendMap = {};

  // Initialize past 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mName = months[d.getMonth()];
    trendMap[mName] = 0;
  }

  appsPast6Months.forEach(app => {
    const mName = months[new Date(app.createdAt).getMonth()];
    if (trendMap[mName] !== undefined) {
      trendMap[mName]++;
    }
  });

  const monthlyTrend = Object.entries(trendMap).map(([month, count]) => ({
    month,
    count,
  }));

  // 5. Application Status Breakdown
  const statusBreakdown = {
    APPLIED: 0,
    SHORTLISTED: 0,
    INTERVIEW: 0,
    OFFER_SENT: 0,
    HIRED: 0,
    REJECTED: 0,
    WITHDRAWN: 0,
  };
  
  allApps.forEach(app => {
    if (statusBreakdown[app.status] !== undefined) {
      statusBreakdown[app.status]++;
    }
  });

  return {
    totalUsers,
    totalStudents,
    totalInternships,
    totalApplications,
    placementRate,
    topCompanies,
    monthlyTrend,
    statusBreakdown,
  };
};

module.exports = {
  getStudentAnalytics,
  getAdminAnalytics,
};
