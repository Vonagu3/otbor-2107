#!/bin/zsh
# Публикация сайта: проставляет новую версию ресурсов (чтобы браузеры не брали старый кэш),
# делает коммит и отправляет на GitHub. Запуск: ./publish.sh "описание изменений"
set -e
cd "$(dirname "$0")"
V=$(date +%Y%m%d%H%M%S)
for f in *.html; do
  sed -i '' -E "s/(_common\.css|_common\.js|_config\.js|_theme\.js|teacher\.js)(\?v=[0-9]+)?\"/\1?v=$V\"/g" "$f"
done
git add -A
git commit -q -m "${1:-Обновление сайта}" || true
git push -q
echo "Опубликовано, версия ресурсов $V. Сайт обновится в течение минуты."
