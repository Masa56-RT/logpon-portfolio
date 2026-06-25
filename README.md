# logpon

> このリポジトリは、ポートフォリオ公開用に調整中です。公開に向けて、秘密情報や本番環境固有情報を含めない形へ整理しています。

2026冬Eチームの開発リポジトリです。アプリ名はログぽんです。

## 開発環境

- Python 3.14 # 最新のLTSバージョン
- Django 6.0.1 # 最新のLTSバージョン
- MySQL 8.4 # AWS RDS MySQLのLTS(8.4)と整合
- Bootstrap5 26.1 # Djangoと互換性のある最新版

## ディレクトリ・ファイル構成(本番用)
本プロジェクトのディレクトリ・ファイル構成を以下のとおり示す。
```
└── プロジェクト名
    ├── src                                   # ソースディレクトリ
    │   ├── apps                              # バックエンドディレクトリ
    │   │   ├── core                          # 共通動作ディレクトリ
    │   │   │    ├── __init__.py              # パッケージ化のための空ファイル
    │   │   │    └── views.py                 # ページ設定用ファイル
    │   │   └── (your_app)                    # 任意
    │   ├── templates                         # テンプレートディレクトリ
    │   │   └── (your_html)                   # 任意
    │   ├── static                            # 静的ファイルディレクトリ
    │   │   ├── img                           # 画像ディレクトリ
    │   │   │   └── (your_img)                # 任意
    │   │   ├── css                           # CSSディレクトリ
    │   │   │   └── (your_css)                # 任意
    │   │   └── js                            # JavaScriptディレクトリ
    │   │       └── (your_js)                 # 任意
    │   ├── config                            # プロジェクト設定ディレクトリ
    │   │   ├── __init__.py                   # パッケージ化のための空ファイル
    │   │   ├── urls.py                       # プロジェクト全体のURL設定
    │   │   ├── asgi.py                       # 非同期通信のための設定ファイル
    │   │   ├── wsgi.py                       # 同期通信のための設定ファイル
    │   │   ├── middleware                    # ミドルウエア設定ディレクトリ
    │   │   │   ├── __init__.py               # パッケージ化のための空ファイル）
    │   │   │   └── health_check.py           # ヘルスチェック用設定ファイル
    │   │   └── settings                      # 環境設定ディレクトリ
    │   │       ├── __init__.py               # パッケージ化のための空ファイル
    │   │       ├── base.py                   # 全環境共通の設定
    │   │       ├── dev.py                    # 開発環境専用の設定（例: DEBUG=True）
    │   │       └── prod.py                   # 本番環境専用の設定（例: DEBUG=False, セキュリティ強化）
    │   └── manage.py                         # Django管理ファイル
    ├── docker                                # Dockerディレクトリ
    │   ├── Dockerfile                        # Python(Django)のDockerイメージ
    │   ├── wait-for-it.sh                    # DB起動後にDjangoを開始するためのシェルスクリプト
    │   └── nginx                             # nginx用ディレクトリ
    │   　      ├── nginx.conf                # nginxのconfファイル
    │   　      └── conf.d/                　 # デフォルトnginx用ディレクトリ
    │   　      　　　└─ default.conf         # デフォルトnginxのconfファイル
    ├── .dockerignore                         # Dockerビルド時の無視ファイルの設定
    ├── .gitignore                            # GitHubにpushしないファイルの設定
    ├── docker-compose.yml                    # Python(django)とDBの構成ファイル
    ├── Makeflie                              # コマンド省略のための設定ファイル
    ├── .env                                  # 開発用環境設定ファイル（Gitに含めない）
    ├── .env.exapmle                          # 環境変数のテンプレート（ダミー値で共有）
    ├── pull_request_template.md              # プロジェクトの説明ファイル
    ├── README.md                             # プロジェクトの説明ファイル
    └── requirements.txt                      # 依存関係ファイル
```

##  起動/終了手順
開発環境の起動から終了までの手順
1) 環境変数ファイル.envの作成
.env.exampleをコピーして、.envファイルをプロジェクトルートディレクトリ直下に保存する。
注）.envファイルは必ず、.env.exampleファイルと同じ階層に保存すること。（Docker、Djangoの設定ファイルで環境変数.envのファイルパスを指定しているため。）

`cp .env.example .env`
以下が.env.exampleの中身であり、「各自で変更する設定」を各自で変更する。
「DJANGO_SECRET_KEY」の設定は、以下のとおりである。

`python -c "import secrets; print(secrets.token_urlsafe(50))"`
```
 =======  チームで共通にする設定 =======
MYSQL_DATABASE=django_db                    # 開発環境で使うデータベース名（チームで共通・固定）
MYSQL_USER=dev_user                         # 開発用のデータベースユーザ名（チーム共通）
MYSQL_HOST=db                               # Django(web)コンテナが接続するDBコンテナ名(db)（チーム共通）
DJANGO_PORT=8000                            # Djangoのポート番号（チーム共通）
DJANGO_LANGUAGE_CODE=ja                     # 言語コード設定(チーム共通)
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1    # アプリにアクセスできるホスト・ドメイン名（チーム共通）
DJANGO_SETTINGS_MODULE=config.settings.dev  # 開発環境ファイルの参照（チーム共通）
TZ=Asia/Tokyo                               # タイムゾーン設定（チーム共通）
USERNAME=appuser                            # コンテナ内のユーザーネーム（チーム共通）
GROUPNAME=appgroup                          # コンテナ内のグループネーム（チーム共通）
```

```
 ======= 🔧 各自で変更する設定 =======
MYSQL_PASSWORD=your_own_password            # 各自がローカル環境で設定するDBユーザーパスワード(環境開発で各自設定、非公開)
MYSQL_ROOT_PASSWORD=your_root_pw            # MYSQLのrootパスワード(開発環境で各自設定、非公開)
DJANGO_SECRET_KEY=your_secret_key           # Djangoのセキュリティキー(必ず各自で生成すること)
DJANGO_DEBUG=True                           # デバッグモード設定。開発中はTrue、本番や検証環境はFalse推奨
UID=your_uid                                # 各自のuidを指定（id -uコマンドで確認）
GID=your_gid                                # 各自のgidを指定（id -gコマンドで確認
```

2) 起動時のdockerコマンド
初回起動ではイメージをビルドする必要があるため、以下のコマンドで起動させる。

`docker compose up --build`

2回目以降は既にイメージがビルドされているため、以下のコマンドで起動してもよい。
必要に応じて、 -d をupの後に付けて、バックグラウンドで起動してもよい。

`docker compose up -d`

3) 終了時のdockerコマンド
終了時は以下のコマンドで終了する。
必要に応じて、ボリューム（db_data）を削除する場合は、 -v をdownのあとに付ける。

`docker compose down`

## アクセス先
ブラウザで以下のアドレスを入力して、Djangoの初期画面が開いていることを確認する。

`http://localhost:8000/`

もしくは

`http://127.0.0.1:8000/`
```
ドキュメントが 「日本語」 、DEBUGが 「True」 になっていることを確認する。
