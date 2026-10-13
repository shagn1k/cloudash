# CloudOpsHub Architecture

This document describes the architecture of CloudOpsHub.

## High-Level Architecture

The infrastructure conceptually follows this request flow:

```
                         USER
                           |
                           v
              Application Load Balancer
                           |
                           v
                         EC2
                           |
                       Docker
                           |
                    CloudOpsHub
                  (Node.js + React)
                           |
                    AWS SDK / APIs
                           |
       +-------------------+-------------------+
       |                   |                   |
       v                   v                   v
      EC2             CloudWatch              ALB
   Information          Metrics          Target Health
```

## Application Stack
- **Frontend**: React + Vite + Tailwind CSS (served via the Node.js backend)
- **Backend**: Node.js + Express
- **Infrastructure Provisioning**: Terraform
- **Containerization**: Docker
- **CI/CD**: GitHub Actions

## Deployment Strategy
The application operates in two distinct modes configured by the `APP_MODE` environment variable.

### Development Mode (`APP_MODE=development`)
For local development:
- All infrastructure values (EC2 state, CPU, ALB health) are seamlessly mocked.
- No AWS credentials are required.
- Easy to run locally via `docker-compose up` or `npm run start`.

### AWS Production Mode (`APP_MODE=aws`)
For AWS deployment:
- The Node backend fetches **real** metrics via the AWS SDK.
- The EC2 instance retrieves its instance ID and region from EC2 metadata.
- An IAM Instance Profile securely grants the backend read-only access to CloudWatch, EC2, ALB, and ECR APIs without hardcoded credentials.

## Infrastructure as Code (Terraform)
Located in `/terraform`, this project provisions the following AWS components:
- **VPC & Networking**: Dedicated VPC with 2 public subnets and an Internet Gateway.
- **Compute**: An EC2 instance running Amazon Linux 2 with Docker pre-installed via `user_data`.
- **Load Balancing**: An Application Load Balancer to route HTTP traffic to the EC2 target group.
- **Security**: Security Groups restricting EC2 ingress to the ALB and SSH, while allowing ALB ingress from everywhere.
- **IAM**: Role and Instance Profile allowing the application to self-monitor.
- **Monitoring**: Pre-configured CloudWatch Alarms for CPU utilization, instance status checks, and ALB healthy host counts.
- **Container Registry**: An ECR Repository to store built application images.

## Continuous Integration/Continuous Deployment (CI/CD)
Located in `.github/workflows/deploy.yml`:
1. **Test & Build**: Installs dependencies and runs unit tests for both frontend and backend.
2. **Containerize**: Builds the production Docker image containing the statically built React frontend and Express backend.
3. **Push to ECR**: Authenticates with AWS and pushes the new image to ECR.
4. **Deploy to EC2**: Uses AWS Systems Manager (SSM) to instruct the EC2 instance to pull the new image and restart the container, effectively executing a zero-downtime deployment.
