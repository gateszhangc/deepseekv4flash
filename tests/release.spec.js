const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

test.describe("DeepSeek V4 Flash release assets", () => {
  test("workflow, kustomize, argocd, and launch docs stay aligned with task 4", async () => {
    const root = path.resolve(__dirname, "..");
    const workflow = fs.readFileSync(path.join(root, ".github/workflows/build-and-release.yml"), "utf8");
    const kustomization = fs.readFileSync(path.join(root, "deploy/k8s/overlays/prod/kustomization.yaml"), "utf8");
    const ingress = fs.readFileSync(path.join(root, "deploy/k8s/overlays/prod/ingress.yaml"), "utf8");
    const appProject = fs.readFileSync(path.join(root, "deploy/argocd/appproject.yaml"), "utf8");
    const application = fs.readFileSync(path.join(root, "deploy/argocd/application.yaml"), "utf8");
    const checklist = fs.readFileSync(path.join(root, "deploy/launch-checklist.md"), "utf8");
    const dockerfile = fs.readFileSync(path.join(root, "Dockerfile"), "utf8");

    expect(workflow).toContain("APP_NAME: deepseekv4flash");
    expect(workflow).toContain("BUILD_NAMESPACE");
    expect(workflow).toContain("webapp-build");
    expect(workflow).toContain("scripts/submit_k8s_build_job.sh");
    expect(workflow).toContain("scripts/sync_kustomize_image_tag.py");
    expect(workflow).toContain("registry.144.91.77.245.sslip.io/deepseekv4flash");
    expect(workflow).toContain("kaniko-builder");
    expect(workflow).not.toContain("dokploy");
    expect(workflow).not.toContain("googletagmanager");
    expect(workflow).not.toContain("clarity");

    expect(kustomization).toContain("namespace: deepseekv4flash");
    expect(kustomization).toContain("newName: registry.144.91.77.245.sslip.io/deepseekv4flash");
    expect(kustomization).toMatch(/newTag: (bootstrap|[0-9a-f]{40})/);
    expect(ingress).toContain("cert-manager.io/cluster-issuer: letsencrypt-prod-cloudflare");
    expect(ingress).toContain('cert-manager.io/issue-temporary-certificate: "true"');
    expect(ingress).not.toContain("acme.cert-manager.io/http01-edit-in-place");
    expect(ingress.match(/cert-manager\.io\/cluster-issuer/g) || []).toHaveLength(1);

    expect(appProject).toContain("name: deepseekv4flash");
    expect(appProject).toContain("https://github.com/gateszhangc/deepseekv4flash.git");
    expect(application).toContain("name: deepseekv4flash");
    expect(application).toContain("path: deploy/k8s/overlays/prod");
    expect(application).toContain("project: deepseekv4flash");

    expect(checklist).toContain("GitHub repository: `gateszhangc/deepseekv4flash`");
    expect(checklist).toContain("Git branch: `main`");
    expect(checklist).toContain("Dokploy project: `n/a`");
    expect(checklist).toContain("Argo CD application: `deepseekv4flash`");
    expect(checklist).toContain("https://deepseekv4flash.lol/sitemap.xml");
    expect(checklist).toContain("A @ -> 144.91.73.228");
    expect(checklist).toContain("A @ -> 144.91.77.245");
    expect(checklist).toContain("A @ -> 144.91.78.201");
    expect(checklist).toContain("Cloudflare DNS");
    expect(checklist).toContain("SKIP_GA4=true");
    expect(checklist).toContain("SKIP_CLARITY=true");

    expect(dockerfile).toContain("COPY assets ./assets");
    expect(dockerfile).toContain('CMD ["node", "server.js"]');
  });
});
