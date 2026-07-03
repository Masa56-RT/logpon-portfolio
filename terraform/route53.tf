data "aws_route53_zone" "app" {
  count = var.enable_route53_record ? 1 : 0

  name         = var.hosted_zone_name
  private_zone = false
}

resource "aws_route53_record" "app" {
  count = var.enable_route53_record ? 1 : 0

  zone_id = data.aws_route53_zone.app[0].zone_id
  name    = var.app_domain_name
  type    = "A"
  ttl     = var.route53_record_ttl
  records = [aws_eip.web.public_ip]
}
