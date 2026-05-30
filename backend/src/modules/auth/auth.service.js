const prisma = require('../../config/db');
const bcrypt = require('bcryptjs');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../config/jwt');

const registerUser = async (userData) => {
  const { email, password, firstName, lastName, phone, bio } = userData;

  // 1. Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('A user with this email address already exists.');
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // 3. Create User and related StudentProfile in a transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        bio,
        role: 'STUDENT', // Default is STUDENT
        isVerified: true, // Auto-verify for simplicity
      },
    });

    await tx.studentProfile.create({
      data: {
        userId: newUser.id,
        availability: 'IMMEDIATE',
        skills: '[]', // stringified JSON array for SQLite compatibility
        profileScore: 20, // default score with registration
      },
    });

    return newUser;
  });

  // 4. Generate tokens
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  // 5. Store refresh token in user record
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  // Hide password hash
  delete user.passwordHash;

  return { user, accessToken, refreshToken };
};

const loginUser = async (email, password) => {
  // 1. Fetch user by email
  const user = await prisma.user.findUnique({
    where: { email },
    include: { studentProfile: true },
  });

  if (!user || !user.isActive) {
    throw new Error('Invalid email or password.');
  }

  // 2. Verify password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  // 3. Generate tokens
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  // 4. Update refresh token on user model
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  // Create audit log for login
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: 'auth.login',
      entityType: 'User',
      entityId: user.id,
    },
  });

  delete user.passwordHash;
  delete user.refreshToken;

  return { user, accessToken, refreshToken };
};

const refreshSession = async (token) => {
  // 1. Verify token signature
  const decoded = verifyRefreshToken(token);
  if (!decoded) {
    throw new Error('Refresh token is expired or invalid.');
  }

  // 2. Find user in database, verify persisted refresh token matches
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || user.refreshToken !== token || !user.isActive) {
    throw new Error('Session has been revoked or is invalid.');
  }

  // 3. Sign new access + refresh token (rotating session)
  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);

  // 4. Update user record
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const logoutUser = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: 'auth.logout',
      entityType: 'User',
      entityId: userId,
    },
  });

  return true;
};

const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studentProfile: true,
      applications: {
        select: { id: true, status: true },
      },
    },
  });

  if (!user) return null;
  delete user.passwordHash;
  return user;
};

module.exports = {
  registerUser,
  loginUser,
  refreshSession,
  logoutUser,
  getUserById,
};
