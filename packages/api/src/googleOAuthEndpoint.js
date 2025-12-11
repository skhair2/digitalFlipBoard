import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import logger from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase with service role for admin operations
let supabase = null;

// Initialize Resend
let resend = null;

try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    logger.info('Google OAuth Supabase client initialized with service role');
  } else {
    logger.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for Google OAuth endpoint');
  }

  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
    logger.info('Resend email service initialized');
  } else {
    logger.warn('RESEND_API_KEY not configured, email sending will fail');
  }
} catch (error) {
  logger.error('Failed to initialize services for Google OAuth', error);
}

/**
 * POST /api/auth/google/create-user
 * Create or update a user in Supabase after successful Google OAuth
 * 
 * Request body:
 * {
 *   googleId: string (from OAuth token sub)
 *   email: string
 *   name: string
 *   picture: string (URL)
 *   emailVerified: boolean
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   user: { id, email, created_at, ...user_metadata }
 *   profile: { id, email, full_name, email_verified, ... }
 *   sessionToken?: string (if you want to manually manage auth)
 * }
 */
export const createGoogleUser = async (req, res) => {
  try {
    // Check if Supabase is initialized
    if (!supabase) {
      logger.error('Supabase not initialized for Google OAuth endpoint');
      return res.status(500).json({
        error: 'Server configuration error: Supabase not initialized'
      });
    }

    const { googleId, email, name, picture, emailVerified } = req.body;

    // Validate required fields
    if (!googleId || !email) {
      return res.status(400).json({
        error: 'Missing required fields: googleId, email'
      });
    }

    logger.info('Creating/updating Google OAuth user', {
      googleId,
      email,
      name
    });

    // Check if user already exists in Supabase auth by email
    const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
    const supabaseUser = existingAuthUser?.users?.find(u => u.email === email);

    let authUser;

    if (supabaseUser) {
      // User exists in Supabase auth - update metadata
      logger.info('Updating existing Supabase auth user', {
        userId: supabaseUser.id,
        email
      });

      const updateResponse = await supabase.auth.admin.updateUserById(
        supabaseUser.id,
        {
          user_metadata: {
            full_name: name,
            picture: picture,
            signup_method: 'google_oauth_direct',
            google_id: googleId
          }
        }
      );

      logger.debug('Supabase updateUserById response', {
        hasUser: !!updateResponse.user,
        userId: updateResponse.user?.id,
        hasError: !!updateResponse.error,
        supabaseUser: !!supabaseUser
      });

      if (updateResponse.error) {
        logger.error('Failed to update Supabase auth user', updateResponse.error);
        throw updateResponse.error;
      }
      
      // updateUserById returns the updated user, fallback to existing supabaseUser if not in response
      authUser = updateResponse.user || supabaseUser;
    } else {
      // Create new Supabase auth user
      logger.info('Creating new Supabase auth user', {
        email,
        name
      });

      const createResponse = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: emailVerified === true, // If Google says email is verified, confirm it
        user_metadata: {
          full_name: name,
          picture: picture,
          signup_method: 'google_oauth_direct',
          google_id: googleId
        },
        password: null // No password for OAuth users
      });

      logger.debug('Supabase createUser response', { 
        hasUser: !!createResponse.user,
        userId: createResponse.user?.id,
        hasError: !!createResponse.error
      });

      if (createResponse.error) {
        logger.error('Failed to create Supabase auth user', createResponse.error);
        throw createResponse.error;
      }
      
      if (!createResponse.user || !createResponse.user.id) {
        logger.error('Supabase created user but no ID returned', { user: createResponse.user });
        throw new Error('Failed to create user: no ID returned');
      }
      
      authUser = createResponse.user;
    }

    logger.debug('Auth user ready', { userId: authUser.id, email: authUser.email });

    // Now create or update user profile
    if (!authUser.id) {
      logger.error('authUser.id is missing', { authUser });
      return res.status(500).json({
        error: 'User created but missing ID'
      });
    }

    let profile;
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: name || existingProfile.full_name,
          email_verified: emailVerified,
          signup_method: 'google_oauth',
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.id)
        .select()
        .single();

      if (updateError) throw updateError;
      profile = updatedProfile;
    } else {
      // Create new profile
      logger.debug('Creating new profile', { userId: authUser.id, email: authUser.email });
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          email: authUser.email,
          full_name: name,
          email_verified: emailVerified,
          signup_method: 'google_oauth',
          welcome_email_sent: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        logger.error('Failed to create profile', { error: createError, userId: authUser.id });
        throw createError;
      }
      
      if (!newProfile) {
        logger.error('Profile created but no data returned', { userId: authUser.id });
        throw new Error('Profile created but no data returned');
      }
      
      profile = newProfile;
    }

    // Fire-and-forget: Send welcome email in background (non-blocking)
    if (profile && !profile.welcome_email_sent) {
      sendWelcomeEmailAsync(authUser.email, name).catch(err => {
        logger.warn('Failed to send welcome email', { email: authUser.email, error: err.message });
      });

      // Update welcome_email_sent flag in background (non-blocking)
      supabase
        .from('profiles')
        .update({ welcome_email_sent: true })
        .eq('id', authUser.id)
        .then(() => {
          logger.debug('Marked welcome email as sent', { userId: authUser.id });
        })
        .catch(err => {
          logger.warn('Failed to update welcome_email_sent flag', { email: authUser.email, error: err.message });
        });
    }

    logger.info('Google OAuth user created/updated successfully', {
      userId: authUser.id,
      email: authUser.email,
      isNew: !supabaseUser
    });

    return res.status(supabaseUser ? 200 : 201).json({
      success: true,
      user: {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        user_metadata: authUser.user_metadata
      },
      profile: profile,
      isNew: !supabaseUser
    });
  } catch (error) {
    logger.error('Google OAuth user creation failed', {
      message: error.message,
      code: error.code,
      status: error.status,
      email: req.body.email,
      googleId: req.body.googleId,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create/update user'
    });
  }
};

