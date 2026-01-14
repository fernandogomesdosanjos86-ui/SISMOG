
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env');

let env = {};
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmpresas() {
    console.log('Verifying empresas table...');

    const { data, error } = await supabase
        .from('empresas')
        .select('*');

    if (error) {
        console.error('Error fetching empresas:', error.message);
        // specific check for relation not found
        if (error.message.includes('relation "public.empresas" does not exist')) {
            console.log('VERIFICATION FAILED: Table "empresas" does not exist. Please run the migration script.');
        }
    } else {
        console.log('VERIFICATION SUCCESS: Table exists.');
        console.log('Count:', data.length);
        console.log('Data:', JSON.stringify(data, null, 2));
    }
}

checkEmpresas();
