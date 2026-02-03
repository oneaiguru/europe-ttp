type UploadFormPayload = {
  form_type?: string;
  form_instance?: string;
  form_data?: unknown;
  form_instance_page_data?: unknown;
  form_instance_display?: string;
  user_home_country_iso?: string;
  [key: string]: unknown;
};

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function normalizePayload(payload: UploadFormPayload): UploadFormPayload {
  return {
    ...payload,
    form_data: parseMaybeJson(payload.form_data) ?? {},
    form_instance_page_data: parseMaybeJson(payload.form_instance_page_data) ?? {},
  };
}

async function readPayload(request: Request): Promise<UploadFormPayload> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return (await request.json()) as UploadFormPayload;
    } catch {
      return {};
    }
  }

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData();
      const data: Record<string, unknown> = {};
      formData.forEach((value, key) => {
        data[key] = typeof value === 'string' ? value : value.name;
      });
      return data as UploadFormPayload;
    } catch {
      return {};
    }
  }

  try {
    return (await request.json()) as UploadFormPayload;
  } catch {
    return {};
  }
}

export async function POST(request: Request): Promise<Response> {
  const payload = await readPayload(request);
  const normalized = normalizePayload(payload);

  return Response.json(
    {
      ok: true,
      received: normalized,
    },
    {
      status: 200,
    },
  );
}
