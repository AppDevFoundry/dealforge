import { auth } from '@/lib/auth';
import { getDb } from '@dealforge/database';
import { accounts, users } from '@dealforge/database/schema';
import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend for sending emails
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Password complexity requirements (traditional approach)
 */
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

/**
 * Validates password against complexity requirements
 */
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (
    PASSWORD_REQUIREMENTS.requireSpecial &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)
  ) {
    errors.push('Password must contain at least one special character');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Secure signup endpoint that doesn't reveal whether an email already exists.
 *
 * Behavior:
 * - New user: Creates account and sends verification email
 * - Existing unverified user: Resends verification email
 * - Existing verified user: Returns success (no email sent, user should sign in)
 *
 * Always returns the same success response to prevent email enumeration attacks.
 */
export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();
    console.log('[secure-signup] Received signup request for:', email);

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }

    // Validate password complexity (this is OK to return as error since it doesn't reveal user existence)
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0], errors: passwordValidation.errors },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    console.log(
      '[secure-signup] Existing user check:',
      existingUser.length > 0 ? 'found' : 'not found'
    );

    if (existingUser.length > 0) {
      const user = existingUser[0];
      console.log('[secure-signup] User email verified:', user.emailVerified);

      // Check if user has a credential (password) account
      const credentialAccount = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, user.id), eq(accounts.providerId, 'credential')))
        .limit(1);

      const hasCredentialAccount = credentialAccount.length > 0;
      console.log('[secure-signup] Has credential account:', hasCredentialAccount);

      // If user exists but email not verified, resend verification
      if (!user.emailVerified) {
        try {
          console.log('[secure-signup] Attempting to resend verification email...');
          // Use BetterAuth's internal method to send verification email
          const result = await auth.api.sendVerificationEmail({
            body: { email: user.email },
          });
          console.log('[secure-signup] sendVerificationEmail result:', result);
        } catch (error) {
          // Silently fail - don't reveal any information
          console.error('[secure-signup] Failed to resend verification email:', error);
        }
      } else if (!hasCredentialAccount) {
        // User is verified (via OAuth) but has no password set
        // Send them an email explaining they already have an account via Google
        if (resend) {
          try {
            console.log('[secure-signup] OAuth-only user, sending account exists email...');
            const fromEmail = process.env.EMAIL_FROM || 'DealForge <noreply@dealforge.app>';
            const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

            await resend.emails.send({
              from: fromEmail,
              to: user.email,
              subject: 'You already have a DealForge account',
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #1a1a1a;">You Already Have an Account</h2>
                  <p style="color: #4a4a4a; line-height: 1.6;">
                    Someone tried to create a DealForge account with this email address, but you already have an account connected via Google.
                  </p>
                  <p style="color: #4a4a4a; line-height: 1.6;">
                    To sign in, simply use the "Continue with Google" button on our sign-in page.
                  </p>
                  <a href="${baseUrl}/sign-in" style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                    Sign In with Google
                  </a>
                  <p style="color: #6a6a6a; font-size: 14px;">
                    If you'd like to add a password to your account, you can do so from your account settings after signing in.
                  </p>
                  <p style="color: #6a6a6a; font-size: 14px;">
                    If you didn't try to create an account, you can safely ignore this email.
                  </p>
                </div>
              `,
            });
            console.log('[secure-signup] Account exists email sent');
          } catch (error) {
            console.error('[secure-signup] Failed to send account exists email:', error);
          }
        }
      }
      // If user is verified AND has credential account, they should use sign-in or forgot password

      // Return same success response regardless
      return NextResponse.json({ success: true });
    }

    // New user - create account via BetterAuth
    try {
      console.log('[secure-signup] Creating new user account...');
      const result = await auth.api.signUpEmail({
        body: { name, email, password },
      });
      console.log('[secure-signup] signUpEmail result:', result);
    } catch (error) {
      // Log but don't expose the actual error
      console.error('[secure-signup] Failed to create account:', error);
      // Still return success to prevent enumeration
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[secure-signup] Unexpected error:', error);
    // Return generic error for truly unexpected issues
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
