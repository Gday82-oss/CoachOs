import { readFileSync } from 'fs';
import { createClient } from '/opt/mycarecoach/node_modules/@supabase/supabase-js/dist/index.mjs';

const env = Object.fromEntries(
  readFileSync('/opt/mycarecoach/.env', 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Vérifie les policies existantes sur clients
const { data: policies, error: polErr } = await supabase
  .from('pg_policies')
  .select('policyname, cmd, qual')
  .eq('tablename', 'clients');

console.log('Policies existantes sur clients:', JSON.stringify(policies, null, 2));
if (polErr) console.log('Erreur lecture policies:', polErr.message);

// Tente d'executer le SQL via l'API REST Supabase (pg_net ou direct)
const url = env.SUPABASE_URL + '/rest/v1/rpc/exec_sql';
const res = await fetch(url, {
  method: 'POST',
  headers: {
    'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ sql: 'SELECT current_user;' })
});
console.log('RPC status:', res.status, await res.text());
