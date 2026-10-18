# Сборка APK с телефона

В проект включён workflow GitHub Actions: `.github/workflows/build-apk.yml`.

1. Создай репозиторий GitHub и загрузи содержимое архива в корень репозитория.
2. Открой вкладку Actions.
3. Запусти `Build MATRESHKARP_WORKS APK` через `Run workflow`.
4. После завершения открой запуск workflow и скачай artifact `MATRESHKARP_WORKS-debug-apk`.
5. Распакуй artifact и найди `app-debug.apk`.

Локально в Android IDE можно открыть папку `android`. Скрипт `android/gradlew` скачивает Gradle 8.9 автоматически, если доступны интернет, Java и unzip. Некоторые мобильные IDE ограничивают эти возможности, поэтому GitHub Actions — запасной способ.

Важно: APK включает локальный интерфейс. Регистрация, заказы и чат не заработают, пока backend не размещён на сервере и `web/app.js` не настроен на его HTTPS API URL вместо `http://localhost:3000/api`.
