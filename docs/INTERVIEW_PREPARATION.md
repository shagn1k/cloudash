# Interview Preparation Guide: CloudOpsHub

This guide is designed to help you prepare for technical interviews (like Deloitte Cloud Engineering / HCE Associate Analyst roles) using CloudOpsHub as your portfolio project.

## Project Summary Pitch
"I built CloudOpsHub, a complete AWS cloud infrastructure monitoring and DevOps platform. It demonstrates a full modernization journey—from a locally developed React and Node.js application to a containerized, cloud-hosted architecture. I provisioned the underlying AWS infrastructure using Terraform (VPC, EC2, ALB, ECR), containerized the application with Docker, and built a CI/CD pipeline using GitHub Actions for automated deployment. The final deployed application actually monitors the real AWS infrastructure running it, pulling metrics directly from CloudWatch and the AWS SDK without relying on fake data in production."

## Key Concepts to Discuss

### 1. Infrastructure as Code (Terraform)
**What you did**: Used Terraform to define and provision AWS resources declaratively.
**Why**: Ensures reproducibility, avoids manual console errors, allows version control for infrastructure, and aligns with modern DevOps practices.
**Resources provisioned**: VPC, Subnets, Internet Gateway, Route Tables, Security Groups, EC2, ALB, Target Groups, ECR, CloudWatch Alarms, IAM Roles.

### 2. Containerization (Docker)
**What you did**: Packaged the Node.js backend and React frontend into a multi-stage Docker image.
**Why**: Resolves "it works on my machine" issues. Multi-stage builds reduce the final image size and improve security by not including development dependencies and build tools in the production image.

### 3. Continuous Integration and Continuous Deployment (CI/CD)
**What you did**: Used GitHub Actions to automate testing, building, pushing to ECR, and deploying to EC2.
**Why**: Automates repetitive tasks, reduces human error, and ensures that code changes are properly tested before reaching production.

### 4. AWS Services Used
- **EC2 (Elastic Compute Cloud)**: Provides scalable compute capacity. Runs the Docker container.
- **ALB (Application Load Balancer)**: Distributes incoming traffic across targets (EC2). Enables health checks.
- **ECR (Elastic Container Registry)**: Securely stores Docker images.
- **VPC (Virtual Private Cloud)**: Isolates the network logically.
- **IAM (Identity and Access Management)**: Used an Instance Profile rather than hardcoded credentials to allow EC2 to read AWS metrics securely.
- **CloudWatch**: Collects logs and metrics; triggers alarms on high CPU or health check failures.

### 5. Application Architecture
**What you did**: Designed a Node.js Express application that exposes REST APIs and serves a statically compiled React frontend. The application switches behavior based on the `APP_MODE` environment variable.
**Why**: Local development is decoupled from AWS costs and setup. Production mode uses real AWS SDK calls for accurate self-monitoring.

## Common Interview Questions

**Q: How does the application securely access AWS APIs without hardcoded credentials?**
A: "I used an IAM Instance Profile attached directly to the EC2 instance. The AWS SDK running inside the application automatically assumes this role and uses temporary, rotating credentials to fetch metrics from CloudWatch and EC2."

**Q: What would happen if the application crashes?**
A: "The ALB performs continuous health checks on the `/api/health` endpoint. If the application crashes, the ALB stops routing traffic to it. We also have a Python automation script that could be triggered by CloudWatch alarms to attempt restarts, and Docker itself can restart containers if they fail."

**Q: How did you ensure security in this project?**
A: "I used principle of least privilege in IAM. The Security Groups are tightly scoped—EC2 only accepts traffic from the ALB, and the ALB accepts port 80 traffic. I also avoided embedding any AWS access keys in the codebase."

**Q: Why didn't you use Kubernetes (EKS)?**
A: "For this specific workload, a single containerized application behind an ALB on EC2 provides a robust, highly available architecture without the operational overhead and complexity of Kubernetes. It's important to choose the right tool for the job, and keeping the architecture simple enhances maintainability while still demonstrating containerization and cloud principles."