/**
 * Send welcome email asynchronously (fire-and-forget)
 * Doesn't block the response
 */
const sendWelcomeEmailAsync = async (email, name) => {
  try {
    // Send welcome email via Resend with WelcomeEmail template
    const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"><div style="max-width:560px;margin:0 auto;padding:20px"><div style="text-align:center;margin-bottom:24px"><span style="font-size:24px;font-weight:bold;color:#fff">FlipDisplay.online</span></div><div style="background-color:#1e293b;border-radius:12px;border:1px solid #334155;padding:24px"><h1 style="font-size:24px;font-weight:bold;color:#fff;margin-bottom:16px;text-align:center">Welcome to FlipDisplay!</h1><p style="font-size:16px;line-height:26px;color:#cbd5e1;margin-bottom:24px">Hi ${name || 'there'},</p><p style="font-size:16px;line-height:26px;color:#cbd5e1;margin-bottom:16px">We're thrilled to have you on board. FlipDisplay is your ultimate split-flap display simulator—create stunning retro-style messages and share them in real-time.</p><p style="font-size:16px;line-height:26px;color:#cbd5e1;margin-bottom:32px">Here's what you can do:</p><ul style="margin:0;padding-left:20px"><li style="font-size:16px;line-height:26px;color:#cbd5e1;margin-bottom:12px">Control split-flap displays with custom messages</li><li style="font-size:16px;line-height:26px;color:#cbd5e1;margin-bottom:12px">Choose from multiple animations and color themes</li><li style="font-size:16px;line-height:26px;color:#cbd5e1;margin-bottom:12px">Share sessions with friends and colleagues</li><li style="font-size:16px;line-height:26px;color:#cbd5e1">Access advanced features with a premium account</li></ul><div style="text-align:center;margin-top:32px;margin-bottom:32px"><a href="${process.env.VITE_APP_URL || 'https://flipdisplay.online'}" style="background-color:#14b8a6;border-radius:8px;color:#fff;font-size:16px;font-weight:bold;text-decoration:none;display:inline-block;padding:12px 24px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)">Get Started</a></div><p style="font-size:14px;line-height:22px;color:#94a3b8">Have questions? We're here to help. Just reply to this email anytime.</p></div><div style="margin-top:32px;text-align:center"><p style="font-size:12px;color:#64748b;margin-bottom:8px">© ${new Date().getFullYear()} FlipDisplay.online. All rights reserved.</p></div></div></body></html>`;
    
    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@flipdisplay.online',
      to: email,
      subject: 'Welcome to FlipDisplay.online!',
      html: emailHtml,
      text: `Welcome to FlipDisplay! Get started at ${process.env.VITE_APP_URL || 'https://flipdisplay.online'}`
    });

    logger.info('Welcome email sent via Resend', { email, email_id: result.id });
  } catch (error) {
    logger.warn('Failed to send welcome email', { email, error: error.message });
  }
};

/**
 * POST /api/auth/google/exchange-code
 * Exchange authorization code for tokens (server-side)
 * 
 * Request body:
 * {
 *   code: string (authorization code from Google)
 *   codeVerifier: string (PKCE code verifier)
 *   redirectUri: string (must match registered redirect URI)
 * }
 */
