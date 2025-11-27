import { useState } from 'react'
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../services/supabaseClient'

export default function DatabaseTest() {
    const { user } = useAuthStore()
    const [testResults, setTestResults] = useState([])
    const [isRunning, setIsRunning] = useState(false)

    const addResult = (test, status, message) => {
        setTestResults(prev => [...prev, { test, status, message, timestamp: new Date().toISOString() }])
    }

    const runTests = async () => {
        setIsRunning(true)
        setTestResults([])

        try {
            // Test 1: Connection
            addResult('Connection', 'running', 'Testing Supabase connection...')
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            if (sessionError) throw sessionError
            addResult('Connection', 'success', `Connected as ${session?.user?.email || 'anonymous'}`)

            if (!user) {
                addResult('Auth', 'warning', 'Not authenticated. Some tests will be skipped.')
                setIsRunning(false)
                return
            }

            // Test 2: Saved Designs Table
            addResult('saved_designs', 'running', 'Testing saved_designs table...')
            const { data: designs, error: designsError } = await supabase
                .from('saved_designs')
                .select('*')
                .limit(1)

            if (designsError) {
                addResult('saved_designs', 'error', `Error: ${designsError.message}`)
            } else {
                addResult('saved_designs', 'success', `Table accessible. Found ${designs?.length || 0} designs.`)
            }

            // Test 3: Boards Table
            addResult('boards', 'running', 'Testing boards table...')
            const { data: boards, error: boardsError } = await supabase
                .from('boards')
                .select('*')
                .limit(1)

            if (boardsError) {
                addResult('boards', 'error', `Error: ${boardsError.message}`)
            } else {
                addResult('boards', 'success', `Table accessible. Found ${boards?.length || 0} boards.`)
            }

            // Test 4: Scheduled Messages Table
            addResult('scheduled_messages', 'running', 'Testing scheduled_messages table...')
            const { data: schedules, error: schedulesError } = await supabase
                .from('scheduled_messages')
                .select('*')
                .limit(1)

            if (schedulesError) {
                addResult('scheduled_messages', 'error', `Error: ${schedulesError.message}`)
            } else {
                addResult('scheduled_messages', 'success', `Table accessible. Found ${schedules?.length || 0} schedules.`)
            }

            // Test 5: Create Test Design
            addResult('CRUD Test', 'running', 'Testing design creation...')
            const testLayout = Array(6 * 22).fill({ char: 'T', color: null })
            const { data: newDesign, error: createError } = await supabase
                .from('saved_designs')
                .insert([{
                    user_id: user.id,
                    name: `Test Design ${Date.now()}`,
                    layout: testLayout
                }])
                .select()
                .single()

            if (createError) {
                addResult('CRUD Test', 'error', `Create failed: ${createError.message}`)
            } else {
                addResult('CRUD Test', 'success', `Design created with ID: ${newDesign.id}`)

                // Test 6: Delete Test Design
                addResult('CRUD Test', 'running', 'Testing design deletion...')
                const { error: deleteError } = await supabase
                    .from('saved_designs')
                    .delete()
                    .eq('id', newDesign.id)

                if (deleteError) {
                    addResult('CRUD Test', 'error', `Delete failed: ${deleteError.message}`)
                } else {
                    addResult('CRUD Test', 'success', 'Design deleted successfully')
                }
            }

            // Test 7: RPC Function (check_user_exists)
            addResult('RPC Test', 'running', 'Testing check_user_exists function...')
            try {
                // Check for a likely non-existent email
                const { data: exists, error: rpcError } = await supabase.rpc('check_user_exists', {
                    email_to_check: 'nonexistent@example.com'
                })

                if (rpcError) {
                    addResult('RPC Test', 'error', `RPC failed: ${rpcError.message}`)
                } else {
                    addResult('RPC Test', 'success', `RPC working. Non-existent user check returned: ${exists}`)
                }
            } catch (err) {
                addResult('RPC Test', 'error', `RPC exception: ${err.message}`)
            }

        } catch (error) {
            addResult('General', 'error', `Unexpected error: ${error.message}`)
        } finally {
            setIsRunning(false)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'text-green-400 bg-green-500/10 border-green-500/20'
            case 'error': return 'text-red-400 bg-red-500/10 border-red-500/20'
            case 'warning': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
            case 'running': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Database Connection Test</h2>
                <p className="text-slate-400 mb-6">
                    This tool verifies that all Supabase tables are properly configured and accessible.
                </p>

                <button
                    onClick={runTests}
                    disabled={isRunning}
                    className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/25"
                >
                    {isRunning ? 'Running Tests...' : 'Run Database Tests'}
                </button>
            </div>

            {testResults.length > 0 && (
                <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-3">
                    <h3 className="text-lg font-semibold text-white mb-4">Test Results</h3>
                    {testResults.map((result, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="font-semibold text-sm uppercase tracking-wider mb-1">
                                        {result.test}
                                    </div>
                                    <div className="text-sm opacity-90">
                                        {result.message}
                                    </div>
                                </div>
                                <div className="ml-4">
                                    {result.status === 'success' && (
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    {result.status === 'error' && (
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    {result.status === 'running' && (
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Instructions</h3>
                <ol className="list-decimal list-inside space-y-2 text-slate-400 text-sm">
                    <li>Ensure you've executed <code className="text-teal-400 bg-slate-900 px-2 py-0.5 rounded">supabase/schema.sql</code> in your Supabase Dashboard</li>
                    <li>Sign in to the application (required for full testing)</li>
                    <li>Click "Run Database Tests" to verify all connections</li>
                    <li>Check that all tests show "success" status</li>
                </ol>
            </div>
        </div>
    )
}
