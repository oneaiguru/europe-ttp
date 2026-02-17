/**
 * Type declarations for test-only global variables.
 *
 * These globals are used for mocking in tests and should never
 * be present in production environments.
 */
declare global {
  /**
   * Mock GCS signed URL for testing.
   * When set, the signed-url route will return this URL instead
   * of generating a real one. Only active when NODE_ENV !== 'production'.
   */
  var __MOCK_GCS_SIGNED_URL__: string | undefined;
}

// Required for ambient module declaration to work
export {};
