const prisma = require('../../config/db');

const getAllUsers = async (filters) => {
  const { page = 1, limit = 10, search = '', role = '' } = filters;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {};

  if (role) {
    where.role = role;
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { studentProfile: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  users.forEach(u => delete u.passwordHash);

  return {
    users,
    pagination: {
      page: parseInt(page),
      limit: take,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const toggleUserStatus = async (adminId, id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error('User not found.');
  }

  if (user.id === adminId) {
    throw new Error('You cannot deactivate your own administrator account.');
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: updatedUser.isActive ? 'user.activate' : 'user.deactivate',
      entityType: 'User',
      entityId: id,
    },
  });

  delete updatedUser.passwordHash;
  return updatedUser;
};

const getAuditLogs = async () => {
  return await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100, // limit to last 100 entries for safety and speed
  });
};

const getPendingLogs = async () => {
  return await prisma.dailyLog.findMany({
    where: { status: 'PENDING' },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { logDate: 'desc' },
  });
};

module.exports = {
  getAllUsers,
  toggleUserStatus,
  getAuditLogs,
  getPendingLogs,
};
