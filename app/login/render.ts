export function renderLoginPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login | Europe TTP</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background: linear-gradient(160deg, #f5f7ff 0%, #f8fbff 45%, #ffffff 100%); }
    .card { max-width: 420px; }
    .message { min-height: 1.2rem; }
  </style>
</head>
<body class="min-h-screen p-4 flex items-center justify-center">
  <div class="card w-full bg-white/95 border border-slate-200 rounded-2xl shadow-lg p-6 space-y-5">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">Europe TTP</h1>
      <p class="mt-1 text-sm text-slate-600">Sign in to access admin pages</p>
    </div>

    <form id="login-form" class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-slate-700">Email</label>
        <input id="email" name="email" type="email" value="akshay.ponda@artofliving.org" required class="mt-1 w-full rounded-xl border border-slate-300 p-2.5" />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-slate-700">Password</label>
        <input id="password" name="password" type="password" class="mt-1 w-full rounded-xl border border-slate-300 p-2.5" />
        <p class="mt-1 text-xs text-slate-500">If no password is configured, you can leave this field blank.</p>
      </div>
      <button type="submit" class="w-full rounded-xl bg-slate-900 text-white py-2.5 font-semibold hover:bg-slate-700 transition">
        Sign in
      </button>
    </form>

    <div id="message" class="message text-sm"></div>
    <p class="text-xs text-slate-500">
      Use <span class="font-semibold">/login</span> with your email/password, then open admin pages.
    </p>
    <a href="/" class="inline-block text-sm text-blue-700 hover:underline">Back to landing</a>
  </div>

  <script>
    const form = document.getElementById('login-form');
    const messageEl = document.getElementById('message');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      messageEl.textContent = '';
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const payload = { email };
      if (password) {
        payload.password = password;
      }
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) {
          messageEl.textContent = result.error || 'Login failed';
          return;
        }
        window.location.href = '/api/admin/reports_list';
      } catch (error) {
        messageEl.textContent = error?.message || 'Request failed';
      }
    });
  </script>
</body>
</html>`;
}

