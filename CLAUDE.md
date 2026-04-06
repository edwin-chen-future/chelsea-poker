# Project Guidelines

## Git & GitHub

- Do NOT use `gh` CLI. Use `git` commands for all operations including merging and pushing.

## Deployment (AWS - us-west-2)

- **Infrastructure**: CloudFormation stack `chelsea-poker` (`infra/cloudformation.yaml`)
- **Compute**: ECS Fargate (0.25 vCPU, 512MB) — cluster `chelsea-poker`
- **Database**: RDS Postgres 15 (db.t3.micro) — `chelsea-poker-db`, database name `chelsea_poker`
- **API**: API Gateway HTTP API + VPC Link → ECS
- **API URL**: `https://fl6kz5achb.execute-api.us-west-2.amazonaws.com`
- **Container Image**: ECR `700788200157.dkr.ecr.us-west-2.amazonaws.com/chelsea-poker:latest`
- **Render is NOT used** — `render.yaml` is legacy and can be ignored

### Redeploy after code changes

```bash
cd backend
docker build --platform linux/amd64 -t chelsea-poker .
docker tag chelsea-poker:latest 700788200157.dkr.ecr.us-west-2.amazonaws.com/chelsea-poker:latest
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 700788200157.dkr.ecr.us-west-2.amazonaws.com
docker push 700788200157.dkr.ecr.us-west-2.amazonaws.com/chelsea-poker:latest
aws ecs update-service --cluster chelsea-poker --service chelsea-poker --force-new-deployment --region us-west-2
```
