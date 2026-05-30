const prisma = require('../../config/db');

const getInternships = async (filters) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    domain = '',
    location = '',
    isRemote,
    stipendMin,
    skills,
    sort = 'createdAt',
    order = 'desc',
    status = 'ACTIVE',
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Construct query where clause
  const where = {
    status,
  };

  // Search logic (mimicking full-text search using contains)
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { companyName: { contains: search } },
      { domain: { contains: search } },
    ];
  }

  if (domain) {
    where.domain = { contains: domain };
  }

  if (location) {
    where.location = { contains: location };
  }

  if (isRemote !== undefined) {
    where.isRemote = isRemote === 'true';
  }

  if (stipendMin) {
    where.stipendMax = { gte: parseInt(stipendMin) };
  }

  const allInternships = await prisma.internship.findMany({
    where,
    orderBy: { [sort]: order },
  });

  // If filtering by skills (in JS memory since SQLite JSON arrays require custom queries)
  let filtered = allInternships;
  if (skills) {
    const filterSkills = Array.isArray(skills) ? skills : [skills];
    filtered = allInternships.filter(internship => {
      let required = [];
      try {
        required = typeof internship.skillsRequired === 'string'
          ? JSON.parse(internship.skillsRequired)
          : internship.skillsRequired;
      } catch (e) {
        required = [];
      }
      return filterSkills.every(skill => required.includes(skill));
    });
  }

  // Handle pagination in memory if skills filter applied, otherwise slide-down
  const total = filtered.length;
  const paginated = filtered.slice(skip, skip + take).map(internship => {
    try {
      if (typeof internship.skillsRequired === 'string') {
        internship.skillsRequired = JSON.parse(internship.skillsRequired);
      }
    } catch (e) {
      internship.skillsRequired = [];
    }
    return internship;
  });

  return {
    internships: paginated,
    pagination: {
      page: parseInt(page),
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

const getInternshipById = async (id) => {
  // Increment view count using transaction or direct update
  const internship = await prisma.internship.update({
    where: { id },
    data: { viewsCount: { increment: 1 } },
  });
  try {
    if (typeof internship.skillsRequired === 'string') {
      internship.skillsRequired = JSON.parse(internship.skillsRequired);
    }
  } catch (e) {
    internship.skillsRequired = [];
  }
  return internship;
};

const createInternship = async (userId, data) => {
  const {
    title, companyName, companyLogo, description, responsibilities, requirements,
    skillsRequired, domain, location, isRemote, durationWeeks, stipendMin, stipendMax,
    openings, minGpa, applicationDeadline, startDate, isFeatured
  } = data;

  const parsedSkills = Array.isArray(skillsRequired) ? skillsRequired : (skillsRequired ? JSON.parse(skillsRequired) : []);

  const internship = await prisma.internship.create({
    data: {
      title,
      companyName,
      companyLogo,
      description,
      responsibilities,
      requirements,
      skillsRequired: JSON.stringify(parsedSkills),
      domain,
      location,
      isRemote: isRemote === 'true' || isRemote === true,
      durationWeeks: parseInt(durationWeeks),
      stipendMin: stipendMin ? parseInt(stipendMin) : null,
      stipendMax: stipendMax ? parseInt(stipendMax) : null,
      openings: openings ? parseInt(openings) : 1,
      minGpa: minGpa ? parseFloat(minGpa) : null,
      applicationDeadline: new Date(applicationDeadline),
      startDate: new Date(startDate),
      isFeatured: isFeatured === 'true' || isFeatured === true,
      postedById: userId,
      status: 'ACTIVE',
    },
  });

  try {
    if (typeof internship.skillsRequired === 'string') {
      internship.skillsRequired = JSON.parse(internship.skillsRequired);
    }
  } catch (e) {
    internship.skillsRequired = [];
  }

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: 'internship.create',
      entityType: 'Internship',
      entityId: internship.id,
    },
  });

  return internship;
};

