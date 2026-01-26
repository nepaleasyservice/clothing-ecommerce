import { In } from 'typeorm';
import { AppDataSource } from './data-source';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';
import * as argon2 from 'argon2';

// If you want password hashing, install argon2 and hash here.
// For now: plain text (NOT for production).
async function seed() {
  await AppDataSource.initialize();

  const permRepo = AppDataSource.getRepository(Permission);
  const roleRepo = AppDataSource.getRepository(Role);
  const userRepo = AppDataSource.getRepository(User);

  // 1) Seed permissions
  const permissionCodes = [
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'role:create',
    'role:read',
    'role:update',
    'role:delete',
    'permission:read',
  ];

  // Insert missing permissions only
  const existingPerms = await permRepo.find({
    where: { code: In(permissionCodes) },
  });
  const existingCodes = new Set(existingPerms.map((p) => p.code));

  const newPerms = permissionCodes
    .filter((code) => !existingCodes.has(code))
    .map((code) => permRepo.create({ code }));

  if (newPerms.length) await permRepo.save(newPerms);

  const allPerms = await permRepo.find({
    where: { code: In(permissionCodes) },
  });

  // helper: get permissions by code
  const permsByCode = (codes: string[]) =>
    allPerms.filter((p) => codes.includes(p.code));

  // 2) Seed roles + attach permissions
  const rolesToSeed: Array<{ name: string; permCodes: string[] }> = [
    {
      name: 'SUPERADMIN',
      permCodes: permissionCodes, // everything
    },
    {
      name: 'ADMIN',
      permCodes: [
        'user:create',
        'user:read',
        'user:update',
        'user:delete',
        'role:read',
        'permission:read',
      ],
    },
    {
      name: 'USER',
      permCodes: ['user:read'],
    },
  ];

  for (const r of rolesToSeed) {
    let role = await roleRepo.findOne({ where: { name: r.name } });

    if (!role) {
      role = roleRepo.create({
        name: r.name,
        permissions: permsByCode(r.permCodes),
      });
    } else {
      // Update permissions if role already exists
      role.permissions = permsByCode(r.permCodes);
    }

    await roleRepo.save(role);
  }

  const superAdminRole = await roleRepo.findOne({
    where: { name: 'SUPERADMIN' },
  });
  const adminRole = await roleRepo.findOne({ where: { name: 'ADMIN' } });
  const userRole = await roleRepo.findOne({ where: { name: 'USER' } });

  if (!superAdminRole || !adminRole || !userRole) {
    throw new Error('Roles not created correctly.');
  }

  // 3) Seed users (example)
  // NOTE: In production, hash passwords.
  const rawUsers = [
    {
      name: 'Super Admin',
      email: 'superadmin@test.com',
      password: 'SuperAdmin@123!',
      roles: [superAdminRole],
      isActive: true,
    },
    {
      name: 'Admin',
      email: 'admin@test.com',
      password: 'Admin@123!',
      roles: [adminRole],
      isActive: true,
    },
    {
      name: 'Normal User',
      email: 'user@test.com',
      password: 'User@123!',
      roles: [userRole],
      isActive: true,
    },
  ];
  const usersToSeed = await Promise.all(
    rawUsers.map(async (user) => ({
      ...user,
      password: await argon2.hash(user.password),
    })),
  );

  for (const u of usersToSeed) {
    const existing = await userRepo.findOne({
      where: { email: u.email },
    });
    if (existing) continue;

    const user = userRepo.create(u);
    await userRepo.save(user);
  }
  console.log('Seeding complete.');
  await AppDataSource.destroy();
}

seed().catch(async (err) => {
  console.error('Seeding failed:', err);
  try {
    await AppDataSource.destroy();
  } catch {}
  process.exit(1);
});
