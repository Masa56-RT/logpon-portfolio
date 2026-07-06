# Terraform for Logpon Portfolio

このディレクトリは、ログポンを AWS EC2 + RDS MySQL にデプロイするための最小 Terraform 構成を管理する。

## 方針

- 東京リージョンを使う
- EC2 は public subnet に置く
- RDS MySQL は private subnet に置く
- NAT Gateway は作らない
- SSH はデフォルトで開けない
- EC2 への管理接続は SSM Session Manager を優先する
- RDS のマスターパスワードは Terraform 変数に書かず、RDS の管理パスワード機能を使う
- `terraform apply` するまで AWS リソースは作成しない

## 作成予定の主なリソース

- VPC
- public subnet
- private subnet x 2
- Internet Gateway
- route table
- EC2 instance
- Elastic IP
- RDS MySQL instance
- RDS subnet group
- Security Group
- EC2 IAM Role / Instance Profile
- Route 53 A record

## コスト注意

`terraform plan` までは基本的にリソースは作成されない。

実際にコストが発生するのは `terraform apply` 後である。特に次のリソースに注意する。

- EC2
- RDS MySQL
- RDS storage
- Elastic IP
- Secrets Manager secret
- EBS volume

この構成では NAT Gateway は作成しない。

`terraform destroy` 後は、Elastic IP の解放忘れに注意する。

## 秘密情報の扱い

次の値およびファイルは Git にコミットしない。

- `terraform.tfvars`
- `terraform.tfstate`
- `terraform.tfstate.backup`
- `.terraform/`
- SSH 秘密鍵
- DB パスワード
- 実際の AWS アカウント固有情報

このリポジトリでは `terraform.tfvars.example` だけを管理対象にする。

## plan までの手順

Terraform を初めて実行する前に、AWS CLI の認証情報を設定する。

```bash
aws sts get-caller-identity
```

想定した AWS アカウントが表示されることを確認する。

次に、サンプルをコピーしてローカル専用の変数ファイルを作る。

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

`terraform.tfvars` は Git 管理しない。

Route 53 の A レコードを Terraform で作成する場合は、手動作成済みの Public Hosted Zone に合わせて `terraform.tfvars` に次を設定する。

```hcl
enable_route53_record = true
hosted_zone_name      = "example.com"
app_domain_name       = "logpon.example.com"
```

Hosted Zone 自体は Terraform 管理外とし、`terraform destroy` 後も残す。A レコードは Terraform 管理対象であるため、`terraform destroy` 時に削除される。

初期化する。

```bash
terraform init
```

フォーマットと構文確認をする。

```bash
terraform fmt
terraform validate
```

作成予定のリソースを確認する。

```bash
terraform plan
```

ここまででは AWS リソースを作成しない。

## apply前チェックリスト

`terraform apply` は AWS リソースを実際に作成し、コストが発生するため、実行前に必ず plan の内容、コスト発生リソース、次の事項を確認する。

- `aws sts get-caller-identity` で想定した AWS アカウントであることを確認する
- `terraform validate` が成功していることを確認する
- `terraform plan` の結果が、想定したリソースのみ add で、change/destroy が 0 であることを確認する
  - 現時点の目安: `Plan: 18 to add, 0 to change, 0 to destroy.`
  - Route 53 A レコード作成を有効にした場合の目安: `Plan: 19 to add, 0 to change, 0 to destroy.`
- `terraform.tfvars` / plan の内容が、東京リージョン `ap-northeast-1` 前提になっていることを確認する
- plan に `aws_nat_gateway` が含まれていないことを確認する
- RDS が `publicly_accessible = false` であることを確認する
- RDS の `instance_class` が `db.t4g.micro` であることを確認する
- EC2 の `instance_type` が `t4g.micro` であることを確認する
- Security Group で SSH `22` が開いていないことを確認する
- Security Group で RDS `3306` が `0.0.0.0/0` に開いていないことを確認する
- 作業開始時刻と終了予定時刻を決める
- 検証後に `terraform destroy` することを決めてから実行する
- 最後に `git status` で `terraform.tfvars` / `terraform.tfstate` / `.env` / `certbot/conf` がコミット対象に出ていないことを改めて確認する
  - `.terraform.lock.hcl` は Git 管理対象でよい

## 初回デプロイの流れ

初回検証では、Terraform で AWS リソースを作成した後、EC2 上でアプリを配置して動作確認する。

1. `terraform apply` で AWS リソースを作成する
2. `terraform apply` の出力から、初回デプロイで使う値を控える
   - `ec2_public_ip`
     - ブラウザで `http://<Elastic IP>/` にアクセスするときに使う
     - Route 53 A レコードを作成しない場合は、`.env` の `DJANGO_ALLOWED_HOSTS` に設定する
     - Route 53 A レコードを作成しない場合は、`.env` の `DJANGO_CSRF_TRUSTED_ORIGINS` に `http://<Elastic IP>` として設定する
   - `app_domain_name`
     - Route 53 A レコードを作成した場合に使う
     - ブラウザで `https://<app_domain_name>/` にアクセスするときに使う
     - `.env` の `APP_DOMAIN_NAME` に設定する
     - `.env` の `DJANGO_ALLOWED_HOSTS` に設定する
     - `.env` の `DJANGO_CSRF_TRUSTED_ORIGINS` に `https://<app_domain_name>` として設定する
     - certbot の `-d` に指定する
   - `rds_endpoint`
     - `.env` の `MYSQL_HOST` に設定する
