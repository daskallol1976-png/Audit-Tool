import { UserAccount, AuthSession, UserRole } from '../types/auth';

const USERS_STORAGE_KEY = 'audit_users_registry_v1';
const SESSION_STORAGE_KEY = 'audit_active_session_v1';

export const DEFAULT_ADMIN_EMAIL = 'das.kallol1976@gmail.com';
export const DEFAULT_ADMIN_TYPO_EMAIL = 'das.kallol1976@gmial.com';
export const DEFAULT_ADMIN_DEFAULT_PASSWORD = 'Polystudio@2026';

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-admin-default',
    name: 'Kallol Das (Super Admin)',
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_DEFAULT_PASSWORD,
    role: 'admin',
    createdAt: new Date().toISOString(),
    status: 'active',
    assignedVenue: 'All Venues (Master Admin)',
    assignedCity: 'Global',
  },
];

/**
 * Loads all registered users from storage, ensuring default admin always exists and removing old demo seeds.
 */
export function getAllUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    let users: UserAccount[] = JSON.parse(raw);
    
    // Purge any legacy sample demo accounts (e.g. auditor@venue.com)
    const cleanedUsers = users.filter(
      (u) => u.id !== 'user-auditor-sample' && u.email.toLowerCase() !== 'auditor@venue.com'
    );
    users = cleanedUsers;

    // Ensure default admin is present and synchronized with Polystudio@2026
    const adminUser = users.find(
      (u) =>
        u.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() ||
        u.email.toLowerCase() === DEFAULT_ADMIN_TYPO_EMAIL.toLowerCase()
    );
    if (!adminUser) {
      users.unshift(INITIAL_USERS[0]);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } else {
      if (adminUser.password !== DEFAULT_ADMIN_DEFAULT_PASSWORD) {
        adminUser.password = DEFAULT_ADMIN_DEFAULT_PASSWORD;
      }
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
    return users;
  } catch (e) {
    return INITIAL_USERS;
  }
}

/**
 * Saves users list to storage
 */
function saveUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users:', e);
  }
}

/**
 * Creates new user credentials
 */
export function createUser(payload: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  assignedVenue?: string;
  assignedCity?: string;
}): { success: boolean; user?: UserAccount; error?: string } {
  const users = getAllUsers();
  const cleanEmail = payload.email.trim().toLowerCase();

  if (!cleanEmail || !payload.password || !payload.name) {
    return { success: false, error: 'Name, Email/Username, and Password are required.' };
  }

  // Check duplicate
  const exists = users.some((u) => u.email.toLowerCase() === cleanEmail);
  if (exists) {
    return { success: false, error: `A user with email "${cleanEmail}" already exists.` };
  }

  const newUser: UserAccount = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: payload.name.trim(),
    email: cleanEmail,
    password: payload.password,
    role: payload.role,
    createdAt: new Date().toISOString(),
    status: 'active',
    assignedVenue: payload.assignedVenue?.trim() || undefined,
    assignedCity: payload.assignedCity?.trim() || undefined,
  };

  users.push(newUser);
  saveUsers(users);
  return { success: true, user: newUser };
}

/**
 * Updates an existing user's details
 */
export function updateUser(
  id: string,
  updates: Partial<Omit<UserAccount, 'id' | 'createdAt'>>
): { success: boolean; user?: UserAccount; error?: string } {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    return { success: false, error: 'User not found.' };
  }

  // Prevent demoting the super admin if it's the last admin
  if (
    (users[index].email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() ||
     users[index].email.toLowerCase() === DEFAULT_ADMIN_TYPO_EMAIL.toLowerCase()) &&
    updates.role === 'user'
  ) {
    return { success: false, error: 'Cannot demote the default Super Admin account.' };
  }

  users[index] = {
    ...users[index],
    ...updates,
  };

  saveUsers(users);
  return { success: true, user: users[index] };
}

/**
 * Deletes a user account
 */
export function deleteUser(id: string): { success: boolean; error?: string } {
  const users = getAllUsers();
  const target = users.find((u) => u.id === id);
  if (!target) {
    return { success: false, error: 'User not found.' };
  }

  if (
    target.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() ||
    target.email.toLowerCase() === DEFAULT_ADMIN_TYPO_EMAIL.toLowerCase()
  ) {
    return { success: false, error: 'Default Super Admin account cannot be deleted.' };
  }

  const filtered = users.filter((u) => u.id !== id);
  saveUsers(filtered);
  return { success: true };
}

/**
 * Authenticates user credentials
 */
