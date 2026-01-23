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
// Infrastructure Handlers
// ============================================
export const infrastructureHandlers = [
  // CCN areas
  http.get(`${BASE_URL}/api/v1/infrastructure/ccn`, ({ request }) => {
    const url = new URL(request.url);
    const bbox = url.searchParams.get('bbox');

    if (!bbox) {
      return HttpResponse.json(createApiErrorResponse('VALIDATION_ERROR', 'bbox is required'), {
        status: 400,
      });
    }

    return HttpResponse.json(
      createApiResponse({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-98.5, 29.4],
                  [-98.4, 29.4],
                  [-98.4, 29.5],
                  [-98.5, 29.5],
                  [-98.5, 29.4],
                ],
              ],
            },
            properties: {
              id: 'ccn_test1',
              ccnNumber: '12345',
              utilityName: 'Test Water Utility',
              serviceType: 'water',
              county: 'Bexar',
            },
          },
        ],
      })
    );
  }),

  // Flood zones
  http.get(`${BASE_URL}/api/v1/infrastructure/flood-zones`, ({ request }) => {
    const url = new URL(request.url);
    const bbox = url.searchParams.get('bbox');

    if (!bbox) {
      return HttpResponse.json(createApiErrorResponse('VALIDATION_ERROR', 'bbox is required'), {
        status: 400,
      });
    }

    return HttpResponse.json(
      createApiResponse({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'MultiPolygon',
              coordinates: [
                [
                  [
                    [-98.5, 29.4],
                    [-98.4, 29.4],
                    [-98.4, 29.5],
                    [-98.5, 29.5],
                    [-98.5, 29.4],
                  ],
                ],
              ],
            },
            properties: {
              id: 'fz_test1',
              zoneCode: 'AE',
              zoneDescription: '1% annual chance flood',
              county: 'Bexar',
              riskLevel: 'high',
            },
          },
        ],
      })
    );
  }),

  // Check point
  http.get(`${BASE_URL}/api/v1/infrastructure/check-point`, ({ request }) => {
    const url = new URL(request.url);
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');

    if (!lat || !lng) {
      return HttpResponse.json(
        createApiErrorResponse('VALIDATION_ERROR', 'lat and lng are required'),
        { status: 400 }
      );
    }

    return HttpResponse.json(
      createApiResponse({
        ccnAreas: [
          {
            id: 'ccn_test1',
            ccnNumber: '12345',
            utilityName: 'Test Water Utility',
            serviceType: 'water',
            county: 'Bexar',
          },
        ],
        floodZone: {
          id: 'fz_test1',
          zoneCode: 'AE',
          zoneDescription: '1% annual chance flood',
          county: 'Bexar',
          riskLevel: 'high',
        },
        hasWaterService: true,
        hasSewerService: false,
        floodRiskLevel: 'high',
        isHighRiskFlood: true,
      })
    );
  }),
];

// ============================================
// Combined Handlers
// ============================================
export const handlers = [
  ...authHandlers,
  ...healthHandlers,
  ...dealsHandlers,
  ...infrastructureHandlers,
];
