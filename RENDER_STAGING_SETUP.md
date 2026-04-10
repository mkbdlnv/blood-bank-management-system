# Render Staging Setup

This project is prepared for a gated staging deployment on Render.

## Target Architecture

- `bbms-frontend-staging`: Render Static Site
- `bbms-backend-staging`: Render Web Service
- `MongoDB Atlas`: external MongoDB database
- `GitHub Actions`: runs QA first, then triggers Render deploy hooks only if tests pass

## 1. Create the Database

Create a free MongoDB Atlas cluster and copy the connection string.

Required backend environment variables:

```bash
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=<strong-random-secret>
ALLOWED_ORIGINS=https://<your-frontend>.onrender.com
PORT=5000
NODE_ENV=production
```

## 2. Create the Backend Service on Render

In Render:

1. Create a new `Web Service`
2. Connect this repository
3. Select branch `qa`
4. Use the Docker configuration from [render.yaml](/Users/medetkabdulinov/Desktop/Study/AQA/ass1/blood-bank-management-system/render.yaml)
5. Set the backend environment variables listed above
6. Keep `Auto-Deploy` disabled because GitHub Actions will trigger deployment after tests pass

Recommended health check:

```text
/health
```

## 3. Create the Frontend Static Site on Render

In Render:

1. Create a new `Static Site`
2. Connect this repository
3. Select branch `qa`
4. Build command:

```bash
cd frontend && npm ci && npm run build
```

5. Publish directory:

```bash
frontend/dist
```

6. Add:

```bash
VITE_API_BASE_URL=https://<your-backend>.onrender.com
```

7. Add a rewrite rule for SPA behavior if you configure the service manually:

```text
/*  /index.html  200
```

If you create the service from [render.yaml](/Users/medetkabdulinov/Desktop/Study/AQA/ass1/blood-bank-management-system/render.yaml), the rewrite route is already defined there.

## 4. Add Render Deploy Hooks

For both services, create a Render deploy hook in the dashboard.

Then add these GitHub repository secrets:

```bash
RENDER_BACKEND_DEPLOY_HOOK_URL
RENDER_FRONTEND_DEPLOY_HOOK_URL
```

## 5. Deployment Flow

The staging deployment workflow is:

1. Push code to branch `qa`
2. GitHub Actions runs the QA pipeline
3. If the QA workflow fails, staging deployment is not triggered
4. If the QA workflow succeeds, GitHub Actions calls the Render deploy hooks
5. Render deploys the latest version of the `qa` branch

This satisfies the requirement to block deployment when tests fail.

## 6. Notes

- The frontend is now environment-aware and uses `VITE_API_BASE_URL` for remote API requests in staging.
- The backend now supports configurable CORS through `ALLOWED_ORIGINS`.
- For local development, you can continue using the Vite proxy and Docker Compose.
