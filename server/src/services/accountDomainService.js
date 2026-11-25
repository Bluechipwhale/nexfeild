import { db } from '../config/database.js';
import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { recordAudit } from '../middleware/auditLogger.js';
const oldDomain = value => /@(?:edgewforce\.com|edgewforce\.com\.ng)$/i.test(String(value || ''));
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), {
    status
  });
};
async function adminFor(actor) {
  const u = actor?.id ? await db.findById('users', actor.id) : null;
  if (!u || u.status !== 'active' || u.role_code !== 'SUPER_ADMIN' || u.company_id !== actor.company_id) fail('A super administrator is required for login-domain migration.', 403);
  if (db.isCloud) fail('This migration requires the standalone transactional database.');
  return u;
}
async function planFor(admin) {
  const users = await db.findAll('users', {
      company_id: admin.company_id
    }),
    allUsers = await db.findAll('users'),
    employees = await db.findAll('employees', {
      company_id: admin.company_id
    });
  const reserved = new Map(allUsers.filter(u => !oldDomain(u.email)).map(u => [String(u.email || '').toLowerCase(), u.id]));
  const changes = [];
  for (const user of users.filter(u => oldDomain(u.email)).sort((a, b) => a.id - b.id)) {
    const local = user.email.slice(0, user.email.lastIndexOf('@')).toLowerCase();
    let next = `${local}@eedgewforce.com.ng`;
    const employee = employees.find(e => e.user_id === user.id);
    if (reserved.has(next) && reserved.get(next) !== user.id) {
      const suffix = String(employee?.staff_id || employee?.employee_code || `user${user.id}`).toLowerCase().replace(/[^a-z0-9]/g, '');
      next = `${local.slice(0, 35)}.${suffix.slice(0, 20)}@eedgewforce.com.ng`;
      let index = 1;
      while (reserved.has(next)) next = `${local.slice(0, 35)}.user${user.id}.${index++}@eedgewforce.com.ng`;
    }
    reserved.set(next, user.id);
    changes.push({
      user_id: user.id,
      name: user.full_name,
      old_email: user.email,
      new_email: next,
      role: user.role_code,
      status: user.status,
      staff_id: employee?.staff_id || employee?.employee_code || null
    });
  }
  const fingerprint = createHash('sha256').update(JSON.stringify(changes)).digest('hex');
  return {
    changes,
    fingerprint
  };
}
export const accountDomainService = {
  async preview(actor) {
    return planFor(await adminFor(actor));
  },
  async apply(input, actor) {
    const admin = await adminFor(actor);
    if (!Array.isArray(input.credentials)) fail('Provide the temporary credentials prepared for this migration.');
    const hashes = new Map();
    for (const entry of input.credentials) {
      if (hashes.has(Number(entry.user_id)) || typeof entry.password !== 'string' || entry.password.length < 16 || entry.password.length > 128 || entry.password !== entry.password.trim()) fail('Each affected account needs one unique temporary password of 16–128 characters.');
      hashes.set(Number(entry.user_id), await bcrypt.hash(entry.password, 12));
    }
    return db.transaction(async () => {
      const {
        changes,
        fingerprint
      } = await planFor(admin);
      if (fingerprint !== input.expected_fingerprint) fail('Account details changed since the preview. Review a fresh migration preview.', 409);
      if (hashes.size !== changes.length || changes.some(c => !hashes.has(c.user_id))) fail('Temporary credentials must match every account in the preview exactly.');
      const now = new Date().toISOString();
      const allUsers = await db.findAll('users'),
        newOwners = new Map(allUsers.map(u => [String(changes.find(c => c.user_id === u.id)?.new_email || u.email || '').toLowerCase(), u.id]));
      for (const change of changes) {
        await db.update('users', change.user_id, {
          email: change.new_email,
          password_hash: hashes.get(change.user_id),
          requires_password_change: true,
          password_changed_at: now,
          session_invalid_before: now,
          reset_token: null,
          reset_token_expires_at: null
        });
        for (const e of await db.findAll('employees', {
          user_id: change.user_id,
          company_id: admin.company_id
        })) {
          const patch = {};
          for (const field of ['email', 'work_email', 'personal_email']) if (oldDomain(e[field])) {
            let email = String(e[field]).toLowerCase().replace(/@(?:edgewforce\.com|edgewforce\.com\.ng)$/, '@eedgewforce.com.ng');
            if (String(e[field]).toLowerCase() === change.old_email.toLowerCase() || newOwners.has(email) && newOwners.get(email) !== change.user_id) email = change.new_email;
            patch[field] = email;
          }
          if (Object.keys(patch).length) await db.update('employees', e.id, patch);
        }
        for (const session of await db.findAll('workforce_access_sessions', {
          company_id: admin.company_id,
          user_id: change.user_id
        })) if (['active', 'pending'].includes(session.state)) await db.update('workforce_access_sessions', session.id, {
          state: 'revoked',
          revoked_at: now,
          revoke_reason: 'login_domain_and_password_changed'
        });
        await recordAudit(admin, 'LOGIN_DOMAIN_MIGRATED', 'users', change.user_id, {
          old_email: change.old_email,
          new_email: change.new_email,
          temporary_password_required: true
        });
      }
      return {
        updated: changes.length,
        changes,
        completed_at: now
      };
    });
  }
};
