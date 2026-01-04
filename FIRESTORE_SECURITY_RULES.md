# Firestore Security Rules для Nomis

## ⚠️ КРИТИЧЕСКИ ВАЖНО ДЛЯ БЕЗОПАСНОСТИ

Ваше приложение использует Firebase Firestore для хранения данных пользователей. **ОБЯЗАТЕЛЬНО** настройте правила безопасности в Firebase Console, иначе данные пользователей могут быть скомпрометированы.

## Текущее состояние безопасности

### ✅ Что уже защищено:
1. **Аутентификация через Google OAuth** - используется официальный Firebase Auth
2. **Данные хранятся по userId** - каждый пользователь имеет свой документ
3. **API ключи в переменных окружения** - не захардкожены в коде
4. **Валидация userId** - проверяется перед сохранением/загрузкой данных

### ❌ Что НУЖНО настроить в Firebase Console:

## Рекомендуемые Firestore Security Rules

Перейдите в Firebase Console → Firestore Database → Rules и установите следующие правила:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Правила для коллекции users
    match /users/{userId} {
      // Пользователь может читать и писать ТОЛЬКО свои данные
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Дополнительная валидация данных при записи
      allow create, update: if request.auth != null 
        && request.auth.uid == userId
        && request.resource.data.keys().hasAll(['version', 'tasks', 'categories', 'habits', 'lastModified'])
        && request.resource.data.version is int
        && request.resource.data.tasks is list
        && request.resource.data.categories is list
        && request.resource.data.habits is list
        && request.resource.data.lastModified is string;
    }
    
    // Запретить доступ ко всем остальным коллекциям
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Как установить правила:

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Выберите ваш проект
3. Перейдите в **Firestore Database** → **Rules**
4. Скопируйте правила выше
5. Нажмите **Publish**

## Дополнительные рекомендации по безопасности:

### 1. Защита API ключей
- ✅ Firebase API ключ можно безопасно использовать в клиенте (это публичный идентификатор)
- ✅ Реальная безопасность обеспечивается через Firestore Rules
- ⚠️ НЕ храните Gemini API ключ в клиенте (если используете)

### 2. Настройка Firebase Authentication
В Firebase Console → Authentication → Settings:
- Включите только **Google Sign-In**
- Настройте **Authorized domains** (добавьте ваш домен продакшена)
- Включите **Email enumeration protection**

### 3. Мониторинг безопасности
Регулярно проверяйте:
- Firebase Console → Firestore → Usage (необычная активность)
- Authentication → Users (подозрительные аккаунты)

### 4. Резервное копирование
Настройте автоматический экспорт данных:
- Firebase Console → Firestore → Import/Export
- Рекомендуется еженедельный экспорт в Cloud Storage

## Проверка текущих правил

Выполните в Firebase Console → Firestore → Rules → Simulator:

**Тест 1: Неавторизованный доступ (должен быть ЗАПРЕЩЕН)**
```
Operation: get
Location: /users/test-user-id
Auth: Unauthenticated
Expected: DENY ✅
```

**Тест 2: Доступ к своим данным (должен быть РАЗРЕШЕН)**
```
Operation: get
Location: /users/test-user-id
Auth: Authenticated as test-user-id
Expected: ALLOW ✅
```

**Тест 3: Доступ к чужим данным (должен быть ЗАПРЕЩЕН)**
```
Operation: get
Location: /users/other-user-id
Auth: Authenticated as test-user-id
Expected: DENY ✅
```

## Анализ текущего кода

### ✅ Безопасные практики в коде:
1. Используется `request.auth.uid` для идентификации пользователя
2. Данные сохраняются в `/users/{userId}` - изолированы по пользователям
3. Нет прямых SQL-инъекций (используется Firestore SDK)
4. Нет XSS уязвимостей (React автоматически экранирует)

### ⚠️ Потенциальные улучшения:
1. Добавить rate limiting на стороне Firebase (Cloud Functions)
2. Валидировать размер данных (ограничить количество задач)
3. Добавить логирование подозрительной активности

## Что делать ПРЯМО СЕЙЧАС:

1. ✅ Установите Firestore Security Rules (см. выше)
2. ✅ Проверьте Authorized Domains в Firebase Auth
3. ✅ Убедитесь, что `.env.local` в `.gitignore`
4. ✅ Настройте мониторинг использования Firebase

## Контакты для вопросов

Если возникнут вопросы по безопасности:
- [Firebase Security Documentation](https://firebase.google.com/docs/rules)
- [Firebase Security Checklist](https://firebase.google.com/support/guides/security-checklist)
