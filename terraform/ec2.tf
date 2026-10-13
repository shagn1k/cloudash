data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.app_profile.name

  # Note: A real deployment would use a key pair
  # key_name = var.key_name

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              amazon-linux-extras install docker -y
              service docker start
              usermod -a -G docker ec2-user
              
              # Log in to ECR (Requires IAM role with ECR access)
              aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.app.repository_url}
              
              # Pull and run the container
              # In a real CI/CD pipeline, the container image would be specified with a tag
              # docker run -d -p ${var.app_port}:${var.app_port} --name app \
              #  -e APP_MODE=aws \
              #  -e AWS_REGION=${var.aws_region} \
              #  -e AWS_ALB_TARGET_GROUP_ARN=${aws_lb_target_group.app.arn} \
              #  -e AWS_ECR_REPOSITORY_NAME=${aws_ecr_repository.app.name} \
              #  -e AWS_EC2_INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id) \
              #  ${aws_ecr_repository.app.repository_url}:latest
              EOF

  tags = {
    Name = "${var.app_name}-app-instance"
  }
}

resource "aws_lb_target_group_attachment" "app" {
  target_group_arn = aws_lb_target_group.app.arn
  target_id        = aws_instance.app.id
  port             = var.app_port
}
