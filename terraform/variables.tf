variable "project_name" {
  description = "Name prefix for AWS resources."
  type        = string
  default     = "logpon"
}

variable "aws_region" {
  description = "AWS region where resources are planned."
  type        = string
  default     = "ap-northeast-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet that hosts EC2."
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets used by RDS. RDS subnet groups should span at least two AZs."
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "ec2_instance_type" {
  description = "EC2 instance type. t4g uses ARM64."
  type        = string
  default     = "t4g.micro"
}

variable "ec2_key_name" {
  description = "Optional existing AWS Key Pair name for SSH. Leave empty when using SSM Session Manager only."
  type        = string
  default     = ""
}

variable "enable_ssh" {
  description = "Whether to open inbound SSH to EC2. Prefer false and use SSM Session Manager."
  type        = bool
  default     = false
}

variable "ssh_allowed_cidrs" {
  description = "CIDR blocks allowed to SSH when enable_ssh is true. Use your own IP /32, never a broad range for production."
  type        = list(string)
  default     = []
}

variable "db_instance_class" {
  description = "RDS MySQL instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_name" {
  description = "Initial database name for the Django application."
  type        = string
  default     = "logpon"
}

variable "db_username" {
  description = "RDS master username. The password is managed by RDS/Secrets Manager, not by Terraform variables."
  type        = string
  default     = "logpon_admin"
}

variable "db_allocated_storage" {
  description = "Allocated RDS storage in GB."
  type        = number
  default     = 20
}

variable "enable_route53_record" {
  description = "Whether to create a Route 53 A record for the application domain."
  type        = bool
  default     = false
}

variable "hosted_zone_name" {
  description = "Existing public Route 53 hosted zone name, such as example.com. Leave empty when enable_route53_record is false."
  type        = string
  default     = ""
}

variable "app_domain_name" {
  description = "Fully qualified application domain name, such as logpon.example.com. Leave empty when enable_route53_record is false."
  type        = string
  default     = ""
}

variable "route53_record_ttl" {
  description = "TTL in seconds for the Route 53 A record."
  type        = number
  default     = 300
}
