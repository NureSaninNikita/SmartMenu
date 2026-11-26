package com.example.smartmenu

import androidx.compose.runtime.mutableStateListOf

enum class UserRole {
    GUEST, REGISTERED_USER, RESTAURANT_ADMIN, SYSTEM_ADMIN
}

enum class DishStatus(val label: String) {
    AVAILABLE("доступна"),
    UNAVAILABLE("тимчасово недоступна"),
    ARCHIVED("архівована")
}

data class UserSession(
    val id: String,
    val firstName: String,
    val lastName: String,
    val email: String,
    val role: UserRole,
    val jwtToken: String,
    val managedRestaurantId: Int? = null
)

data class Restaurant(
    val id: Int,
    val name: String,
    val description: String,
    val address: String,
    val city: String,
    val phoneNumber: String,
    val openingHours: String,
    val cuisineType: String,
    val status: String = "Active"
)

data class ReviewItem(
    val id: Int,
    val dishId: Int,
    val authorName: String,
    val text: String,
    val rating: Int,
    val tasteMatchScore: Int?,
    val dateLabel: String,
    val createdAtTimestamp: Long,
    val restaurantId: Int? = null
)

data class DishItem(
    val id: Int,
    val restaurantId: Int,
    val restaurantName: String,
    val name: String,
    val category: String,
    val price: Double,
    val status: DishStatus,
    val imageUrl: String?,
    val ingredients: List<String>,
    val weightGrams: Int?,
    val calories: Int?,
    val proteins: Double?,
    val fats: Double?,
    val carbohydrates: Double?,
    val averageRating: Double,
    val ratingsCount: Int
)

object MockRepository {
    val categories = mutableStateListOf("Усі", "Салати", "СНІДАНКИ", "Основні страви", "Супи", "Роли", "Піца")

    val allIngredients = listOf(
        "Авокадо", "Бекон", "Борошно", "Бульйон", "Вершки",
        "Зелень", "Креветки", "Курка", "Лосось", "Моцарела",
        "Овочі", "Рис", "Сир", "Томатний соус", "Трюфель", "Яйця"
    )

    val restaurants = mutableStateListOf(
        Restaurant(1, "Облака", "Панорамний ресторан сучасної європейської та авторської кухні.", "вул. Сумська, 82, Харків", "Харків", "+380991112233", "10:00 – 22:00", "Європейська • Авторська"),
        Restaurant(2, "Villa Tartufo", "Вишукана італійська кухня зі стравами з чорного та білого трюфеля.", "вул. Сумська, 37, Харків", "Харків", "+380977703500", "09:00 – 22:00", "Італійська • Сніданки"),
        Restaurant(3, "Япошка", "Популярний ресторан азійської та італійської кухні: роли, рамени, боули.", "просп. Науки, 14, Харків", "Харків", "+380675554433", "10:00 – 23:00", "Японська • Паназійська"),
        Restaurant(4, "Тратторія Культура", "Автентична неаполітанська піца з дров'яної печі та домашня паста.", "вул. Культури, 22Б, Харків", "Харків", "+380508889900", "11:00 – 22:00", "Піца • Італійська")
    )

