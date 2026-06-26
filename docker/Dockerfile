# 最新のLTSバージョンである3.14を使用
FROM python:3.14

# Pythonの出力をバッファリングしないように設定（ログが見やすくなるように設定）
ENV PYTHONUNBUFFERED=1

# ビルド時に渡す変数の定義
ARG UID=1000
ARG GID=1000
ARG USERNAME=appuser
ARG GROUPNAME=appgroup

# 非ルートユーザーの作成（GID衝突を吸収）
RUN set -eux; \
    # 1) GID が既に存在するなら、その既存グループを使う（groupaddしない）
    if getent group "${GID}" >/dev/null; then \
        EXISTING_GROUP="$(getent group "${GID}" | cut -d: -f1)"; \
        echo "GID ${GID} already exists as group '${EXISTING_GROUP}'. Skip groupadd."; \
    else \
        groupadd --gid "${GID}" "${GROUPNAME}"; \
        echo "Created group '${GROUPNAME}' with GID ${GID}"; \
    fi; \
    \
    # 2) UID が既に存在する場合は username の作成をスキップ/失敗させる（安全側）
    if getent passwd "${UID}" >/dev/null; then \
        EXISTING_USER="$(getent passwd "${UID}" | cut -d: -f1)"; \
        echo "ERROR: UID ${UID} already exists as user '${EXISTING_USER}'. Choose a different UID."; \
        exit 1; \
    fi; \
    \
    # 3) user を作成（所属GIDは数値で指定するので、グループ名衝突に依存しない）
    useradd --uid "${UID}" --gid "${GID}" --shell /bin/bash --create-home "${USERNAME}"

# 作業ディレクトリの設定
WORKDIR /src

# wait-for-it.shをコンテナにコピー、実行権限を付与
COPY docker/wait-for-it.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/wait-for-it.sh

# requirements.txtをワーキングディレクトリ直下にコピー
# 依存関係ファイルのみ先にコピー（キャッシュ効率化のため）
COPY requirements.txt .

# pipをアップデートして、Pythonのパッケージをインストール(-Uは--upgrade)
# ローカルの保存用ディレクトリ（キャッシュ）の影響を排除して、常に最新のパッケージをインストールしたいため、--no-cache-dirを採用
RUN pip install -U pip && \
    pip install --no-cache-dir -r requirements.txt

# コンテナの実行ユーザーを非rootユーザーに設定
USER ${USERNAME}

# ポート番号の明記（ドキュメント目的）
# 実際の指定はdocker-compose.ymlで指定
EXPOSE 8000



