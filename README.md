# cloudflare-ai-web

## AI 启动！

### 一键部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FJazee6%2Fcloudflare-ai-web&env=OPENAI_API_KEY,PASSWORD&envDescription=%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%E4%BF%A1%E6%81%AF%E8%AF%B7%E6%9F%A5%E7%9C%8B&envLink=https%3A%2F%2Fgithub.com%2FJazee6%2Fcloudflare-ai-web)

示例：https://ai.jaze.top

### Deno Deploy

https://dash.deno.com

- Fork 本仓库
- Build Step改为`NITRO_PRESET=deno-deploy npm run build_node`
- Deploy Project
- 设置环境变量

### Docker

```bash
docker run -d --name cloudflare-ai-web \
  -e OPENAI_API_KEY=YOUR_OPENAI_API_KEY \
  -e PASSWORD=YOUR_PASSWORD \
  -p 3000:3000 \
  --restart=always \
  jazee6/cloudflare-ai-web
```

## 特性

- 利用 OpenAI API 快速搭建AI平台
- 支持 Serverless 部署，无需服务器
- 支持开启访问密码，聊天记录本地存储
- 轻量化(~646 kB gzip)
- 支持`ChatGPT`等
- **新增功能**：AI消息一键复制，代码块单独复制按钮
- 支持多语言（中文/英文）

### 模型支持

你可以在`./utils/db.ts`中增删模型

## 部署说明

### 环境变量列表

| 名称             | 描述                           | 
|----------------|------------------------------|
| OPENAI_API_KEY | OpenAI API Key               |     
| OPENAI_API_URL | 自定义OpenAI API请求地址（可选）       |
| PASSWORD       | 访问密码 (可选)                    |   

示例： 查看`.env.example`文件

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Jazee6/cloudflare-ai-web&type=Date)](https://star-history.com/#Jazee6/cloudflare-ai-web&Date)
