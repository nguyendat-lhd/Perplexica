# Railway Configuration Files

## Root railway.json

File này ở root, dùng cho **Web App service** (nếu Railway không tự detect):

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## apps/mcp-server/railway.json

File này trong `apps/mcp-server/`, dùng cho **MCP Server service**:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Lưu ý

⚠️ **Railway chỉ đọc railway.json ở root directory của service**:
- Web app service (root: `.`) → đọc `railway.json` ở root
- MCP server service (root: `apps/mcp-server`) → đọc `apps/mcp-server/railway.json`

Nếu Railway tự detect được (Next.js, Node.js), có thể không cần railway.json.

## Cấu hình trên Dashboard (Khuyến nghị)

Thay vì dùng railway.json, nên cấu hình trên Railway Dashboard:

1. **Service Settings** → **Deploy**
2. Set **Root Directory**, **Build Command**, **Start Command**
3. Lưu và deploy

Cách này linh hoạt hơn và dễ quản lý hơn.