export function authenticate(
  emailInput: string,
  passwordInput: string,
  roleConstraint?: UserRole
): { success: boolean; user?: UserAccount; error?: string } {
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  if (!cleanEmail || !cleanPass) {
    return { success: false, error: 'Please enter both Email/Username and Password.' };
  }

  const users = getAllUsers();

  // Match email (also accepting gmial typo for default admin)
  const user = users.find((u) => {
    const uEmail = u.email.toLowerCase();
    if (cleanEmail === DEFAULT_ADMIN_EMAIL || cleanEmail === DEFAULT_ADMIN_TYPO_EMAIL) {
      return uEmail === DEFAULT_ADMIN_EMAIL || uEmail === DEFAULT_ADMIN_TYPO_EMAIL;
    }
    return uEmail === cleanEmail;
  });

  if (!user) {
    return { success: false, error: 'Invalid email or username. User not found.' };
  }

  if (user.password !== cleanPass) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  if (user.status === 'inactive') {
    return { success: false, error: 'This user account is currently deactivated by the administrator.' };
  }

  if (roleConstraint && user.role !== roleConstraint && roleConstraint === 'admin') {
    return { success: false, error: 'This account does not have Administrator privileges. Please use User Login.' };
  }

  // Update last login
  user.lastLogin = new Date().toISOString();
  saveUsers(users);

  // Set session
  const session: AuthSession = {
    user,
    token: `token-${Date.now()}-${Math.random().toString(36).substring(2)}`,
    loginTime: new Date().toISOString(),
  };

  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    // Ignore in restricted sandboxes
  }

  return { success: true, user };
}

/**
 * Authenticates or registers a field auditor user directly using their Gmail ID (no password required).
 * User can optionally also specify their Hub In-Charge Name.
 * Regular users cannot obtain admin rights through this login.
 */
export function authenticateHubInChargeUser(
  gmailId: string,
  hubInChargeName?: string
): { success: boolean; user?: UserAccount; error?: string } {
  const cleanEmail = gmailId.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid Gmail ID.' };
  }

  // Format clean Hub In-Charge Name from input or derive from Gmail prefix
  let cleanName = hubInChargeName?.trim();
  if (!cleanName) {
    const prefix = cleanEmail.split('@')[0];
    cleanName = prefix
      .split(/[._-]/)
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ') || 'Hub In-Charge';
  }

  const users = getAllUsers();
  let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    // Register new user with entered Hub In-Charge credentials (no password required)
    user = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      email: cleanEmail,
      password: '', // No password required for users!
      role: 'user', // Strictly user role: User cannot use admin rights
      createdAt: new Date().toISOString(),
      status: 'active',
      lastLogin: new Date().toISOString(),
    };
    users.push(user);
  } else {
    if (hubInChargeName && hubInChargeName.trim()) {
      user.name = cleanName;
    }
    user.lastLogin = new Date().toISOString();
  }

  saveUsers(users);

  // Set session ensuring regular user role (users cannot use admin rights)
  const sessionUser: UserAccount = {
    ...user,
    role: 'user', // strictly enforced as non-admin
  };

  const session: AuthSession = {
    user: sessionUser,
    token: `token-hub-${Date.now()}-${Math.random().toString(36).substring(2)}`,
    loginTime: new Date().toISOString(),
  };

  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    // Ignore
  }

  return { success: true, user: sessionUser };
}

/**
 * Gets currently active session
 */
export function getActiveSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Clears current session
 */
export function logoutSession(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    // Ignore
  }
}

/**
 * Generates a clean random password
 */
export function generateStrongPassword(): string {
  const prefix = ['Auditor', 'Venue', 'NetScan', 'Secure', 'Inspector'][Math.floor(Math.random() * 5)];
  const num = Math.floor(1000 + Math.random() * 9000);
  const symbol = ['@', '#', '$', '!'][Math.floor(Math.random() * 4)];
  return `${prefix}${symbol}${num}`;
}

/**
 * Formats a shareable text snippet for sending to users
 */
export function formatCredentialsShareText(user: UserAccount, appUrl = window.location.href): string {
  return `🔐 *Venue Network Auditor Login Credentials*
---------------------------------------
👤 *Name:* ${user.name}
📧 *Username/Email:* ${user.email}
🔑 *Password:* ${user.password}
🛡️ *Role:* ${user.role === 'admin' ? 'Administrator' : 'Field Auditor / User'}
📍 *Assigned Venue:* ${user.assignedVenue || 'All Venues'}
🌐 *Login Portal:* ${appUrl}
---------------------------------------
_Please keep these credentials secure. Once logged in, you can start the venue network auto-scan._`;
}
