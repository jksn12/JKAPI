# JKAPI

一个零依赖的 OpenAI 兼容 API 网关，首页采用控制台风格，适合做本地管理面板或部署到服务器入口。

## 页面

- 控制台首页：`GET /`
- 健康检查：`GET /health`

## 接口

- `GET /v1/models`
- `POST /v1/chat/completions`
- `POST /v1/responses`
- 其余 `/v1/*` 请求原样透传给上游

## 视觉结构

- 顶部导航 + 用户区
- 左侧分组侧边栏
- 数据看板卡片
- 模型消耗图表
- 令牌管理区

## 启动

```bash
cp .env.example .env
npm start
```

默认监听 `http://127.0.0.1:3000`。

## 环境变量

- `HOST`：监听地址，默认 `127.0.0.1`
- `PORT`：监听端口，默认 `3000`
- `UPSTREAM_BASE_URL`：上游 API 基础地址，必填
- `UPSTREAM_API_KEY`：自动注入到上游请求的密钥
- `UPSTREAM_AUTH_HEADER`：上游鉴权头名，默认 `authorization`
- `UPSTREAM_AUTH_PREFIX`：上游鉴权前缀，默认 `Bearer `
- `DEFAULT_MODEL`：默认模型名
- `PROXY_API_KEY`：启用后要求客户端携带 `Authorization: Bearer ...` 或 `X-Relay-Key`
- `ALLOWED_ORIGINS`：CORS 允许来源，默认 `*`
- `MAX_BODY_BYTES`：请求体大小限制，默认 `2097152`
- `REQUEST_TIMEOUT_MS`：上游请求超时，默认 `120000`
- `MAX_REQUESTS_PER_MINUTE`：简单限流，默认 `120`

## 使用示例

```bash
curl http://127.0.0.1:3000/health
```

启用 `PROXY_API_KEY` 后：

```bash
curl http://127.0.0.1:3000/health \
  -H 'Authorization: Bearer your-relay-key'
```
