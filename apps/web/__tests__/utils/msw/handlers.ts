import { http, HttpResponse } from 'msw';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ============================================
// Factory helpers for consistent responses
// ============================================
function createApiResponse<T>(data: T, success = true) {
  return {
    success,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  };
}

function createApiErrorResponse(code: string, message: string) {
  return {
    success: false,
    error: {
      code,
      message,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  };
}

// ============================================
// Auth Handlers
// ============================================
export const authHandlers = [
  // Get session
  http.get(`${BASE_URL}/api/auth/session`, () => {
    return HttpResponse.json({
      user: {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      session: {
        id: 'session_123',
        userId: 'user_123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        token: 'token_123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  // Sign in with email
  http.post(`${BASE_URL}/api/auth/sign-in/email`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    if (body.email === 'invalid@example.com') {
      return HttpResponse.json(
        createApiErrorResponse('INVALID_CREDENTIALS', 'Invalid email or password'),
        {
          status: 401,
        }
      );
    }

    return HttpResponse.json({
      user: {
        id: 'user_123',
        email: body.email,
        name: 'Test User',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      session: {
        id: 'session_123',
        userId: 'user_123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        token: 'token_123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  // Sign up
  http.post(`${BASE_URL}/api/auth/sign-up/email`, async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      password: string;
      name: string;
    };

    if (body.email === 'existing@example.com') {
      return HttpResponse.json(createApiErrorResponse('USER_EXISTS', 'User already exists'), {
        status: 409,
      });
    }

    return HttpResponse.json({
      user: {
        id: 'user_new',
        email: body.email,
        name: body.name,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      session: {
        id: 'session_new',
        userId: 'user_new',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        token: 'token_new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  // Sign out
  http.post(`${BASE_URL}/api/auth/sign-out`, () => {
    return HttpResponse.json({ success: true });
  }),
];

// ============================================
// Health Check Handler
// ============================================
export const healthHandlers = [
  http.get(`${BASE_URL}/api/v1/health`, () => {
    return HttpResponse.json(
      createApiResponse({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '0.0.0',
      })
    );
  }),
];

// ============================================
// Deals Handlers (placeholder for future)
// ============================================
export const dealsHandlers = [
  // List deals
  http.get(`${BASE_URL}/api/v1/deals`, () => {
    return HttpResponse.json(createApiResponse([]));
  }),

  // Get deal by ID
  http.get(`${BASE_URL}/api/v1/deals/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json(
      createApiResponse({
        id,
        name: 'Test Deal',
        type: 'rental',
        createdAt: new Date().toISOString(),
      })
    );
  }),

  // Create deal
  http.post(`${BASE_URL}/api/v1/deals`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      createApiResponse({
        id: 'deal_1',
        ...body,
        createdAt: new Date().toISOString(),
      }),
      { status: 201 }
    );
  }),
];

// ============================================
// Tax Liens Handlers
// ============================================
export const taxLiensHandlers = [
  // List tax liens
  http.get(`${BASE_URL}/api/v1/tax-liens`, ({ request }) => {
    const url = new URL(request.url);
    const county = url.searchParams.get('county');
    const status = url.searchParams.get('status');

    // Generate mock tax liens
    const liens = Array.from({ length: 10 }, (_, i) => ({
      id: `mtl_${i + 1}`,
      serialNumber: `TEX${100000 + i}A`,
      hudLabel: `TEX99${1000 + i}`,
      county: county || ['Bexar', 'Hidalgo', 'Travis', 'Cameron', 'Nueces'][i % 5],
      taxingEntity: 'City of San Antonio',
      amount: 1500 + i * 100,
      year: 2024 - (i % 3),
      status: status || (i % 2 === 0 ? 'active' : 'released'),
      filedDate: new Date('2024-03-15').toISOString(),
      releasedDate: i % 2 === 1 ? new Date('2024-06-15').toISOString() : null,
      communityId: i < 3 ? `mhc_${i + 1}` : null,
      sourceUpdatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      community:
        i < 3 ? { id: `mhc_${i + 1}`, name: `Test Park ${i + 1}`, city: 'San Antonio' } : null,
    }));

    return HttpResponse.json({
      ...createApiResponse(liens),
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        pagination: {
          page: 1,
          perPage: 20,
          total: 186,
          totalPages: 10,
        },
      },
    });
  }),

  // Get tax lien stats
  http.get(`${BASE_URL}/api/v1/tax-liens/stats`, () => {
    return HttpResponse.json(
      createApiResponse({
        totalActive: 88,
        totalReleased: 98,
        totalAmount: 132000,
        avgAmount: 1500,
        byCounty: [
          { county: 'Bexar', count: 25, amount: 37500 },
          { county: 'Hidalgo', count: 20, amount: 30000 },
          { county: 'Travis', count: 18, amount: 27000 },
          { county: 'Cameron', count: 15, amount: 22500 },
          { county: 'Nueces', count: 10, amount: 15000 },
        ],
        byYear: [
          { year: 2024, count: 45 },
          { year: 2023, count: 30 },
          { year: 2022, count: 13 },
        ],
      })
    );
  }),
];

// ============================================
// Combined Handlers
// ============================================
export const handlers = [...authHandlers, ...healthHandlers, ...dealsHandlers, ...taxLiensHandlers];
