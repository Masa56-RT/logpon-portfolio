# Terraform for Logpon Portfolio

このディレクトリは、ログポンを AWS EC2 + RDS MySQL にデプロイするための最小 Terraform 構成です。

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

## コスト注意

`terraform plan` までは基本的にリソースは作成されません。

実際にコストが発生し得るのは `terraform apply` 後です。特に次のリソースに注意してください。

- EC2
- RDS MySQL
- RDS storage
- Elastic IP / public IPv4
- Secrets Manager secret
- EBS volume

この構成では NAT Gateway は作成しません。

`terraform destroy` 後は、Elastic IP の解放忘れに注意してください。

## 秘密情報の扱い

次の値は Git にコミットしないでください。

- `terraform.tfvars`
- `terraform.tfstate`
- `terraform.tfstate.backup`
- `.terraform/`
- SSH 秘密鍵
- DB パスワード
- 実際の AWS アカウント固有情報

このリポジトリでは `terraform.tfvars.example` だけを管理対象にします。

## plan までの手順

Terraform を初めて実行する前に、AWS CLI の認証情報を設定してください。

```bash
aws sts get-caller-identity
```

想定した AWS アカウントが表示されることを確認します。

次に、サンプルをコピーしてローカル専用の変数ファイルを作ります。

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

`terraform.tfvars` は Git 管理しません。

初期化します。

```bash
terraform init
```

フォーマットと構文確認をします。

```bash
terraform fmt
terraform validate
```

作成予定の差分だけ確認します。

```bash
terraform plan
```

ここまででは AWS リソースを作成しません。

## apply前チェックリスト

`terraform apply` は AWS リソースを実際に作成し、コストが発生し得ます。実行前に必ず次を確認します。

- `aws sts get-caller-identity` で想定した AWS アカウントであることを確認する
- AWS リージョンが `ap-northeast-1` であることを確認する
- `git status` で `terraform.tfvars` / `terraform.tfstate` / `.env` がコミット対象に出ていないことを確認する
  - `.terraform.lock.hcl` は Git 管理対象でよい
- `terraform validate` が成功していることを確認する
- `terraform plan` の結果が、想定したリソースのみ add で、change/destroy が 0 であることを確認する
  - 現時点の目安: `Plan: 18 to add, 0 to change, 0 to destroy.`
- plan に `aws_nat_gateway` が含まれていないことを確認する
- RDS が `publicly_accessible = false` であることを確認する
- RDS の `instance_class` が `db.t4g.micro` であることを確認する
- EC2 の `instance_type` が `t4g.micro` であることを確認する
- Security Group で SSH `22` が開いていないことを確認する
- Security Group で RDS `3306` が `0.0.0.0/0` に開いていないことを確認する
- 作業開始時刻と終了予定時刻を決める
- 検証後に `terraform destroy` することを決めてから実行する

## apply について

`terraform apply` は AWS リソースを実際に作成し、コストが発生し得ます。

このリポジトリでは、意図せず実行しないでください。実行前に必ず plan の内容とコスト発生リソースを確認します。

## 初回デプロイの流れ

初回検証では、Terraform で AWS リソースを作成した後、EC2 上でアプリを配置して動作確認します。

1. `terraform apply` で AWS リソースを作成する
2. `terraform output -raw ec2_public_ip` で Elastic IP を確認する
3. `terraform output -raw rds_endpoint` で RDS endpoint を確認する
   - EC2 上の Django コンテナから RDS MySQL に接続するときの `MYSQL_HOST` に使う
4. `terraform output -raw rds_master_user_secret_arn` で RDS secret ARN を確認する
   - RDS 接続に必要なマスターパスワードが保存されている Secrets Manager secret の場所を確認する
   - secret ARN 自体はパスワードではないが、公開しない
5. AWS Systems Manager Session Manager で EC2 に接続する
6. EC2 上で `docker --version` / `docker compose version` / `aws --version` を確認する
7. EC2 上でアプリケーションコードを取得する
   - このリポジトリの、ポートフォリオ公開用・AWS 簡易構成用に調整したコードを取得する
8. EC2 上で `.env` を作成する
   - `.env.example` をもとに、EC2 上だけで使う実行時設定ファイルとして作成する
9. `.env` の権限を `chmod 600 .env` にする
10. Secrets Manager から RDS のマスターパスワードを取得する

    ```bash
    aws secretsmanager get-secret-value \
      --secret-id "<rds_master_user_secret_arn>" \
      --query SecretString \
      --output text
    ```

11. `.env` に RDS 接続情報、Django 公開先情報、Django secret key を設定する
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
      DJANGO_ALLOWED_HOSTS=<Elastic IP>,127.0.0.1,localhost
      DJANGO_CSRF_TRUSTED_ORIGINS=http://<Elastic IP>
      ```

    - Django secret key:

      ```env
      DJANGO_SECRET_KEY=<EC2上で生成した値>
      ```

    - `DJANGO_SECRET_KEY` の生成例:

      ```bash
      python3 -c "import secrets; print(secrets.token_urlsafe(50))"
      ```

12. `docker compose up --build -d` でアプリを起動する
13. `docker compose ps` と `docker compose logs` で起動状態を確認する
14. `http://<Elastic IP>/health/` にアクセスしてヘルスチェックを確認する
15. `http://<Elastic IP>/` にアクセスして画面表示を確認する
16. 検証が終わったら `terraform destroy` で削除する
17. AWS コンソールで EC2 / RDS / Elastic IP / EBS / Secrets Manager に削除漏れがないか確認する

`.env` は EC2 上の実行時設定ファイルとして作成し、リポジトリには含めません。
DB パスワード、Secrets Manager の値、`DJANGO_SECRET_KEY` などの秘密情報は、README、`.tf`、`terraform.tfvars.example`、`user_data` に書きません。
また、Terraform の `aws_instance.web.user_data` は tfstate に残る可能性があるため、秘密情報を書きません。

## destroy について

検証後に削除する場合は、作成したリソースを Terraform で削除します。

```bash
terraform destroy
```

`destroy` も実リソースを削除する操作なので、実行前に対象リソースを必ず確認してください。
