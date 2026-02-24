import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Read .env file manually
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')

const env = {}
envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) {
        env[key.trim()] = rest.join('=').trim()
    }
})

const supabaseUrl = env['VITE_SUPABASE_URL']
const supabaseKey = env['VITE_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const students = [
    { email: 'srcw2326j130@srcw.ac.in', name: 'Mahesh Prabha.M' },
    { email: 'srcw2326j138@srcw.ac.in', name: 'Ramya.C' },
    { email: 'srcw2326j145@srcw.ac.in', name: 'Sankari.D' },
    { email: 'srcw2326j108@srcw.ac.in', name: 'Arya.B' },
    { email: 'srcw2326j144@srcw.ac.in', name: 'Sandhiya sri.V' },
    { email: 'srcw2326j125@srcw.ac.in', name: 'Ilakkiya.R' },
    { email: 'srcw2326j122@srcw.ac.in', name: 'Janani.B' },
    { email: 'srcw2326j135@srcw.ac.in', name: 'Nandhini.T' },
    { email: 'srcw2326j128@srcw.ac.in', name: 'Laavanya.K' },
    { email: 'srcw2326j109@srcw.ac.in', name: 'Bharathi.R' },
]

async function insertStudents() {
    // Sign in as teacher first to get an authenticated session
    console.log('Signing in as teacher...')
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: 'teacher@gmail.com',
        password: 'teacher'
    })

    if (signInError) {
        console.warn(`Sign-in failed: ${signInError.message}`)
        console.log('Proceeding without auth (may fail if RLS is strict)...')
    } else {
        console.log('Signed in successfully.\n')
    }

    console.log(`Inserting ${students.length} students...`)

    let inserted = 0
    let skipped = 0

    for (const student of students) {
        const { error } = await supabase
            .from('students')
            .insert(student)

        if (error) {
            if (error.message.includes('duplicate') || error.message.includes('unique') || error.code === '23505') {
                console.warn(`  ⚠ Already exists, skipped: ${student.name} (${student.email})`)
                skipped++
            } else {
                console.error(`  ✗ Failed ${student.email}: ${error.message}`)
            }
        } else {
            console.log(`  ✓ Inserted: ${student.name} (${student.email})`)
            inserted++
        }
    }

    console.log(`\n✅ Done! ${inserted} inserted, ${skipped} skipped (already existed).`)
    await supabase.auth.signOut()
}

insertStudents()
