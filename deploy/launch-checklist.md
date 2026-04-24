# DeepSeek V4 Flash Task 4 Launch Checklist

## Deployment Mapping

- GitHub repository: `gateszhangc/deepseekv4flash`
- Git branch: `main`
- Dokploy project: `n/a`
- Image repository: `registry.144.91.77.245.sslip.io/deepseekv4flash`
- K8s manifest path: `deploy/k8s/overlays/prod`
- Argo CD application: `deepseekv4flash`
- Primary domain: `deepseekv4flash.lol`
- Redirect domain: `www.deepseekv4flash.lol`
- Runtime path: `GitHub Actions -> K8s build Job -> registry -> deploy/k8s/overlays/prod/kustomization.yaml newTag -> ArgoCD auto-sync`

Route:

`gateszhangc/deepseekv4flash -> main -> registry.144.91.77.245.sslip.io/deepseekv4flash -> deploy/k8s/overlays/prod -> Argo CD deepseekv4flash`

## GitHub Actions Configuration

Repository variables:

- `REGISTRY_HOST`: defaults to `registry.144.91.77.245.sslip.io`
- `KUSTOMIZATION_IMAGE_NAME`: defaults to `registry.144.91.77.245.sslip.io/deepseekv4flash`
- `K8S_BUILD_NAMESPACE`: defaults to `webapp-build`
- `K8S_BUILD_SERVICE_ACCOUNT`: defaults to `kaniko-builder`
- `K8S_DOCKER_CONFIG_SECRET`: defaults to `webapp-registry-push`
- `K8S_GITHUB_TOKEN_SECRET`: defaults to `github-repo-reader`
- `K8S_GITHUB_TOKEN_KEY`: defaults to `token`
- `K8S_JOB_TTL_SECONDS`: defaults to `600`

Repository secrets:

- `KUBECONFIG_B64`, `KUBE_CONFIG_DATA`, `KUBE_CONFIG_B64`, or `KUBE_CONFIG`: base64 kubeconfig for the build cluster.

Cluster prerequisites:

- Namespace `webapp-build` exists.
- Service account `kaniko-builder` can run build jobs.
- Secret `webapp-registry-push` contains `.dockerconfigjson` with push access to `registry.144.91.77.245.sslip.io`.
- Optional secret `github-repo-reader` contains key `token` if the repo stays private.

## Cloudflare DNS And GSC

Google account: `gateszhang92@gmail.com`

Cloudflare DNS cutover should replace the Porkbun parked records with:

- `A @ -> 144.91.73.228`
- `A @ -> 144.91.77.245`
- `A @ -> 144.91.78.201`
- `CNAME www -> deepseekv4flash.lol`

Use the `webapp-launch-analytics` scripts as the source of truth:

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export WEBAPP_LAUNCH_ANALYTICS_SKILL_DIR="${WEBAPP_LAUNCH_ANALYTICS_SKILL_DIR:-$CODEX_HOME/skills/webapp-launch-analytics}"
export PRIMARY_URL="https://deepseekv4flash.lol"
export PRIMARY_DOMAIN_LOCK="deepseekv4flash.lol"
export SEO_PRIMARY_KEYWORD="deepseek v4 flash"
export SKIP_GA4=true
export SKIP_CLARITY=true
export K8S_LIVE_IPS="144.91.73.228,144.91.77.245,144.91.78.201"
export CLOUDFLARE_PROXY_APEX=false
export CLOUDFLARE_PROXY_WWW=false

bash "$WEBAPP_LAUNCH_ANALYTICS_SKILL_DIR/scripts/ensure-cloudflare-dns.sh" "$PRIMARY_URL"
bash "$WEBAPP_LAUNCH_ANALYTICS_SKILL_DIR/scripts/setup-gsc.sh" "$PRIMARY_URL"
bash "$WEBAPP_LAUNCH_ANALYTICS_SKILL_DIR/scripts/check-gsc-property.sh" "$PRIMARY_URL"
```

Expected GSC acceptance:

- `GSC_SITE_URL=sc-domain:deepseekv4flash.lol`
- `GSC_OWNER_CONFIRMED=true`
- `GSC_SITEMAP_LISTED=true`
- `https://deepseekv4flash.lol/sitemap.xml` submitted

## Release Flow

1. Push to `main`.
2. Trigger `Build And Release` if the workflow does not already start from the push.
3. GitHub Actions creates a Kaniko build job in `webapp-build`.
4. The job clones `gateszhangc/deepseekv4flash` at the pushed SHA and pushes `registry.144.91.77.245.sslip.io/deepseekv4flash:<git-sha>`.
5. The workflow updates `deploy/k8s/overlays/prod/kustomization.yaml` `newTag` and commits it back to `main` with `[skip ci]`.
6. Argo CD auto-syncs the overlay into namespace `deepseekv4flash`.

## Verification

Local:

```bash
npm test
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4217 npm run test:browser
SEO_KEYWORD_TARGETS=index.html \
  bash "$WEBAPP_LAUNCH_ANALYTICS_SKILL_DIR/scripts/check-seo-keyword.sh" "deepseek v4 flash"
kubectl kustomize deploy/k8s/overlays/prod
```

Post-deploy:

```bash
kubectl -n argocd get application deepseekv4flash
PLAYWRIGHT_BASE_URL=https://deepseekv4flash.lol npm run smoke:live
bash "$WEBAPP_LAUNCH_ANALYTICS_SKILL_DIR/scripts/verify-homepage-browser.sh" https://deepseekv4flash.lol
bash "$WEBAPP_LAUNCH_ANALYTICS_SKILL_DIR/scripts/verify-homepage-images.sh" https://deepseekv4flash.lol
```

Manual URL checks:

- `https://deepseekv4flash.lol/`
- `https://deepseekv4flash.lol/robots.txt`
- `https://deepseekv4flash.lol/sitemap.xml`
- `https://deepseekv4flash.lol/healthz`
- `https://www.deepseekv4flash.lol/` redirects to `https://deepseekv4flash.lol/`

## Rollback

Revert `deploy/k8s/overlays/prod/kustomization.yaml` to the last known-good `newTag` and push to `main`. Argo CD will auto-sync the prior image.
