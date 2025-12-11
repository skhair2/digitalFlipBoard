import DOMPurify from 'dompurify'

// Sanitize user input for XSS prevention
export const sanitizeInput = (input) => {
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: [],
    }).trim()
}

// Validate message content (132 char limit, alphanumeric + punctuation)
export const validateMessage = (message) => {
    const sanitized = sanitizeInput(message)
    const allowed = /^[A-Za-z0-9\s.,!?'"\-:;()]+$/

    if (!sanitized || sanitized.length === 0) {
        return { valid: false, error: 'Message cannot be empty' }
    }

    if (sanitized.length > 132) {
        return { valid: false, error: 'Message exceeds 132 characters' }
    }

    if (!allowed.test(sanitized)) {
        return { valid: false, error: 'Message contains invalid characters' }
    }

    return { valid: true, sanitized }
}

// Validate session code (6 alphanumeric characters)
export const validateSessionCode = (code) => {
    const sanitized = sanitizeInput(code).toUpperCase()
    const pattern = /^[A-Z0-9]{6}$/

    if (!pattern.test(sanitized)) {
        return { valid: false, error: 'Invalid session code format' }
    }

    return { valid: true, sanitized }
}

// Validate email
export const validateEmail = (email) => {
    const sanitized = sanitizeInput(email).toLowerCase()
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!pattern.test(sanitized)) {
        return { valid: false, error: 'Invalid email format' }
    }

    return { valid: true, sanitized }
}
