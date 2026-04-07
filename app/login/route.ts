import { renderLoginPage } from './render';

export async function GET(): Promise<Response> {
  return new Response(renderLoginPage(), {
    headers: {
      'content-type': 'text/html',
    },
  });
}

