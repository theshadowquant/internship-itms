const prisma = require('../../config/db');

const createApplication = async (userId, data) => {
  const { internshipId, coverLetter, resumeUrl } = data;

  // 1. Fetch student profile
  const student = await prisma.user.findUnique({
    where: { id: userId },
    include: { studentProfile: true },
  });

  if (!student || !student.studentProfile) {
    throw new Error('Student profile not found. Please fill your profile first.');
  }

  // 2. Fetch internship
  const internship = await prisma.internship.findUnique({
    where: { id: internshipId },
  });

  if (!internship) {
    throw new Error('Internship posting not found.');
  }

  if (internship.status !== 'ACTIVE') {
    throw new Error('This internship posting is no longer active.');
  }

  if (internship.openings <= 0) {
    throw new Error('No remaining openings available for this internship.');
  }

  // 3. Check deadline
  if (new Date() > new Date(internship.applicationDeadline)) {
    throw new Error('The application deadline for this internship has passed.');
  }

  // 4. Check duplicate application
  const existingApp = await prisma.application.findFirst({
    where: { internshipId, userId },
  });

  if (existingApp) {
    throw new Error('You have already applied for this internship.');
  }

  // 5. Compute matchScore based on skills overlap
  let studentSkills = [];
  let reqSkills = [];
  try {
    studentSkills = typeof student.studentProfile.skills === 'string'
      ? JSON.parse(student.studentProfile.skills)
      : student.studentProfile.skills;
  } catch (e) {
    studentSkills = [];
  }

  try {
    reqSkills = typeof internship.skillsRequired === 'string'
      ? JSON.parse(internship.skillsRequired)
      : internship.skillsRequired;
  } catch (e) {
    reqSkills = [];
  }

  let matchScore = 100;
  if (Array.isArray(reqSkills) && reqSkills.length > 0) {
    const overlap = reqSkills.filter(skill => studentSkills.includes(skill));
    matchScore = Math.round((overlap.length / reqSkills.length) * 100);
  }

  // 6. Execute application creation and internship openings decrement inside a transaction
  return await prisma.$transaction(async (tx) => {
    const app = await tx.application.create({
      data: {
        internshipId,
        userId,
        coverLetter,
        resumeUrl: resumeUrl || student.studentProfile.resumeUrl || '',
        status: 'APPLIED',
        matchScore,
        stageHistory: JSON.stringify([
          {
            stage: 'APPLIED',
            timestamp: new Date().toISOString(),
            note: 'Application submitted successfully.',
          },
        ]),
      },
      include: { internship: true },
    });

    // Decrement internship openings & increment applications count
    await tx.internship.update({
      where: { id: internshipId },
      data: {
        openings: { decrement: 1 },
        applicationsCount: { increment: 1 },
      },
    });

    // Notify internship poster (Admin)
    await tx.notification.create({
      data: {
        userId: internship.postedById,
        type: 'new_application',
        title: 'New Internship Application Received',
        body: `${student.firstName} ${student.lastName} has applied for your posting: ${internship.title}.`,
        actionUrl: `/admin/applications`,
      },
    });

    // Create Audit Log
    await tx.auditLog.create({
      data: {
        actorId: userId,
        action: 'application.create',
        entityType: 'Application',
        entityId: app.id,
      },
    });

    return app;
  });
};

