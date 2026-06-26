# 長いコマンドを省略して打てるようにするための設定
# PHONYはMakefileで独自コマンドを設定するための宣言
.PHONY: up down build logs sh migrate mm csu db load

up:        ## 起動
	docker compose up -d
down:      ## 停止
	docker compose down
build:     ## ビルド
	docker compose up --build
logs:      ## Djangoのログ確認
	docker compose logs -f web
sh:        ## Djangoコンテナのシェルに入る
	docker compose exec -it web /bin/bash
app:	   ## apps直下に新規アプリを作成する
	docker compose exec web mkdir -p apps/$(name)
	docker compose exec web python manage.py startapp $(name) apps/$(name)
migrate:   ## マイグレーション実行
	docker compose exec web python manage.py migrate
mm:        ## マイグレーション作成
	docker compose exec web python manage.py makemigrations
csu:       ## 管理ユーザー作成
	docker compose exec web python manage.py createsuperuser
db:		   ## MySQLコンテナに入る
	docker compose exec -it db mysql -u dev_user -p
load:
	docker compose exec web python manage.py loaddata apps/users/fixtures/initial_users.json
	docker compose exec web python manage.py loaddata apps/timers/fixtures/initial_sounds.json
	docker compose exec web python manage.py loaddata apps/timers/fixtures/initial_timers.json
	docker compose exec web python manage.py loaddata apps/programs/fixtures/initial_programs.json
	docker compose exec web python manage.py loaddata apps/programs/fixtures/initial_program_timers.json
	docker compose exec web python manage.py loaddata apps/runs/fixtures/initial_program_runs.json
	docker compose exec web python manage.py loaddata apps/runs/fixtures/initial_timer_runs.json