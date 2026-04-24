#!/usr/bin/env bash
set -euo pipefail

: "${APP_NAME:?APP_NAME is required}"
: "${BUILD_NAMESPACE:?BUILD_NAMESPACE is required}"
: "${BUILD_SERVICE_ACCOUNT:?BUILD_SERVICE_ACCOUNT is required}"
: "${IMAGE_NAME:?IMAGE_NAME is required}"
: "${REPOSITORY:?REPOSITORY is required}"
: "${GIT_SHA:?GIT_SHA is required}"
: "${REGISTRY_SECRET_NAME:?REGISTRY_SECRET_NAME is required}"

GIT_AUTH_SECRET_NAME="${GIT_AUTH_SECRET_NAME:-github-repo-reader}"
GIT_AUTH_SECRET_KEY="${GIT_AUTH_SECRET_KEY:-token}"
K8S_JOB_TTL_SECONDS="${K8S_JOB_TTL_SECONDS:-600}"
IMAGE_TAG="${IMAGE_TAG:-$GIT_SHA}"
JOB_NAME="${JOB_NAME:-${APP_NAME}-build-$(printf '%s' "$IMAGE_TAG" | cut -c1-12)}"

kubectl delete job "$JOB_NAME" -n "$BUILD_NAMESPACE" --ignore-not-found=true >/dev/null 2>&1 || true

cat <<EOF | kubectl apply -f - >/dev/null
apiVersion: batch/v1
kind: Job
metadata:
  name: ${JOB_NAME}
  namespace: ${BUILD_NAMESPACE}
  labels:
    app.kubernetes.io/name: ${APP_NAME}-build
    app.kubernetes.io/part-of: ${APP_NAME}
spec:
  ttlSecondsAfterFinished: ${K8S_JOB_TTL_SECONDS}
  backoffLimit: 0
  activeDeadlineSeconds: 1800
  template:
    metadata:
      labels:
        app.kubernetes.io/name: ${APP_NAME}-build
        app.kubernetes.io/part-of: ${APP_NAME}
    spec:
      serviceAccountName: ${BUILD_SERVICE_ACCOUNT}
      restartPolicy: Never
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: node-role.kubernetes.io/control-plane
                    operator: DoesNotExist
      volumes:
        - name: workspace
          emptyDir: {}
        - name: docker-config
          secret:
            secretName: ${REGISTRY_SECRET_NAME}
            items:
              - key: .dockerconfigjson
                path: config.json
      initContainers:
        - name: checkout
          image: alpine:3.20
          command:
            - /bin/sh
            - -lc
          args:
            - |
              set -eu
              apk add --no-cache git ca-certificates >/dev/null
              git clone "https://x-access-token:\${GIT_TOKEN}@github.com/${REPOSITORY}.git" /workspace
              cd /workspace
              git fetch origin "${GIT_SHA}" --depth=1
              git checkout "${GIT_SHA}"
          env:
            - name: GIT_TOKEN
              valueFrom:
                secretKeyRef:
                  name: ${GIT_AUTH_SECRET_NAME}
                  key: ${GIT_AUTH_SECRET_KEY}
          volumeMounts:
            - name: workspace
              mountPath: /workspace
      containers:
        - name: kaniko
          image: gcr.io/kaniko-project/executor:v1.23.2-debug
          args:
            - --context=dir:///workspace
            - --dockerfile=/workspace/Dockerfile
            - --destination=${IMAGE_NAME}:${IMAGE_TAG}
            - --cache=true
            - --cache-repo=${IMAGE_NAME}-cache
            - --snapshot-mode=redo
            - --use-new-run
          volumeMounts:
            - name: workspace
              mountPath: /workspace
            - name: docker-config
              mountPath: /kaniko/.docker
EOF

printf '%s\n' "$JOB_NAME"
