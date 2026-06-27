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

## apply について

`terraform apply` は AWS リソースを実際に作成し、コストが発生し得ます。

このリポジトリでは、意図せず実行しないでください。実行前に必ず plan の内容とコスト発生リソースを確認します。

## destroy について

検証後に削除する場合は、作成したリソースを Terraform で削除します。

```bash
terraform destroy
```

`destroy` も実リソースを削除する操作なので、実行前に対象リソースを必ず確認してください。

