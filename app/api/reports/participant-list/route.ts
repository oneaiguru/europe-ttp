import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/reports/participant-list
 * Generate participant list with enrollment data
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('authorization');
    // TODO: Implement proper admin authentication check
    // For now, mock response

    // Mock participant list data
    const participantList = [
      {
        email: 'test.applicant@example.com',
        name: 'Test Applicant',
        ttc_option: 'test_us_future',
        enrollment_count: 10,
        enrollment_list_count: 8,
        application_status: 'submitted',
        last_update: '2024-01-15 10:30:00',
      },
    ];

    return NextResponse.json(participantList, { status: 200 });
  } catch (error) {
    console.error('Error generating participant list:', error);
    return NextResponse.json(
      { error: 'Failed to generate participant list' },
      { status: 500 }
    );
  }
}
