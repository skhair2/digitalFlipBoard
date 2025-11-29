/**
 * Generate a unique 6-character session code
 * @returns {string} Session code (e.g., "ABC123")
 */
export const generateSessionCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
}

/**
 * Generate a unique session code with collision detection
 * Checks if code already exists on server before returning
 * @param {number} maxAttempts - Maximum number of generation attempts (default: 10)
 * @returns {Promise<string>} Unique session code
 */
export const generateUniqueSessionCode = async (maxAttempts = 10) => {
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || `${window.location.protocol}//${window.location.hostname}:3001`
    const apiUrl = wsUrl.replace(/^ws/, 'http') // Convert ws:// to http://

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const code = generateSessionCode()

        try {
            // Check if session code already exists
            const response = await fetch(`${apiUrl}/api/session/exists/${code}`)
            const data = await response.json()

            if (!data.exists) {
                return code // Found unique code
            }

            console.log(`Session code ${code} already exists, generating new one (attempt ${attempt + 1}/${maxAttempts})`)
        } catch (error) {
            // If API check fails, return the code anyway (fallback to random chance)
            console.warn('Failed to check session code uniqueness, using generated code:', error)
            return code
        }
    }

    // Fallback: if all attempts failed, return a code anyway
    // Collision probability is extremely low (~1 in 2 billion)
    console.warn(`Failed to generate unique session code after ${maxAttempts} attempts, using last generated code`)
    return generateSessionCode()
}
