output "ec2_public_ip" {
  description = "Elastic IP attached to the EC2 instance."
  value       = aws_eip.web.public_ip
}

output "ec2_public_dns" {
  description = "Public DNS name of the EC2 instance."
  value       = aws_instance.web.public_dns
}

output "rds_endpoint" {
  description = "RDS MySQL endpoint. This is not a password, but avoid publishing real infrastructure details."
  value       = aws_db_instance.mysql.address
}

output "rds_port" {
  description = "RDS MySQL port."
  value       = aws_db_instance.mysql.port
}

output "rds_master_user_secret_arn" {
  description = "Secrets Manager secret ARN managed by RDS for the master user password."
  value       = aws_db_instance.mysql.master_user_secret[0].secret_arn
  sensitive   = true
}