const getMyApplications = async (userId) => {
  const apps = await prisma.application.findMany({
    where: { userId },
    include: {
      internship: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return apps.map(app => {
    try {
      if (typeof app.stageHistory === 'string') {
        app.stageHistory = JSON.parse(app.stageHistory);
      }
    } catch (e) {
      app.stageHistory = [];
    }
    return app;
  });
};

const getAllApplications = async (filters) => {
  const { page = 1, limit = 10, search = '', status = '' } = filters;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { coverLetter: { contains: search } },
      {
        user: {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
          ],
        },
      },
      {
        internship: {
          title: { contains: search },
        },
      },
    ];
  }

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            studentProfile: true,
          },
        },
        internship: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.application.count({ where }),
  ]);

  const parsedApps = applications.map(app => {
    try {
      if (typeof app.stageHistory === 'string') {
        app.stageHistory = JSON.parse(app.stageHistory);
      }
    } catch (e) {
      app.stageHistory = [];
    }
    return app;
  });

  return {
    applications: parsedApps,
    pagination: {
      page: parseInt(page),
      limit: take,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getApplicationById = async (userId, role, id) => {
  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
          phone: true,
          bio: true,
          studentProfile: true,
        },
      },
      internship: true,
    },
  });

  if (!app) return null;

  // Security check: Students can only view their own applications
  if (role === 'STUDENT' && app.userId !== userId) {
    throw new Error('Access denied. You can only view your own applications.');
  }

  try {
    if (typeof app.stageHistory === 'string') {
      app.stageHistory = JSON.parse(app.stageHistory);
    }
  } catch (e) {
    app.stageHistory = [];
  }

  return app;
};

const updateApplicationStatus = async (adminId, id, status, note = '') => {
  const app = await prisma.application.findUnique({
    where: { id },
    include: { internship: true, user: true },
  });

  if (!app) {
    throw new Error('Application record not found.');
  }

  let parsedHistory = [];
  try {
    parsedHistory = typeof app.stageHistory === 'string'
      ? JSON.parse(app.stageHistory)
      : app.stageHistory;
  } catch (e) {
    parsedHistory = [];
  }

  // Append new stage
  const updatedHistory = [
    ...parsedHistory,
    {
      stage: status,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${status} by Administrator.`,
    },
  ];

  const updateData = {
    status,
    stageHistory: JSON.stringify(updatedHistory),
  };

  // If rejected, set rejection note
  if (status === 'REJECTED') {
    updateData.rejectionReason = note;
  }

  // Update in DB
  const updatedApp = await prisma.application.update({
    where: { id },
    data: updateData,
    include: { internship: true },
  });

  try {
    if (typeof updatedApp.stageHistory === 'string') {
      updatedApp.stageHistory = JSON.parse(updatedApp.stageHistory);
    }
  } catch (e) {
    updatedApp.stageHistory = [];
  }

  // Notify student
  await prisma.notification.create({
    data: {
      userId: app.userId,
      type: 'application_update',
      title: `Application Status: ${status}`,
      body: `Your application for ${app.internship.title} at ${app.internship.companyName} has been updated to ${status}.`,
      actionUrl: '/applications',
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: `application.status_update_${status.toLowerCase()}`,
      entityType: 'Application',
      entityId: id,
    },
  });

  return updatedApp;
};

const withdrawApplication = async (userId, id) => {
  const app = await prisma.application.findUnique({
    where: { id },
    include: { internship: true },
  });

  if (!app || app.userId !== userId) {
    throw new Error('Application not found or unauthorized.');
  }

  if (app.status === 'WITHDRAWN') {
    return app;
  }

  let parsedHistory = [];
  try {
    parsedHistory = typeof app.stageHistory === 'string'
      ? JSON.parse(app.stageHistory)
      : app.stageHistory;
  } catch (e) {
    parsedHistory = [];
  }

  const updatedHistory = [
    ...parsedHistory,
    {
      stage: 'WITHDRAWN',
      timestamp: new Date().toISOString(),
      note: 'Application withdrawn by student.',
    },
  ];

  return await prisma.$transaction(async (tx) => {
    // 1. Set status to withdrawn
    const withdrawnApp = await tx.application.update({
      where: { id },
      data: {
        status: 'WITHDRAWN',
        stageHistory: JSON.stringify(updatedHistory),
      },
      include: { internship: true },
    });

    // 2. Increment back the internship openings if the student was previously HIRED or active
    // Normally, we just increment back openings on withdrawal
    await tx.internship.update({
      where: { id: app.internshipId },
      data: {
        openings: { increment: 1 },
      },
    });

    // Create Audit Log
    await tx.auditLog.create({
      data: {
        actorId: userId,
        action: 'application.withdraw',
        entityType: 'Application',
        entityId: id,
      },
    });

    return withdrawnApp;
  });
};

module.exports = {
  createApplication,
  getMyApplications,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  withdrawApplication,
};