const updateInternship = async (userId, id, data) => {
  const {
    title, companyName, companyLogo, description, responsibilities, requirements,
    skillsRequired, domain, location, isRemote, durationWeeks, stipendMin, stipendMax,
    openings, minGpa, applicationDeadline, startDate, isFeatured, status
  } = data;

  const parsedSkills = Array.isArray(skillsRequired) ? skillsRequired : (skillsRequired ? JSON.parse(skillsRequired) : undefined);

  const internship = await prisma.internship.update({
    where: { id },
    data: {
      title,
      companyName,
      companyLogo,
      description,
      responsibilities,
      requirements,
      skillsRequired: parsedSkills ? JSON.stringify(parsedSkills) : undefined,
      domain,
      location,
      isRemote: isRemote !== undefined ? (isRemote === 'true' || isRemote === true) : undefined,
      durationWeeks: durationWeeks ? parseInt(durationWeeks) : undefined,
      stipendMin: stipendMin !== undefined ? (stipendMin ? parseInt(stipendMin) : null) : undefined,
      stipendMax: stipendMax !== undefined ? (stipendMax ? parseInt(stipendMax) : null) : undefined,
      openings: openings ? parseInt(openings) : undefined,
      minGpa: minGpa !== undefined ? (minGpa ? parseFloat(minGpa) : null) : undefined,
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      isFeatured: isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : undefined,
      status,
    },
  });

  try {
    if (typeof internship.skillsRequired === 'string') {
      internship.skillsRequired = JSON.parse(internship.skillsRequired);
    }
  } catch (e) {
    internship.skillsRequired = [];
  }

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: 'internship.update',
      entityType: 'Internship',
      entityId: internship.id,
    },
  });

  return internship;
};

const softDeleteInternship = async (userId, id) => {
  const internship = await prisma.internship.update({
    where: { id },
    data: { status: 'CLOSED' },
  });

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: 'internship.soft_delete',
      entityType: 'Internship',
      entityId: internship.id,
    },
  });

  return internship;
};

const getRecommendedInternships = async (userId) => {
  // 1. Fetch student profile & skills
  const student = await prisma.user.findUnique({
    where: { id: userId },
    include: { studentProfile: true },
  });

  if (!student || !student.studentProfile) {
    throw new Error('Student profile not found.');
  }

  let studentSkills = [];
  try {
    studentSkills = typeof student.studentProfile.skills === 'string'
      ? JSON.parse(student.studentProfile.skills)
      : student.studentProfile.skills;
  } catch (e) {
    studentSkills = [];
  }

  if (!Array.isArray(studentSkills) || studentSkills.length === 0) {
    // If student has no skills listed, return top featured or active internships
    return await prisma.internship.findMany({
      where: { status: 'ACTIVE', openings: { gt: 0 } },
      orderBy: { viewsCount: 'desc' },
      take: 5,
    });
  }

  // 2. Fetch all active internships
  const activeInternships = await prisma.internship.findMany({
    where: { status: 'ACTIVE', openings: { gt: 0 } },
  });

  // 3. Compute overlap score
  const scored = activeInternships.map(internship => {
    let reqSkills = [];
    try {
      reqSkills = typeof internship.skillsRequired === 'string'
        ? JSON.parse(internship.skillsRequired)
        : internship.skillsRequired;
    } catch (e) {
      reqSkills = [];
    }

    if (!Array.isArray(reqSkills) || reqSkills.length === 0) {
      return { internship, score: 100 }; // 100% match if no requirements
    }

    const overlap = reqSkills.filter(skill => studentSkills.includes(skill));
    const score = Math.round((overlap.length / reqSkills.length) * 100);

    return {
      internship,
      score,
    };
  });

  // 4. Sort and return top 5
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => ({
      ...item.internship,
      matchScore: item.score,
    }));
};

module.exports = {
  getInternships,
  getInternshipById,
  createInternship,
  updateInternship,
  softDeleteInternship,
  getRecommendedInternships,
};
