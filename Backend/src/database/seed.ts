import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';
import { AuthProvider } from './entities/auth.providers.entity';
import { authProviders } from '../common/enums/authproviders.enum';

const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '',
  database: 'test',

  entities: [User, Role, Permission, AuthProvider],
  synchronize: true,
  logging: false,
});

export async function runSeed(dataSource: DataSource) {
  const permissionRepo = dataSource.getRepository(Permission);
  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);
  const authProviderRepo = dataSource.getRepository(AuthProvider);

  /* -------------------------------- PERMISSIONS -------------------------------- */

  const permissionCodes = [
    'PRODUCT_CREATE',
    'PRODUCT_UPDATE',
    'PRODUCT_DELETE',
    'PRODUCT_VIEW',

    'ORDER_CREATE',
    'ORDER_UPDATE',
    'ORDER_VIEW',
    'ORDER_CANCEL',

    'INVENTORY_MANAGE',

    'USER_MANAGE',
    'ROLE_MANAGE',
    'PERMISSION_MANAGE',
  ];

  const permissions: Permission[] = [];

  for (const code of permissionCodes) {
    let permission = await permissionRepo.findOne({ where: { code } });

    if (!permission) {
      permission = permissionRepo.create({ code });
      await permissionRepo.save(permission);
    }

    permissions.push(permission);
  }

  /* -------------------------------- ROLES -------------------------------- */

  const adminRole = roleRepo.create({
    name: 'ADMIN',
    permissions,
  });

  const staffRole = roleRepo.create({
    name: 'STAFF',
    permissions: permissions.filter((p) =>
      [
        'PRODUCT_CREATE',
        'PRODUCT_UPDATE',
        'PRODUCT_DELETE',
        'PRODUCT_VIEW',
        'ORDER_CREATE',
        'ORDER_UPDATE',
        'ORDER_VIEW',
        'INVENTORY_MANAGE',
      ].includes(p.code),
    ),
  });

  const customerRole = roleRepo.create({
    name: 'CUSTOMER',
    permissions: permissions.filter((p) =>
      ['PRODUCT_VIEW', 'ORDER_CREATE', 'ORDER_VIEW'].includes(p.code),
    ),
  });

  await roleRepo.save([adminRole, staffRole, customerRole]);

  /* -------------------------------- USERS -------------------------------- */

  const passwordHash = await bcrypt.hash('password123', 10);

  const adminUser = userRepo.create({
    name: 'Store Admin',
    email: 'admin@clothingstore.com',
    password: passwordHash,
    emailVerified: true,
    roles: [adminRole],
  });

  const staffUser = userRepo.create({
    name: 'Store Staff',
    email: 'staff@clothingstore.com',
    password: passwordHash,
    emailVerified: true,
    roles: [staffRole],
  });

  const customerUser = userRepo.create({
    name: 'John Customer',
    email: 'customer@gmail.com',
    password: passwordHash,
    emailVerified: true,
    roles: [customerRole],
  });

  await userRepo.save([adminUser, staffUser, customerUser]);

  /* -------------------------------- AUTH PROVIDERS -------------------------------- */

  const authProvidersData = [
    authProviderRepo.create({
      user: adminUser,
      provider: authProviders.LOCAL,
      providerUserId: adminUser.email,
      refresh_token: 'dummy-refresh-token-admin',
    }),

    authProviderRepo.create({
      user: staffUser,
      provider: authProviders.GOOGLE,
      providerUserId: 'google-uid-staff-123',
      refresh_token: 'dummy-refresh-token-google',
    }),

    authProviderRepo.create({
      user: customerUser,
      provider: authProviders.GITHUB,
      providerUserId: 'github-uid-customer-456',
      refresh_token: 'dummy-refresh-token-github',
    }),
  ];

  await authProviderRepo.save(authProvidersData);

  console.log('✅ Database seeded successfully');
}

async function bootstrap() {
  try {
    console.log('Starting database seed...');

    await AppDataSource.initialize();
    console.log('Database connected');

    await runSeed(AppDataSource);

    await AppDataSource.destroy();
    console.log('Seeding finished');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed', error);
    process.exit(1);
  }
}

bootstrap();