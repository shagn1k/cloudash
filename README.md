# CloudOpsHub

CloudOpsHub is a cloud infrastructure monitoring dashboard and DevOps platform. It demonstrates how a locally developed web application can be containerized and modernized into a cloud-hosted AWS architecture using Infrastructure as Code, CI/CD, monitoring, and security best practices.

This project is tailored to demonstrate practical understanding of Cloud Engineering and DevOps for portfolio and interview purposes.

## Features
- **Modern Web Application**: Built with React (Vite) and Node.js (Express).
- **Dual Mode Operation**:
  - `development`: Runs locally with simulated infrastructure data.
  - `aws`: Retrieves real infrastructure data from AWS using the AWS SDK.
- **Infrastructure as Code**: Fully provisioned AWS architecture using Terraform.
- **Containerized**: Multi-stage Docker build.
- **Automated CI/CD**: GitHub Actions pipeline for testing, building, and deploying.
- **Monitoring & Health Checks**: CloudWatch metrics and ALB target health integration.
- **Self-Monitoring**: The dashboard monitors the actual AWS infrastructure it runs on.

## Project Structure
```
.
├── backend/          # Node.js + Express API
├── frontend/         # React + Vite UI
├── terraform/        # Infrastructure as Code (AWS)
├── .github/          # GitHub Actions CI/CD workflows
├── scripts/          # Python automation scripts
├── docs/             # Architecture and interview preparation docs
├── Dockerfile        # Multi-stage container build
└── docker-compose.yml # Local development configuration
```

## Running Locally (Development Mode)

### Using Docker (Recommended)
Make sure you have Docker installed.

```bash
docker-compose up --build
```
Access the application at `http://localhost:5001`. The dashboard will display "DEVELOPMENT" and use simulated data.

### Manual Setup
1. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
2. **Backend**:
   ```bash
   cd backend
   npm install
   npm run start
   ```
   Access the application at `http://localhost:5001`.

## AWS Deployment (Production Mode)
> **Note**: Do not run `terraform apply` unless you intend to provision real AWS resources and incur associated costs.

1. Ensure AWS CLI is configured with the correct permissions.
2. Initialize and deploy infrastructure:
   ```bash
   cd terraform
   terraform init
   terraform plan
   terraform apply
   ```
3. Push the code to the `main` branch on GitHub to trigger the CI/CD pipeline, which will build the Docker image, push it to ECR, and deploy it to the EC2 instance created by Terraform.

## Documentation
- [Architecture Details](docs/architecture.md)
- [Interview Preparation Guide](docs/INTERVIEW_PREPARATION.md)
