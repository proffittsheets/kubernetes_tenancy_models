# Kubernetes Tenancy Models in EKS

An interactive explorer for six Kubernetes multi-tenancy models on Amazon EKS — from fully shared (ISV/MSP, Namespace-as-a-Service) to fully isolated (Cell-Based, Single-Tenant Clusters) — plus a cross-cutting look at AI-augmented platform operations.

## What it does

- **Explore** — step through each tenancy model on a shared → isolated spectrum, with an account-first diagram showing where AWS account boundaries fall, an ownership lens (central platform team vs. tenant), and scoring meters (isolation, cost efficiency, ops simplicity, scalability)
- **Compare** — a matrix scoring all six models across the same four axes, with clickable axis definitions explaining how each score is built
- **AI Ops** — the three zones of AI-augmented operations (assisted, declarative agents, autonomous), each linked back to the models they apply to, plus an animated self-healing demo

## File structure

```
index.html        — HTML skeleton, styling (CSS variables, theme tokens), and script loading
js/
  patterns-data.js — model data, meters, AI-ops zones, self-healing script
tenancy/
  ui.jsx          — shared primitives: Icon, Meter, KBox, ControlPlane, AWS account boundary, lenses
  diagram.jsx     — per-model EKS topology diagrams
  aiops.jsx       — AI Ops mode: autonomy zones + self-healing demo
  app.jsx         — app shell, state, spectrum/compare views
terraform/        — AWS infrastructure (S3 + CloudFront); see terraform/README.md
```

## Running locally

Open `index.html` directly in a browser — no build step or server required.

## Hosting

The site is hosted as a static site on AWS S3 behind CloudFront. Infrastructure is managed with Terraform. See [terraform/README.md](terraform/README.md) for setup and deployment instructions.
