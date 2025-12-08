

# Docker & Docker Compose — Lesson Notes

## 1. Why Docker Is Needed Even After Building Frontend & Backend

Even if your application runs locally, deployment requires a consistent environment. Docker solves this by packaging the app with:

* OS libraries
* Runtime versions (Python, Node)
* Dependencies
* Environment variables
* Network rules

This eliminates “works on my machine” issues and ensures identical deployment across any server.

---

## 2. What Docker Actually Does

Docker containerizes your application, meaning:

* Each service runs in its own isolated environment
* No dependency conflicts with the server
* Portability across platforms (AWS, DigitalOcean, VPS, etc.)
* Better security through isolation
* Easy rollbacks to previous versions

Containers run the same everywhere.

---

## 3. Why Use Docker Compose

Docker Compose lets you run **multiple services** together, for example:

* Frontend (React)
* Backend (FastAPI)
* Database (SQLite/Postgres)
* Reverse proxy (Nginx)

Compose orchestrates them into one unified system.

---

## 4. Running the Entire Stack with One Command

Once containerized, you no longer need to run your services manually.

Instead of:

```
npm start
uvicorn main:app --reload
python init_db.py
```

You simply use:

```
docker compose up -d
```

Compose handles:

* Building images
* Creating networks
* Starting all containers
* Ensuring proper routing between services
* Auto-restarting services

Stopping the entire system:

```
docker compose down
```

---

## 5. Common Docker Compose Commands

### Start everything (in background):

```
docker compose up -d
```

### Stop everything:

```
docker compose down
```

### Rebuild images after code changes:

```
docker compose build
```

### View logs:

```
docker compose logs -f
```

### View running containers:

```
docker ps
```

---

## 6. Benefits of Containerizing Your Full Stack

* Consistent environment across dev, staging, and production
* No manual installation of Node, Python, or dependencies on server
* Easy scaling (e.g., multiple backend containers)
* Clean architecture separation
* Simple deployment and CI/CD pipeline integration

---

## 7. Summary

Docker = package
Docker Compose = orchestrator

Together, they provide:

* Reliability
* Portability
* Automation
* Maintainability

Your entire application can be launched, stopped, and rebuilt using a single command.

---

If you want, I can also generate a **Dockerfile + docker-compose.yml template** for your React + FastAPI project.
