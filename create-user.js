
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
    const [key, value] = line.split('=')
    if (key && value) {
        env[key.trim()] = value.trim()
    }
})

const supabaseUrl = env['VITE_SUPABASE_URL']
const supabaseKey = env['VITE_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTeacher() {
    console.log('Attempting to create user: teacher@gmail.com')

    const { data, error } = await supabase.auth.signUp({
        email: 'teacher@gmail.com',
        password: 'teacher',
    })

    if (error) {
        console.error('Error creating user:', error.message)
    } else {
        console.log('User created successfully!')
        console.log('User ID:', data.user?.id)

        if (data.session) {
            console.log('Session active. You can now log in.')
        } else if (data.user && !data.session) {
            console.log('IMPORTANT: User created but no session returned.')
            console.log('This likely means "Confirm Email" is enabled in your Supabase project.')
            console.log('Please check your email (teacher@gmail.com) for a confirmation link, OR go to your Supabase Authentication dashboard and manually confirm this user.')
        }
    }
}

createTeacher()
