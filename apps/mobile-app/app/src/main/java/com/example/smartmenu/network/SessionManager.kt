package com.example.smartmenu

import android.content.Context
import android.content.SharedPreferences
import java.util.UUID

class SessionManager(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("smartmenu_secure_prefs", Context.MODE_PRIVATE)

    // Тестові акаунти в пам'яті для перевірки всіх ролей та реєстрації
    private val registeredAccounts = mutableListOf(
        AccountRecord("user@smartmenu.ua", "123456", "Денис", "Ковалевський", UserRole.REGISTERED_USER, true, null),
        AccountRecord("admin@tartufo.ua", "admin123", "Олександр", "Адмін", UserRole.RESTAURANT_ADMIN, true, 2),
        AccountRecord("sysadmin@smartmenu.ua", "sys123", "Нікіта", "Санін", UserRole.SYSTEM_ADMIN, true, null),
        AccountRecord("blocked@smartmenu.ua", "123456", "Іван", "Заблокований", UserRole.REGISTERED_USER, false, null)
    )

    data class AccountRecord(
        val email: String,
        val passwordHash: String,
        val firstName: String,
        val lastName: String,
        val role: UserRole,
        val isActive: Boolean,
        val restaurantId: Int?
    )

    fun saveSession(session: UserSession) {
        prefs.edit()
            .putString("jwt_token", session.jwtToken)
            .putString("user_id", session.id)
            .putString("first_name", session.firstName)
            .putString("last_name", session.lastName)
            .putString("email", session.email)
            .putString("role", session.role.name)
            .putInt("restaurant_id", session.managedRestaurantId ?: -1)
            .apply()
    }

    fun getActiveSession(): UserSession? {
        val token = prefs.getString("jwt_token", null) ?: return null
        val roleStr = prefs.getString("role", UserRole.GUEST.name) ?: UserRole.GUEST.name
        val restId = prefs.getInt("restaurant_id", -1).takeIf { it != -1 }
        return UserSession(
            id = prefs.getString("user_id", "") ?: "",
            firstName = prefs.getString("first_name", "") ?: "",
            lastName = prefs.getString("last_name", "") ?: "",
            email = prefs.getString("email", "") ?: "",
            role = UserRole.valueOf(roleStr),
            jwtToken = token,
            managedRestaurantId = restId
        )
    }

    fun clearSession() {
        prefs.edit().clear().apply()
    }

    fun isEmailTaken(email: String): Boolean {
        return registeredAccounts.any { it.email.equals(email.trim(), ignoreCase = true) }
    }

    fun registerNewUser(firstName: String, lastName: String, email: String, pass: String): Result<Unit> {
        if (isEmailTaken(email)) {
            return Result.failure(Exception("Користувач із такою електронною поштою вже зареєстрований"))
        }
        registeredAccounts.add(
            AccountRecord(
                email = email.trim(),
                passwordHash = pass,
                firstName = firstName.trim(),
                lastName = lastName.trim(),
                role = UserRole.REGISTERED_USER,
                isActive = true,
                restaurantId = null
            )
        )
        return Result.success(Unit)
    }

    fun authenticate(email: String, pass: String): Result<UserSession> {
        val account = registeredAccounts.find { it.email.equals(email.trim(), ignoreCase = true) }
            ?: return Result.failure(Exception("Невірна електронна пошта або пароль"))

        if (account.passwordHash != pass) {
            return Result.failure(Exception("Невірна електронна пошта або пароль"))
        }
        if (!account.isActive) {
            return Result.failure(Exception("Обліковий запис деактивовано адміністратором. Доступ заборонено."))
        }
        if (account.role == UserRole.RESTAURANT_ADMIN && account.restaurantId == null) {
            return Result.failure(Exception("Адміністратору не призначено жодного закладу"))
        }

        val fakeJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${UUID.randomUUID()}"
        val session = UserSession(
            id = UUID.randomUUID().toString(),
            firstName = account.firstName,
            lastName = account.lastName,
            email = account.email,
            role = account.role,
            jwtToken = fakeJwt,
            managedRestaurantId = account.restaurantId
        )
        saveSession(session)
        return Result.success(session)
    }
}