    val dishes = mutableStateListOf(
        DishItem(1, 1, "Облака", "Салат зі свіжих овочів та ніжним сиром", "Салати", 229.0, DishStatus.AVAILABLE, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600", listOf("Зелень", "Овочі", "Сир"), 260, 291, 10.4, 20.8, 15.6, 4.65, 12),
        DishItem(2, 1, "Облака", "Теплий боул з лососем, кіноа та авокадо", "Основні страви", 365.0, DishStatus.AVAILABLE, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600", listOf("Лосось", "Авокадо", "Зелень", "Овочі"), 320, 440, 26.5, 24.0, 28.0, 4.9, 19),
        DishItem(3, 1, "Облака", "Крем-суп із лісових грибів з вершками", "Супи", 195.0, DishStatus.AVAILABLE, "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600", listOf("Бульйон", "Вершки", "Зелень"), 300, 275, 6.8, 19.5, 16.2, 4.5, 8),
        DishItem(4, 2, "Villa Tartufo", "Авокадо", "СНІДАНКИ", 80.0, DishStatus.AVAILABLE, "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600", listOf("Авокадо", "Зелень"), 150, 240, 3.0, 22.0, 12.0, 4.4, 6),
        DishItem(5, 2, "Villa Tartufo", "Зерновий тост з авокадо, томатною сальсою та сиром Буко", "СНІДАНКИ", 330.0, DishStatus.AVAILABLE, "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600", listOf("Авокадо", "Овочі", "Сир", "Яйця"), 280, 410, 14.2, 26.5, 31.0, 4.85, 14),
        DishItem(6, 2, "Villa Tartufo", "Тальятеле з чорним трюфелем та пармезаном", "Основні страви", 420.0, DishStatus.UNAVAILABLE, "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600", listOf("Борошно", "Вершки", "Трюфель", "Сир"), 310, 580, 16.0, 34.0, 52.0, 4.92, 25),
        DishItem(7, 3, "Япошка", "Філадельфія з лососем та авокадо", "Роли", 319.0, DishStatus.AVAILABLE, "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600", listOf("Рис", "Лосось", "Авокадо", "Сир"), 290, 460, 19.0, 21.0, 48.0, 4.8, 31),
        DishItem(8, 3, "Япошка", "Том Ям з тигровими креветками", "Супи", 289.0, DishStatus.AVAILABLE, "https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=600", listOf("Бульйон", "Креветки", "Рис", "Зелень"), 380, 340, 22.0, 16.0, 24.0, 4.75, 18),
        DishItem(9, 4, "Тратторія Культура", "Піца Маргарита з буратою та базиліком", "Піца", 295.0, DishStatus.AVAILABLE, "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600", listOf("Борошно", "Томатний соус", "Моцарела", "Сир", "Зелень"), 450, 890, 34.0, 38.0, 96.0, 4.88, 27),
        DishItem(10, 4, "Тратторія Культура", "Салат Цезар з куркою гриль та беконом", "Салати", 245.0, DishStatus.AVAILABLE, "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600", listOf("Курка", "Бекон", "Зелень", "Сир", "Яйця"), 270, 420, 28.0, 29.0, 12.0, 4.6, 15)
    )

    val reviews = mutableStateListOf(
        ReviewItem(1, 1, "Дмитро Шевченко", "Відчувається увага до деталей. Овочі дуже свіжі, сир ніжний. Обов'язково повернуся за цією стравою.", 5, 94, "2 дні тому", 1700000400L),
        ReviewItem(2, 1, "Артем Мороз", "Приємно здивувала подача та баланс заправки. Наступного разу візьму знову.", 5, 86, "5 днів тому", 1700000300L),
        ReviewItem(3, 1, "Олена Коваль", "Смачний легкий салат, але у вечірній час трохи довго чекали на подачу.", 4, null, "1 тиждень тому", 1700000200L),
        ReviewItem(4, 5, "Максим Бондар", "Найкращий тост з авокадо у місті! Хрусткий хліб і багато начинки.", 5, 91, "3 дні тому", 1700000500L),
        ReviewItem(5, 7, "Аліна Власенко", "Дуже свіжий лосось і правильний рис, порція велика.", 5, 89, "Вчора", 1700000600L)
    )

    fun addCategory(name: String) {
        if (!categories.contains(name)) categories.add(name)
    }

    fun removeCategory(name: String) {
        categories.remove(name)
    }

    fun saveDish(dish: DishItem) {
        val index = dishes.indexOfFirst { it.id == dish.id }
        if (index >= 0) dishes[index] = dish else dishes.add(dish)
    }

    fun saveReview(review: ReviewItem) {
        val index = reviews.indexOfFirst { it.id == review.id }
        if (index >= 0) {
            reviews[index] = review
        } else {
            val newId = (reviews.maxOfOrNull { it.id } ?: 0) + 1
            reviews.add(review.copy(id = newId))
        }
        updateDishRating(review.dishId)
    }

    fun deleteReview(reviewId: Int) {
        val review = reviews.find { it.id == reviewId }
        reviews.removeIf { it.id == reviewId }
        review?.let { updateDishRating(it.dishId) }
    }

    private fun updateDishRating(dishId: Int) {
        if (dishId == 0) return

        val dishReviews = reviews.filter { it.dishId == dishId }
        val newAvg = if (dishReviews.isNotEmpty()) dishReviews.map { it.rating }.average() else 0.0
        val index = dishes.indexOfFirst { it.id == dishId }
        if (index >= 0) {
            val roundedAvg = Math.round(newAvg * 100) / 100.0
            dishes[index] = dishes[index].copy(averageRating = roundedAvg, ratingsCount = dishReviews.size)
        }
    }


}