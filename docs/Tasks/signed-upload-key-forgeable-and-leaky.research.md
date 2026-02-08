# TASK-060: signed-upload-key-forgeable-and-leaky - Research

## Issue Summary

The Next.js signed-upload endpoint at `app/api/upload/signed-url/route.ts` generates a client-visible token using base64 encoding of user email, timestamp, and filename. This allows:
1. **Token forgery**: Clients can decode the base64, modify values, and re-encode
2. **Information leakage**: User emails and file paths are visible in base64

## Evidence

### 1. Current Token Generation (Forgeable)
File: `app/api/upload/signed-url/route.ts:107-108`

```typescript
// 7. Generate upload key (for tracking)
const uploadKey = Buffer.from(`${user}:${timestamp}:${fullFilename}`).toString('base64');
```

This produces tokens like: `dGVzdC51c2VyQGV4YW1wbGUuY29tOjE3Mzc4OTk5NzA6cGhvdG9zL3Rlc3RfdXNlcl8xNzM3ODk5OTcwX2FiY2RlZmc=`
- Decodes to: `test.user@example.com:1737899970:photos/test_user_1737899970_abcdefgh`
- Anyone can decode, modify user/filename/timestamp, and re-encode

### 2. Key Consumption Points

The `uploadKey` is returned in the response and expected to be used later for tracking/post-processing, but **no verification endpoint exists** for this key in the Next.js codebase.

File: `app/api/upload/signed-url/route.ts:110-113`
```typescript
return NextResponse.json({
  url: signedUrl,
  key: uploadKey,
});
```

The test steps store and validate the key:
File: `test/typescript/steps/uploads_steps.ts:7,20,28`

### 3. Python Implementation Contrast (Uses Database Keys)

File: `pyutils/upload.py:123-126`
```python
file_upload = FileModel(filename=filename)
file_upload.put()
key_safe = file_upload.key.urlsafe()
data = {'url': url, 'key': key_safe}
```

The Python version:
- Creates an NDB entity (database record)
- Returns the entity's opaque key (unforgeable)
- Verifies the key via `ndb.Key(urlsafe=key).get()` at line 146

File: `pyutils/upload.py:130-150` (PostUploadHandler)
```python
key = self.request.params.get('key')
# ...
file_obj = ndb.Key(urlsafe=key).get()
if not file_obj:
    self.response.status = 404
    self.response.write(json.dumps({'error': 'File not found'}))
    return
# Validate ownership - filename should contain user's email
if user.email() not in file_obj.filename:
    self.response.status = 403
    self.response.write(json.dumps({'error': 'Access denied'}))
    return
```

### 4. Missing Next.js Components

1. **No crypto utilities**: No HMAC or signing functions exist in the codebase
   - Searched for: `HMAC|hmac|createHmac|createHash|subtle` in `*.ts`
   - Result: None found

2. **No upload key verification endpoint**: No Next.js route consumes the `key`
   - Only route exists: `app/api/upload/signed-url/route.ts`
   - No post-upload callback handler

3. **No database token store**: No entity/model system like Python's NDB

## Security Implications

| Vulnerability | Impact |
|---------------|--------|
| Base64 encoding is reversible | Attacker can extract user emails and file paths |
| No cryptographic signature | Attacker can forge tokens for arbitrary users/files |
| No server-side verification | Any forged token would be accepted if a verification endpoint existed |

## Implementation Approaches

### Option A: HMAC-Signed Tokens (Stateless)
Generate a token containing user+timestamp+filename, signed with a server secret:

```
token = base64url(payload) + "." + base64url(hmac_sha256(secret, payload))
```

Pros:
- Stateless (no database)
- Tamper-evident (signature invalid on modification)
- Can embed expiry and verify server-side

Cons:
- Requires shared secret management
- Requires crypto utility implementation
- Token cannot be revoked

### Option B: Database-Backed Opaque IDs (Stateful, like Python)
Create a database entity and return its opaque ID:

```typescript
const upload = await db.uploads.create({
  user,
  filename: fullFilename,
  expiresAt: timestamp + 15*60
});
const uploadKey = upload.id; // or random UUID
```

Pros:
- Matches Python pattern (pyutils/upload.py:123-126)
- Truly opaque (no data leakage)
- Can be revoked/deleted
- Supports post-upload tracking

Cons:
- Requires database schema (not present in current codebase)
- Adds infrastructure dependency

### Option C: Hybrid (JWT)
Use JWT with server secret:

```typescript
const token = jwt.sign({
  user,
  filename: fullFilename,
  exp: timestamp + 15*60
}, SECRET_KEY);
```

Pros:
- Standard format
- Built-in expiration
- Libraries available

Cons:
- External dependency (jsonwebtoken)
- Still requires secret management

## Recommendation

**Use Option A (HMAC-signed tokens)** because:
1. Stateless - no new database infrastructure needed
2. Matches current token pattern (just add signature)
3. Can use Node.js built-in `crypto` module
4. Allows migration to Option B later if needed

## Files to Modify

1. `app/api/upload/signed-url/route.ts:107-108` - Replace base64 with HMAC token
2. Create crypto utility in `app/utils/crypto.ts` (new file)
3. Any future post-upload verification endpoint - Verify HMAC signature
4. `test/typescript/steps/uploads_steps.ts` - Update test expectations for opaque token format
5. `.env.local` or environment - Add `UPLOAD_HMAC_SECRET` configuration

## Related Code

- Python NDB key reference: `pyutils/upload.py:123-126`
- Python key verification: `pyutils/upload.py:146-158`
- Current vulnerable token: `app/api/upload/signed-url/route.ts:107-108`
- Test usage: `test/typescript/steps/uploads_steps.ts:7,20,28`
