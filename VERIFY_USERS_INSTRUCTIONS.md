# Verify Users for 5 Years

## Wait for Render to Deploy
Check https://dashboard.render.com/ - wait for deployment to complete (2-3 minutes)

## Option 1: Using curl (Windows PowerShell)

```powershell
# Verify Franklynnnamdi136@gmail.com
Invoke-WebRequest -Uri "https://clanplug.onrender.com/api/admin-verify-badge" -Method POST -Headers @{"Content-Type"="application/json"; "x-admin-key"="lordmoon_admin_2024_secure_key"} -Body '{"email":"Franklynnnamdi136@gmail.com","years":5}' | Select-Object -ExpandProperty Content

# Verify abonejoseph@gmail.com
Invoke-WebRequest -Uri "https://clanplug.onrender.com/api/admin-verify-badge" -Method POST -Headers @{"Content-Type"="application/json"; "x-admin-key"="lordmoon_admin_2024_secure_key"} -Body '{"email":"abonejoseph@gmail.com","years":5}' | Select-Object -ExpandProperty Content
```

## Option 2: Using the script

```bash
node verify-users-render.js
```

## Option 3: Using Postman/Insomnia

**URL:** `https://clanplug.onrender.com/api/admin-verify-badge`
**Method:** POST
**Headers:**
- `Content-Type`: `application/json`
- `x-admin-key`: `lordmoon_admin_2024_secure_key`

**Body (for each user):**
```json
{
  "email": "Franklynnnamdi136@gmail.com",
  "years": 5
}
```

```json
{
  "email": "abonejoseph@gmail.com",
  "years": 5
}
```

## Expected Response

```json
{
  "success": true,
  "message": "User verified for 5 years",
  "data": {
    "user": {
      "id": "...",
      "email": "...",
      "username": "...",
      "firstName": "...",
      "lastName": "..."
    },
    "badge": {
      "id": "...",
      "status": "active",
      "expiresAt": "2030-12-22T..."
    }
  }
}
```

The verification badge will expire on December 22, 2030 (5 years from now).
