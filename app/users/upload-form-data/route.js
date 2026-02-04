function parseMaybeJson(value) {
    if (typeof value !== 'string') {
        return value;
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return value;
    }
    try {
        return JSON.parse(trimmed);
    }
    catch {
        return value;
    }
}
function normalizePayload(payload) {
    return {
        ...payload,
        form_data: parseMaybeJson(payload.form_data) ?? {},
        form_instance_page_data: parseMaybeJson(payload.form_instance_page_data) ?? {},
    };
}
async function readPayload(request) {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
        try {
            return (await request.json());
        }
        catch {
            return {};
        }
    }
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        try {
            const formData = await request.formData();
            const data = {};
            formData.forEach((value, key) => {
                data[key] = typeof value === 'string' ? value : value.name;
            });
            return data;
        }
        catch {
            return {};
        }
    }
    try {
        return (await request.json());
    }
    catch {
        return {};
    }
}
export async function POST(request) {
    const payload = await readPayload(request);
    const normalized = normalizePayload(payload);
    return Response.json({
        ok: true,
        received: normalized,
    }, {
        status: 200,
    });
}
