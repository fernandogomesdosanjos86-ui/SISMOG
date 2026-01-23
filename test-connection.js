import { createClient } from '@supabase/supabase-js'

// Manually load env for this script context
const SUPABASE_URL = 'https://popujqfurfyptnwhxwys.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcHVqcWZ1cmZ5cHRud2h4d3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODU3ODcsImV4cCI6MjA4NDA2MTc4N30.b7md2e0MWiUrZPlkf6Sazeb3gk-UhhNR7kqqG2Ft8n0'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testConnection() {
    try {
        console.log('Testing connection to companies...')
        const { data: companies, error: errorCompanies } = await supabase.from('empresas').select('count', { count: 'exact', head: true })
        if (errorCompanies) throw errorCompanies
        console.log('Connection to empresas: OK')

        console.log('Testing connection to cargos_salarios...')
        const { data: cargos, error: errorCargos } = await supabase.from('cargos_salarios').select('count', { count: 'exact', head: true })
        if (errorCargos) throw errorCargos
        console.log('Connection to cargos_salarios: OK')

        console.log('All systems operational.')
        process.exit(0)
    } catch (error) {
        console.error('Connection failed:', error)
        process.exit(1)
    }
}

testConnection()
