# Docker 与 Kubernetes 部署

> 当前认证是演示实现：公开的 `admin/admin123` 和可伪造的固定 Cookie。
> 容器化不等于生产安全。接入正式认证或受控认证网关前，只能用于受信任的测试环境，不能公网暴露或保护真实数据。

## 文件与默认行为

- `Dockerfile`：Node.js 24 Debian slim，多阶段构建，运行阶段使用非 root 用户。
- `.dockerignore`：排除 `.env*`、私钥、本地依赖、测试代码、测试报告和 Git 元数据。
- `next.config.ts`：启用 standalone，显式追踪 AI 配置。
- `k8s/`：Kustomize 管理 Namespace、ConfigMap、Deployment 和 ClusterIP Service。
- `k8s/ingress.example.yaml`：可选 Traefik HTTPS Ingress，不包含在默认部署中。

默认 Mock 不需要 Secret，也不会调用 Ollama/Qwen。
本地开发使用 `config/ai.yaml`；Kubernetes 使用 `k8s/config/ai.yaml`，挂载至 `/app/config/ai.yaml`。

## 1. 构建与本地验证

先运行项目质量检查：

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
pnpm test:e2e:run
```

`pnpm start` 与 E2E 均运行 standalone 的 `server.js`，启动脚本会补齐静态资源。
镜像内已在构建阶段复制好静态资源，因此直接执行 `node server.js`，无需 pnpm 或启动包装脚本。

Docker daemon 启动后：

```bash
docker build --pull -t ai-demo:local .
docker run --rm --name ai-demo-local \
  --read-only --cap-drop=ALL --security-opt=no-new-privileges \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m,uid=1000,gid=1000 \
  --tmpfs /app/.next/cache:rw,nosuid,size=256m,uid=1000,gid=1000 \
  -p 127.0.0.1:3001:3000 ai-demo:local
```

访问 `http://localhost:3001`，验证登录及收入趋势流式图表。另一个终端检查：

```bash
curl --fail http://localhost:3001/api/health/live
curl --fail http://localhost:3001/api/health/ready
docker exec ai-demo-local id
docker exec ai-demo-local sh -c 'test ! -d /app/src && test ! -d /app/node_modules/vitest'
```

测试代码不会进入构建上下文；运行镜像只复制 standalone、静态资源和 public，不复制仓库或构建阶段的完整 node_modules。
依赖安装使用 `--ignore-scripts`：避免在无 `.git` 的镜像中执行 `prepare: lefthook install`。
当前依赖依赖预编译二进制；新增需要安装脚本的原生依赖时，应重新审核 Docker 构建步骤。
这不替代或跳过本地/CI 的 lint、测试或 Git hooks。

容器本地使用 Live 时，额外挂载配置并注入运行环境变量，不要通过 build args/COPY 注入密钥：

```bash
docker run --rm --name ai-demo-live -p 127.0.0.1:3001:3000 \
  --mount type=bind,src="$(pwd)/k8s/config",dst=/app/config,readonly \
  --env-file .env.k8s.local ai-demo:local
```

先在该配置中设 `mode: live`。Ollama 在宿主机时使用可达宿主机地址，在集群中使用 Service DNS；容器的 `127.0.0.1` 不代表宿主机或其他 Pod。

## 2. 发布镜像

以下 registry 地址是示例，请替换为自己的仓库。版本使用唯一 tag 或 digest，不要复用 `latest`。

```bash
docker buildx build --platform linux/amd64 \
  -t registry.example.com/team/ai-demo:YOUR_VERSION --push .
```

ARM 集群改用 `linux/arm64`；混合集群可构建 `linux/amd64,linux/arm64` 多架构镜像。
基础 Node 镜像也建议在发布流水线中固定到组织批准的 digest。
这些命令会发布镜像；本次提供配置不会自动执行发布或操作集群。

## 3. 部署到 Kubernetes

修改 `k8s/kustomization.yaml` 的 `images`：

```yaml
images:
  - name: ai-demo
    newName: registry.example.com/team/ai-demo
    newTag: YOUR_VERSION
```

私有仓库需另行配置 `imagePullSecrets`。如果修改 Namespace，也要同步调整配置里的 Ollama Service DNS 和可选 Ingress 的 namespace。

```bash
# 本地渲染，不访问集群。
kubectl kustomize k8s

# 确认当前 kubeconfig 指向正确集群后执行。
kubectl apply --dry-run=server -k k8s
kubectl apply -k k8s
kubectl -n ai-demo rollout status deployment/ai-demo --timeout=180s
kubectl -n ai-demo port-forward service/ai-demo 3001:80
```