3. sensitive output の RDS secret ARN を取得する

   ```bash
   terraform output -raw rds_master_user_secret_arn
   ```

   - Secrets Manager から RDS の `username` / `password` を取得するときの `--secret-id` に使う
   - secret ARN 自体はパスワードではないが、公開しない
4. AWS Systems Manager Session Manager で EC2 に接続する
5. EC2 上で基本コマンドを確認する

   ```bash
   whoami
   pwd
   docker --version
   docker compose version
   aws --version
   ```

6. EC2 上でアプリケーションコードを取得する
   - このリポジトリの、ポートフォリオ公開用・AWS 簡易構成用に調整したコードを取得する

   ```bash
   sudo mkdir -p /opt/logpon
   sudo chown ssm-user:ssm-user /opt/logpon
   cd /opt/logpon
   git clone https://github.com/<your-account>/<repo-name>.git .
   ls
   git status
   ```

7. EC2 上で `.env` を作成する
   - `.env.example` をもとに、EC2 上だけで使う実行時設定ファイルとして作成する

   ```bash
   cp .env.example .env
   chmod 600 .env
   ls -la .env
   ```

8. Secrets Manager から RDS のマスターパスワードを取得する

    ```bash
    aws secretsmanager get-secret-value \
      --secret-id "<rds_master_user_secret_arn>" \
      --query SecretString \
      --output text
    ```

9. `DJANGO_SECRET_KEY` を生成する

    ```bash
    python3 -c "import secrets; print(secrets.token_urlsafe(50))"
    ```

10. `.env` に RDS 接続情報、Django 公開先情報、Django secret key を設定する
    - RDS 接続情報:

      ```env
      MYSQL_DATABASE=logpon
      MYSQL_USER=logpon_admin
      MYSQL_PASSWORD=<Secrets Managerから取得したpassword>
      MYSQL_HOST=<terraform outputのrds_endpoint>
      MYSQL_PORT=3306
      ```

    - Django 公開先情報:

      ```env
      APP_DOMAIN_NAME=<app_domain_name>
      DJANGO_ALLOWED_HOSTS=<app_domain_name>,127.0.0.1,localhost
      DJANGO_CSRF_TRUSTED_ORIGINS=https://<app_domain_name>
      DJANGO_SECURE_SSL_REDIRECT=True
      DJANGO_SECURE_PROXY_SSL_HEADER=True
      DJANGO_CSRF_COOKIE_SECURE=True
      DJANGO_SESSION_COOKIE_SECURE=True
      DJANGO_SECURE_HSTS_SECONDS=0
      ```

    - Django secret key:

      ```env
      DJANGO_SECRET_KEY=<9で生成した値>
      ```

    入力後、RDS 接続情報、Django 公開先情報、`DJANGO_SECRET_KEY` に設定漏れがないことを確認する。`APP_DOMAIN_NAME` と certbot の `-d` には同じドメイン名を使う。

11. certbot standalone で Let's Encrypt 証明書を取得する
    - nginx 起動前に実行する
    - `--email` には自分のメールアドレスを指定する
    - `-d` には `.env` の `APP_DOMAIN_NAME` と同じ値を指定する

    ```bash
    mkdir -p certbot/conf
    sudo docker run --rm \
      -p 80:80 \
      -v /opt/logpon/certbot/conf:/etc/letsencrypt \
      certbot/certbot certonly \
      --standalone \
      -d <app_domain_name> \
      --email <your-email> \
      --agree-tos \
      --no-eff-email
    ```

12. `sudo docker compose up --build -d` でアプリを起動する

    ```bash
    sudo docker compose up --build -d
    sudo docker compose ps
    sudo docker compose logs --tail=100
    ```

13. EC2 内から nginx の応答を確認する

    ```bash
    curl -I http://localhost/
    curl -kI https://localhost/health/ -H "Host: <app_domain_name>"
    ```

14. ブラウザから `https://<app_domain_name>/health/` にアクセスしてヘルスチェックを確認する
15. ブラウザから `https://<app_domain_name>/` にアクセスして画面表示を確認する
16. 検証が終わったら `terraform destroy` で削除する
17. AWS コンソールで EC2 / RDS / Elastic IP / EBS / Secrets Manager に削除漏れがないか確認する

`.env` は EC2 上の実行時設定ファイルとして作成し、リポジトリには含めない。
DB パスワード、Secrets Manager の値、`DJANGO_SECRET_KEY`、Let's Encrypt の秘密鍵などの秘密情報は、README、`.tf`、`terraform.tfvars.example`、`user_data` に書かない。
`certbot/conf` は証明書と秘密鍵を含むため、Git に含めない。
また、Terraform の `aws_instance.web.user_data` は tfstate に残る可能性があるため、秘密情報を書かない。

## destroy について

検証後に削除する場合は、作成したリソースを Terraform で削除する。

```bash
terraform destroy
```

`destroy` も実リソースを削除する操作であるため、実行前に対象リソースを必ず確認する。
