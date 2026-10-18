MATRESHKARP_WORKS — исправленный проект

Исправлено: добавлены gradlew и gradle/wrapper/gradle-wrapper.properties в корень архива и в папку android. Скрипт попытается загрузить официальный gradle-wrapper.jar, если он отсутствует.

На телефоне распакуй архив полностью. Если Android IDE всё равно не может собрать проект, используй облачную сборку через GitHub по инструкции BUILD_APK_FROM_PHONE_RU.md.

Важно: это исходный проект, не готовый APK. В MainActivity.java пока заглушка HTTPS URL, а API требует настройки и развёртывания backend.
