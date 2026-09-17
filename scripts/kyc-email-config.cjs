// Prints only a scoped verifier SQL statement, never the Resend key or delivery capability.
// Run: node --env-file=.env.local scripts/kyc-email-config.cjs
const { createHmac, createHash } = require('node:crypto');
const key = process.env.RESEND_API_KEY;
if (!key) throw new Error('RESEND_API_KEY is required');
const capability = createHmac('sha256', key).update('kyc-admin-notifications-v1').digest('hex');
const hash = createHash('sha256').update(capability).digest('hex');
console.log(`insert into kyc_private.notification_config(id, secret_hash) values (true, '${hash}') on conflict(id) do update set secret_hash=excluded.secret_hash;`);
