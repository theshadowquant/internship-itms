const prisma = require('../../config/db');
const { uploadToStorage } = require('../../config/cloudinary');

const calculateProfileScore = (user, profile) => {
  let score = 0;

  // 1. Basic Info: Name, Phone, Bio (Max 30)
  if (user.firstName && user.lastName) score += 10;
  if (user.phone) score += 10;
  if (user.bio) score += 10;

  // 2. Avatar (Max 10)
  if (user.avatarUrl) score += 10;

  // 3. Academic Details: College, Degree, Branch, GPA (Max 30)
  if (profile.collegeName) score += 10;
  if (profile.degree && profile.branch) score += 10;
  if (profile.gpa) score += 10;

  // 4. Professional: Skills list, Portfolio/Social Links, Resume (Max 30)
  if (Array.isArray(profile.skills) && profile.skills.length > 0) score += 10;
  if (profile.resumeUrl) score += 10;
  if (profile.portfolioUrl || profile.linkedinUrl || profile.githubUrl) score += 10;

  return score;
};

const getUserProfile = async (userId) => {
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    include: { studentProfile: true },
  });
  if (profile) {
    delete profile.passwordHash;
    if (profile.studentProfile && typeof profile.studentProfile.skills === 'string') {
      try {
        profile.studentProfile.skills = JSON.parse(profile.studentProfile.skills);
      } catch (e) {
        profile.studentProfile.skills = [];
      }
    }
  }
  return profile;
};

const updateUserProfile = async (userId, data) => {
  const {
    firstName, lastName, phone, bio,
    collegeName, degree, branch, graduationYear, gpa,
    skills, portfolioUrl, linkedinUrl, githubUrl, resumeUrl,
    availability, expectedStipend
  } = data;

  // Perform inside a single transaction
  return await prisma.$transaction(async (tx) => {
    // 1. Update Core User Details
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phone,
        bio,
      },
    });

    // 2. Fetch existing profile to compute score
    const currentProfile = await tx.studentProfile.findUnique({
      where: { userId },
    });

    const parsedSkills = Array.isArray(skills) ? skills : (skills ? JSON.parse(skills) : []);

    // 3. Update Student Profile Details
    const updatedProfile = await tx.studentProfile.update({
      where: { userId },
      data: {
        collegeName,
        degree,
        branch,
        graduationYear: graduationYear ? parseInt(graduationYear) : undefined,
        gpa: gpa ? parseFloat(gpa) : undefined,
        skills: JSON.stringify(parsedSkills),
        portfolioUrl,
        linkedinUrl,
        githubUrl,
        resumeUrl,
        availability,
        expectedStipend: expectedStipend ? parseInt(expectedStipend) : undefined,
      },
    });

    // 4. Calculate Profile Strength Score
    const finalScore = calculateProfileScore(updatedUser, updatedProfile);

    // 5. Save Score
    const profileWithScore = await tx.studentProfile.update({
      where: { userId },
      data: { profileScore: finalScore },
    });

    // Create Audit Log
    await tx.auditLog.create({
      data: {
        actorId: userId,
        action: 'user.update_profile',
        entityType: 'User',
        entityId: userId,
      },
    });

    return {
      ...updatedUser,
      studentProfile: profileWithScore,
    };
  });
};

const updateAvatar = async (userId, fileBuffer, originalName) => {
  // Upload locally using our Cloudinary mock helper
  const uploadResult = await uploadToStorage(fileBuffer, originalName);

  // Update user avatar in DB
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: uploadResult.secure_url },
    include: { studentProfile: true },
  });

  // Re-calculate profile score with the new avatar
  if (updatedUser.studentProfile) {
    let parsedSkills = [];
    try {
      if (typeof updatedUser.studentProfile.skills === 'string') {
        parsedSkills = JSON.parse(updatedUser.studentProfile.skills);
      } else {
        parsedSkills = updatedUser.studentProfile.skills;
      }
    } catch (e) {
      parsedSkills = [];
    }

    const tempProfile = { ...updatedUser.studentProfile, skills: parsedSkills };
    const newScore = calculateProfileScore(updatedUser, tempProfile);
    
    await prisma.studentProfile.update({
      where: { userId },
      data: { profileScore: newScore },
    });
    
    updatedUser.studentProfile.profileScore = newScore;
    updatedUser.studentProfile.skills = parsedSkills;
  }

  delete updatedUser.passwordHash;
  return updatedUser;
};

const getNotifications = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    },
  };
};

const markAllNotificationsRead = async (userId) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return true;
};

const markNotificationRead = async (userId, notificationId) => {
  const notif = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notif || notif.userId !== userId) {
    throw new Error('Notification not found or access denied.');
  }

  return await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateAvatar,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
};