首次部署时若 namespace 尚不存在，server dry-run 中其他资源可能报 namespace 不存在；可先创建 namespace 再执行 server dry-run。

基础清单不安装 Ingress Controller、Ollama、数据库或证书服务。
ClusterIP 不等于网络隔离：集群内其他工作负载仍可能访问，按组织要求配 NetworkPolicy/网关。

## 4. Qwen Secret 与模型切换

在未提交的 `.env.k8s.local` 中保存真实值：

```dotenv
DASHSCOPE_API_KEY=你的真实密钥
```

不要把真实 Secret YAML 或密钥放入 Git。Kubernetes Secret 的 Base64 不是加密；生产环境配合 RBAC、etcd 静态加密或外部 Secret 管理。

```bash
kubectl apply -f k8s/namespace.yaml
kubectl -n ai-demo create secret generic ai-demo-secrets \
  --from-env-file=.env.k8s.local --dry-run=client -o yaml \
  | kubectl apply -f -
```

修改 `k8s/config/ai.yaml`：

```yaml
mode: live
# providers / models 保留已有定义。
assignments:
  data-assistant: qwen-bi
```

北京以外地域同步替换 `aliyun.baseURL`。Ollama 则选择 `local-bi`，并在运行环境中设置 `OLLAMA_MODEL` 为实际安装的模型名。

```bash
kubectl apply -k k8s
kubectl -n ai-demo rollout status deployment/ai-demo
```

ConfigMap 内容 hash 会修改 Pod 模板并触发滚动更新，避免挂载配置与进程配置版本混用。
仅更新 Secret 不会自动重启现有 Pod，需要：

```bash
kubectl -n ai-demo rollout restart deployment/ai-demo
kubectl -n ai-demo rollout status deployment/ai-demo
```

Live 缺失密钥时 readiness 为 503，不接收 Service 流量。探针不校验远端连通性或 API Key 有效性，部署后仍需实际发起一轮对话验证。

## 5. Ingress 与 SSE

先解决正式认证、TLS 和域名。示例假设已有 Traefik，按实际情况修改 class、host 和 TLS Secret：

```bash
kubectl apply -f k8s/ingress.example.yaml
```

Traefik 识别 SSE 响应时会立即转发；不要对 Chat 挂载 Buffering 中间件。若已有全局中间件，也需要检查。
Ingress 资源没有通用的响应缓冲/超时字段，需在实际 Controller 和前置 LB/CDN 上配置。
例如 Traefik Controller 的静态配置（不是应用 Deployment 配置）：

```yaml
entryPoints:
  websecure:
    transport:
      respondingTimeouts:
        writeTimeout: 360s
```

该超时需覆盖模型整个请求时长；前置负载均衡器的空闲超时也应大于可能的无输出间隔。
不要仅凭 Service 直连成功就断言外部 SSE 正常，应在实际 HTTPS 地址中观察文字与图表是否逐段出现。
保持原始 Host 与正确的转发头，不要关闭 Next.js Server Actions 的来源校验来绕过网关配置问题。

## 6. 探针、资源与更新

- Startup/liveness：`/api/health/live`，只反映进程响应能力。
- Readiness：`/api/health/ready`，校验配置格式与当前模型所需环境变量。
- 两个接口均不要求登录，仅返回固定状态，不返回密钥或错误细节。
- Pod 使用 uid/gid 1000、只读根文件系统，只有 `/tmp`、`.next/cache` 为临时可写卷。
- 默认两个副本、请求 100m CPU/256Mi 内存、限制 1 CPU/1Gi，按实际负载调整。
- 默认模型超时 60s，Pod 终止宽限 90s，其中 preStop 10s 用于路由摘除传播。提高模型超时或重试预算时，同步增加终止宽限和网关超时。滚动更新仍需测试长连接中断场景。
- 同一版本所有副本使用同一构建镜像。当前聊天状态在浏览器中，不依赖 Pod 粘性会话；刷新会重置。
- `.next/cache` 每 Pod 独立；以后增加 ISR/共享缓存、数据库或持久化会话时，需另外设计跨副本存储。

排障：

```bash
kubectl -n ai-demo get pods
kubectl -n ai-demo describe deployment ai-demo
kubectl -n ai-demo logs deployment/ai-demo --tail=100
```

## 官方参考

- [Next.js standalone 输出](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Kubernetes 探针](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Traefik SSE 转发](https://doc.traefik.io/traefik/reference/routing-configuration/http/load-balancing/service/)
- [Traefik 入口超时](https://doc.traefik.io/traefik/reference/install-configuration/entrypoints/)