export const exchangeGoogleCode = async (req, res) => {
  try {
    const { code, codeVerifier, redirectUri } = req.body;

    logger.debug('exchangeGoogleCode called', {
      has_code: !!code,
      has_codeVerifier: !!codeVerifier,
      has_redirectUri: !!redirectUri,
      redirectUri: redirectUri
    });

    if (!code || !codeVerifier || !redirectUri) {
      return res.status(400).json({
        error: 'Missing required fields: code, codeVerifier, redirectUri'
      });
    }

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
    const GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v2/userinfo';

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      logger.error('Missing Google OAuth credentials in environment', { 
        has_client_id: !!GOOGLE_CLIENT_ID, 
        has_client_secret: !!GOOGLE_CLIENT_SECRET,
        keys: Object.keys(process.env).filter(k => k.includes('GOOGLE'))
      });
      return res.status(500).json({
        error: 'Server configuration error: Missing Google OAuth credentials'
      });
    }

    // Exchange authorization code for tokens
    logger.debug('Exchanging authorization code for tokens', { 
      code: code.substring(0, 20) + '...',
      redirectUri,
      hasCodeVerifier: !!codeVerifier
    });

    let tokenResponse;
    try {
      tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }).toString(),
      });
    } catch (fetchError) {
      logger.error('Fetch to Google token endpoint failed', { 
        error: fetchError.message,
        endpoint: GOOGLE_TOKEN_ENDPOINT
      });
      throw fetchError;
    }

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      logger.error('Token exchange failed from Google', {
        status: tokenResponse.status,
        error: errorData,
        request_data: {
          code: code.substring(0, 20) + '...',
          client_id: GOOGLE_CLIENT_ID,
          redirect_uri: redirectUri,
          has_code_verifier: !!codeVerifier
        }
      });
      return res.status(401).json({
        error: errorData.error_description || errorData.error || 'Failed to exchange authorization code for tokens'
      });
    }

    let tokens;
    try {
      tokens = await tokenResponse.json();
      logger.debug('Tokens received from Google', { 
        has_access_token: !!tokens.access_token,
        has_refresh_token: !!tokens.refresh_token,
        access_token: tokens.access_token ? tokens.access_token.substring(0, 20) + '...' : 'MISSING'
      });
    } catch (parseError) {
      logger.error('Failed to parse token response JSON', { 
        error: parseError.message,
        status: tokenResponse.status,
        contentType: tokenResponse.headers.get('content-type')
      });
      throw parseError;
    }

    // Get user info from Google
    logger.debug('Fetching user info from Google', { 
      endpoint: GOOGLE_USERINFO_ENDPOINT,
      has_access_token: !!tokens.access_token
    });

    let userInfoResponse;
    try {
      userInfoResponse = await fetch(GOOGLE_USERINFO_ENDPOINT, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });
    } catch (fetchError) {
      logger.error('Fetch to Google userinfo endpoint failed', { 
        error: fetchError.message,
        endpoint: GOOGLE_USERINFO_ENDPOINT
      });
      throw fetchError;
    }

    if (!userInfoResponse.ok) {
      logger.error('Failed to fetch user info from Google', {
        status: userInfoResponse.status,
        statusText: userInfoResponse.statusText
      });
      return res.status(401).json({
        error: 'Failed to fetch user information from Google'
      });
    }

    let googleUser;
    try {
      googleUser = await userInfoResponse.json();
      logger.info('Google user info retrieved', { 
        email: googleUser.email, 
        name: googleUser.name,
        userId: googleUser.id || googleUser.sub
      });
    } catch (parseError) {
      logger.error('Failed to parse userinfo response JSON', { 
        error: parseError.message,
        status: userInfoResponse.status
      });
      throw parseError;
    }

    // Decode ID token to get the 'sub' claim (Google's user ID)
    // ID token is JWT format: header.payload.signature
    let googleId = googleUser.id;
    if (tokens.id_token) {
      try {
        const parts = tokens.id_token.split('.');
        if (parts.length === 3) {
          // Decode the payload (second part)
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          googleId = payload.sub || googleUser.id;
          logger.debug('Decoded Google ID from ID token', { googleId });
        }
      } catch (error) {
        logger.warn('Failed to decode ID token, using userinfo id', { error: error.message });
      }
    }

    return res.status(200).json({
      success: true,
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        id_token: tokens.id_token,
        token_type: tokens.token_type
      },
      googleUser: {
        sub: googleId,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        verified_email: googleUser.verified_email
      }
    });
  } catch (error) {
    logger.error('Google code exchange failed', { 
      message: error.message, 
      code: error.code,
      stack: error.stack 
    });
    return res.status(500).json({
      error: error.message || 'Failed to exchange authorization code'
    });
  }
};

/**
 * Register Google OAuth endpoints
 * 
 * Usage:
 * registerGoogleOAuthEndpoints(app);
 */
export const registerGoogleOAuthEndpoints = (app) => {
  // Exchange authorization code for tokens (server-side)
  app.post('/api/auth/google/exchange-code', exchangeGoogleCode);
  
  // Create or update user after OAuth callback
  app.post('/api/auth/google/create-user', createGoogleUser);

  logger.info('Google OAuth endpoints registered');
};

export default {
  registerGoogleOAuthEndpoints,
  exchangeGoogleCode,
  createGoogleUser
};
