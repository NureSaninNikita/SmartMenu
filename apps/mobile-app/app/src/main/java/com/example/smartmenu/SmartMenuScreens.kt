package com.example.smartmenu

import android.util.Patterns
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import com.example.smartmenu.R


val BgCream = Color(0xFFFAF7F2)
val CardPinkBg = Color(0xFFFFF7F7)
val CardBorderCoral = Color(0xFFE5A9A9)
val ForestGreen = Color(0xFF1E4631)
val CoralText = Color(0xFF9E2A2B)
val MutedText = Color(0xFF6C757D)
val StarGold = Color(0xFFE6A100)

// ==========================================
// ШАПКА ДОДАТКА З ВАШИМ ЛОГОТИПОМ (logo.png)
// ==========================================
@Composable
fun SmartMenuTopBar(
    currentSession: UserSession?,
    onNavigateHome: () -> Unit,
    onNavigateRestaurants: () -> Unit,
    onNavigateLogin: () -> Unit,
    onNavigateRegister: () -> Unit,
    onLogout: () -> Unit
) {
    Surface(
        color = BgCream,
        shadowElevation = 2.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Image(
                painter = painterResource(id = R.drawable.logo),
                contentDescription = "SmartMenu Logo",
                modifier = Modifier
                    .height(38.dp)
                    .widthIn(max = 155.dp)
                    .clickable { onNavigateHome() },
                contentScale = ContentScale.Fit
            )

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                TextButton(
                    onClick = onNavigateRestaurants,
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "Заклади",
                        color = ForestGreen,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        maxLines = 1
                    )
                }

                if (currentSession == null) {
                    TextButton(
                        onClick = onNavigateLogin,
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "Увійти",
                            color = Color.DarkGray,
                            fontSize = 14.sp,
                            maxLines = 1
                        )
                    }
                    Button(
                        onClick = onNavigateRegister,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFFEAF0EC),
                            contentColor = ForestGreen
                        ),
                        shape = RoundedCornerShape(20.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "Реєстрація",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            softWrap = false
                        )
                    }
                } else {
                    OutlinedButton(
                        onClick = onLogout,
                        border = BorderStroke(1.dp, CardBorderCoral),
                        shape = RoundedCornerShape(20.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "Вийти (${currentSession.firstName})",
                            color = CoralText,
                            fontSize = 12.sp,
                            maxLines = 1,
                            softWrap = false
                        )
                    }
                }
            }
        }
    }
}

// ==========================================
// ГОЛОВНИЙ ЕКРАН (Точно як на вебплатформі)
// ==========================================
@Composable
fun HomeScreen(
    currentSession: UserSession?,
    onOpenRestaurants: () -> Unit,
    onOpenDishDetails: (Int) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgCream)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        if (currentSession != null) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFFEAF4EE)),
                border = BorderStroke(1.dp, ForestGreen),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = "Активна сесія: ${currentSession.firstName} ${currentSession.lastName}",
                        fontWeight = FontWeight.Bold,
                        color = ForestGreen,
                        fontSize = 15.sp
                    )
                    Text("Роль: ${currentSession.role.name}", fontSize = 12.sp, color = Color.DarkGray)
                    Text("JWT: ${currentSession.jwtToken.take(28)}...", fontSize = 11.sp, color = MutedText)
                }
            }
        }

        Text(
            text = "ТВІЙ СМАК — НАШ ОРІЄНТИР",
            fontSize = 12.sp,
            color = MutedText,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 0.8.sp
        )
        Text(
            text = "Знаємо, де\nтобі буде смачно.",
            fontSize = 32.sp,
            fontFamily = FontFamily.Serif,
            fontWeight = FontWeight.Bold,
            color = ForestGreen,
            lineHeight = 38.sp
        )
        Text(
            text = "Улюблені смаки, нові страви та заклади, які варто спробувати. SmartMenu допоможе обрати на основі твоїх уподобань і відгуків людей зі схожим смаком.",
            fontSize = 14.sp,
            color = Color.DarkGray,
            lineHeight = 20.sp
        )

        Button(
            onClick = onOpenRestaurants,
            colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
            shape = RoundedCornerShape(10.dp)
        ) {
            Text("Відкрити смачні місця ↗", modifier = Modifier.padding(vertical = 4.dp, horizontal = 4.dp))
        }

        Text(
            text = "Уже в закладі? Скануй QR-код, щоб одразу відкрити його меню.",
            fontSize = 12.sp,
            color = MutedText
        )

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = "Можливо, твоя нова улюблена",
            fontSize = 14.sp,
            fontFamily = FontFamily.Serif,
            fontWeight = FontWeight.Medium,
            color = MutedText,
            modifier = Modifier.padding(start = 4.dp)
        )

        val featuredDish = MockRepository.dishes.first()
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onOpenDishDetails(featuredDish.id) }
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(featuredDish.restaurantName, color = MutedText, fontSize = 13.sp)
                    Surface(
                        color = Color(0xFFEAF0EC),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            "Салат",
                            color = ForestGreen,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(10.dp))
                AsyncImage(
                    model = featuredDish.imageUrl,
                    contentDescription = featuredDish.name,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(190.dp)
                        .clip(RoundedCornerShape(12.dp)),
                    contentScale = ContentScale.Crop
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = featuredDish.name,
                    fontFamily = FontFamily.Serif,
                    fontWeight = FontWeight.Bold,
                    fontSize = 19.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("${featuredDish.price.toInt()} грн", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text("${featuredDish.weightGrams ?: 0} г", color = MutedText, fontSize = 13.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "СМАЧНО — У КОЖНОГО СВОЄ",
            fontSize = 11.sp,
            color = MutedText,
            fontWeight = FontWeight.SemiBold
        )
        Text(
            text = "Рекомендації починаються з тебе",
            fontSize = 22.sp,
            fontFamily = FontFamily.Serif,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF1C252C)
        )

        InfoStepCard(
            number = "01",
            title = "Поділися своїми смаками",
            description = "Оцінюй страви, щоб SmartMenu краще розумів, що тобі подобається."
        )
        InfoStepCard(
            number = "02",
            title = "Довіряй близьким за смаком",
            description = "Орієнтуйся на відгуки людей зі схожими вподобаннями: їхній досвід допоможе обрати те, що смакуватиме тобі."
        )
        InfoStepCard(
            number = "03",
            title = "Відкривай своє смачне",
            description = "Знайомся зі стравами та закладами, підібраними під твій смак."
        )
    }
}

@Composable
fun InfoStepCard(number: String, title: String, description: String) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(1.dp, Color(0xFFECE8E1)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(text = number, fontSize = 12.sp, color = CoralText, fontWeight = FontWeight.Bold)
            Text(text = title, fontSize = 16.sp, fontFamily = FontFamily.Serif, fontWeight = FontWeight.Bold)
            Text(text = description, fontSize = 13.sp, color = MutedText, lineHeight = 18.sp)
        }
    }
}

// ==========================================
// ОКРЕМИЙ ЕКРАН СПИСКУ ЗАКЛАДІВ
// ==========================================
@Composable
fun RestaurantsListScreen(
    onSelectRestaurant: (Int) -> Unit,
    onViewAllDishes: () -> Unit,
    onNavigateHome: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgCream)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CardPinkBg),
                border = BorderStroke(1.dp, CardBorderCoral),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Surface(
                        color = Color(0xFFFDE8E8),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = "Каталог закладів",
                            color = CoralText,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                    Text(
                        text = "Заклади",
                        fontFamily = FontFamily.Serif,
                        fontWeight = FontWeight.Bold,
                        fontSize = 26.sp
                    )
                    Text(
                        text = "Оберіть ресторан для перегляду його меню, пошуку та фільтрації страв.",
                        fontSize = 13.sp,
                        color = MutedText
                    )
                    OutlinedButton(
                        onClick = onViewAllDishes,
                        border = BorderStroke(1.dp, ForestGreen),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Пошук страв серед усіх закладів", color = ForestGreen, fontSize = 13.sp)
                    }
                }
            }
        }

        items(MockRepository.restaurants) { restaurant ->
            val dishCount = MockRepository.dishes.count { it.restaurantId == restaurant.id }
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, CardBorderCoral.copy(alpha = 0.6f)),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onSelectRestaurant(restaurant.id) }
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = restaurant.name,
                            fontFamily = FontFamily.Serif,
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp,
                            color = ForestGreen
                        )
                        Surface(
                            color = Color(0xFFEAF0EC),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text(
                                text = "$dishCount страв",
                                color = ForestGreen,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            )
                        }
                    }
                    Text(text = restaurant.cuisineType, fontSize = 12.sp, color = CoralText, fontWeight = FontWeight.Medium)
                    Text(text = restaurant.description, fontSize = 13.sp, color = Color.DarkGray)
                    Text(text = "📍 ${restaurant.address}  •  🕒 ${restaurant.openingHours}", fontSize = 12.sp, color = MutedText)
                }
            }
        }

        item {
            OutlinedButton(
                onClick = onNavigateHome,
                border = BorderStroke(1.dp, CardBorderCoral),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text("На головну", color = CoralText)
            }
        }
    }
}

// ==========================================
// ПОШУК ТА ФІЛЬТРАЦІЯ МЕНЮ ЗАКЛАДУ
// ==========================================
@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun MenuSearchScreen(
    restaurantId: Int?,
    currentSession: UserSession?,
    onDishClick: (Int) -> Unit,
    onBackToRestaurants: () -> Unit,
    onNavigateHome: () -> Unit
) {
    val currentRestaurant = remember(restaurantId) {
        MockRepository.restaurants.find { it.id == restaurantId }
    }

    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("Усі") }
    val selectedIngredients = remember { mutableStateListOf<String>() }
    var showIngredientsSection by remember { mutableStateOf(true) }

    val filteredDishes = remember(restaurantId, searchQuery, selectedCategory, selectedIngredients.toList()) {
        MockRepository.dishes.filter { dish ->
            val matchesRestaurant = restaurantId == null || dish.restaurantId == restaurantId
            val notArchived = dish.status != DishStatus.ARCHIVED
            val matchesQuery = searchQuery.isBlank() ||
                    dish.name.contains(searchQuery.trim(), ignoreCase = true)
            val matchesCategory = selectedCategory == "Усі" ||
                    dish.category.equals(selectedCategory, ignoreCase = true)
            val matchesIngredients = selectedIngredients.isEmpty() ||
                    selectedIngredients.all { reqIng ->
                        dish.ingredients.any { it.equals(reqIng, ignoreCase = true) }
                    }
            matchesRestaurant && notArchived && matchesQuery && matchesCategory && matchesIngredients
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgCream)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CardPinkBg),
                border = BorderStroke(1.dp, CardBorderCoral),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = currentRestaurant?.name ?: "Усі заклади",
                        fontFamily = FontFamily.Serif,
                        fontWeight = FontWeight.Bold,
                        fontSize = 24.sp,
                        color = Color(0xFF1C252C)
                    )

                    if (currentRestaurant != null) {
                        Surface(
                            color = Color.White,
                            border = BorderStroke(1.dp, Color(0xFFECE8E1)),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(text = currentRestaurant.description, fontSize = 13.sp, color = Color.DarkGray)
                                Text(text = "Адреса: ${currentRestaurant.address}", fontSize = 12.sp, color = MutedText)
                                Text(text = "Телефон: ${currentRestaurant.phoneNumber} • Графік: ${currentRestaurant.openingHours}", fontSize = 12.sp, color = MutedText)
                            }
                        }
                    }

                    Text(
                        text = "Пошук та фільтрація страв",
                        fontFamily = FontFamily.Serif,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )

                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Введіть назву страви...") },
                        label = { Text("Назва страви") },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = Color.White,
                            unfocusedContainerColor = Color.White
                        )
                    )

                    Text("Категорія:", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        MockRepository.categories.forEach { category ->
                            val isSelected = selectedCategory == category
                            FilterChip(
                                selected = isSelected,
                                onClick = { selectedCategory = category },
                                label = { Text(category, fontSize = 13.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = ForestGreen,
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Інгредієнти (вибрано: ${selectedIngredients.size})",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.weight(1f)
                        )
                        TextButton(
                            onClick = { showIngredientsSection = !showIngredientsSection },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = if (showIngredientsSection) "Згорнути ▲" else "Розгорнути ▼",
                                color = CoralText,
                                fontSize = 13.sp,
                                maxLines = 1,
                                softWrap = false
                            )
                        }
                    }

                    if (showIngredientsSection) {
                        Text(
                            text = "Страва має містити всі вибрані інгредієнти:",
                            fontSize = 12.sp,
                            color = MutedText
                        )
                        Surface(
                            color = Color.White,
                            border = BorderStroke(1.dp, Color(0xFFE0DCD5)),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            FlowRow(
                                modifier = Modifier.padding(10.dp),
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                MockRepository.allIngredients.forEach { ingredient ->
                                    val isChecked = selectedIngredients.contains(ingredient)
                                    FilterChip(
                                        selected = isChecked,
                                        onClick = {
                                            if (isChecked) selectedIngredients.remove(ingredient)
                                            else selectedIngredients.add(ingredient)
                                        },
                                        label = {
                                            Text(
                                                text = if (isChecked) "✓ $ingredient" else ingredient,
                                                fontSize = 12.sp
                                            )
                                        },
                                        colors = FilterChipDefaults.filterChipColors(
                                            selectedContainerColor = Color(0xFFEAF4EE),
                                            selectedLabelColor = ForestGreen
                                        )
                                    )
                                }
                            }
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Знайдено страв: ${filteredDishes.size}",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                        if (searchQuery.isNotBlank() || selectedCategory != "Усі" || selectedIngredients.isNotEmpty()) {
                            OutlinedButton(
                                onClick = {
                                    searchQuery = ""
                                    selectedCategory = "Усі"
                                    selectedIngredients.clear()
                                },
                                border = BorderStroke(1.dp, CardBorderCoral),
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                            ) {
                                Text("Скинути фільтри", color = CoralText, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }

        if (filteredDishes.isEmpty()) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.dp, CardBorderCoral),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "Страв за заданими критеріями не знайдено",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Text(
                            text = "Спробуйте змінити назву або зняти частину вибраних інгредієнтів.",
                            fontSize = 13.sp,
                            color = MutedText
                        )
                        Button(
                            onClick = {
                                searchQuery = ""
                                selectedCategory = "Усі"
                                selectedIngredients.clear()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = ForestGreen)
                        ) {
                            Text("Скинути умови пошуку")
                        }
                    }
                }
            }
        } else {
            items(filteredDishes) { dish ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.dp, CardBorderCoral.copy(alpha = 0.5f)),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onDishClick(dish.id) }
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        AsyncImage(
                            model = dish.imageUrl,
                            contentDescription = dish.name,
                            modifier = Modifier
                                .size(80.dp)
                                .clip(RoundedCornerShape(10.dp)),
                            contentScale = ContentScale.Crop
                        )
                        Column(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(
                                text = dish.name,
                                fontFamily = FontFamily.Serif,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = Color(0xFF1C252C),
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = "${dish.restaurantName} • ${dish.category}",
                                fontSize = 12.sp,
                                color = MutedText
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "${dish.price.toInt()} грн",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = ForestGreen
                                )
                                Surface(
                                    color = if (dish.status == DishStatus.AVAILABLE) Color(0xFFEAF4EE) else Color(0xFFFDE8E8),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text(
                                        text = dish.status.label,
                                        fontSize = 11.sp,
                                        color = if (dish.status == DishStatus.AVAILABLE) ForestGreen else CoralText,
                                        fontWeight = FontWeight.SemiBold,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        if (restaurantId != null) {
            item {
                RestaurantReviewsSection(restaurantId, currentSession)
            }
        }

        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedButton(
                    onClick = onBackToRestaurants,
                    border = BorderStroke(1.dp, CardBorderCoral),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Усі заклади", color = CoralText)
                }
                OutlinedButton(
                    onClick = onNavigateHome,
                    border = BorderStroke(1.dp, CardBorderCoral),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("На головну", color = CoralText)
                }
            }
        }
    }
}

// ==========================================
// ЗАВДАННЯ 3, 4, 5: КАРТКА СТРАВИ ТА ФОРМА ВІДГУКІВ
// ==========================================
// ==========================================
// КАРТКА СТРАВИ ТА ФОРМА ВІДГУКІВ (Зі збереженням у MockRepository)
// ==========================================
@Composable
fun DishDetailsScreen(
    dishId: Int,
    currentSession: UserSession?,
    onBackToRestaurantMenu: (Int) -> Unit,
    onNavigateAllRestaurants: () -> Unit,
    onNavigateHome: () -> Unit
) {
    val dish = MockRepository.dishes.find { it.id == dishId }

    if (dish == null || dish.status == DishStatus.ARCHIVED) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Страва відсутня або архівована в актуальному меню.")
        }
        return
    }

    var dishReviews by remember(dishId, currentSession) {
        mutableStateOf(
            MockRepository.reviews.filter { it.dishId == dishId }.sortedByDescending { it.createdAtTimestamp }
        )
    }

    var userRating by remember { mutableIntStateOf(0) }
    var reviewText by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }
    var networkError by remember { mutableStateOf(false) }
    var editingReviewId by remember { mutableStateOf<Int?>(null) }
    var reviewToDelete by remember { mutableStateOf<ReviewItem?>(null) }
    val coroutineScope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgCream)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = CardPinkBg),
            border = BorderStroke(1.dp, CardBorderCoral),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("${dish.restaurantName} • ${dish.category}", fontSize = 13.sp, color = MutedText, fontWeight = FontWeight.SemiBold)
                    Surface(color = if (dish.status == DishStatus.AVAILABLE) Color(0xFFEAF4EE) else Color(0xFFFDE8E8), shape = RoundedCornerShape(10.dp)) {
                        Text(dish.status.label, fontSize = 12.sp, color = if (dish.status == DishStatus.AVAILABLE) ForestGreen else CoralText, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp))
                    }
                }

                Text(dish.name, fontFamily = FontFamily.Serif, fontWeight = FontWeight.Bold, fontSize = 24.sp, color = Color(0xFF1C252C))

                if (dish.imageUrl != null) {
                    AsyncImage(model = dish.imageUrl, contentDescription = dish.name, modifier = Modifier.fillMaxWidth().height(220.dp).clip(RoundedCornerShape(12.dp)), contentScale = ContentScale.Crop)
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("${dish.price.toInt()} грн", fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = ForestGreen)
                    Surface(color = Color(0xFFFFF8E7), border = BorderStroke(1.dp, StarGold.copy(alpha = 0.5f)), shape = RoundedCornerShape(12.dp)) {
                        Row(modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text("★ ", color = StarGold, fontWeight = FontWeight.Bold)
                            Text("${dish.averageRating} (${dish.ratingsCount} оцінок)", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                if (dish.ingredients.isNotEmpty()) {
                    Text("Інгредієнти: ${dish.ingredients.joinToString(", ")}", fontSize = 14.sp, color = Color.DarkGray)
                }

                Surface(
                    color = Color.White,
                    border = BorderStroke(1.dp, Color(0xFFECE8E1)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(modifier = Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.SpaceEvenly) {
                        dish.weightGrams?.let { NutritionBadge("Вага", "$it г") }
                        dish.calories?.let { NutritionBadge("Калорії", "$it ккал") }
                        dish.proteins?.let { NutritionBadge("Білки", "$it г") }
                        dish.fats?.let { NutritionBadge("Жири", "$it г") }
                        dish.carbohydrates?.let { NutritionBadge("Вуглеводи", "$it г") }
                    }
                }

                Divider(color = CardBorderCoral.copy(alpha = 0.4f))

                Text("Відгуки гостей (${dishReviews.size})", fontFamily = FontFamily.Serif, fontWeight = FontWeight.Bold, fontSize = 20.sp)

                if (currentSession != null) {
                    Card(colors = CardDefaults.cardColors(containerColor = Color.White), border = BorderStroke(1.dp, CardBorderCoral), modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(if (editingReviewId != null) "Редагування відгуку" else "Оцінити та залишити відгук", fontWeight = FontWeight.Bold)

                            Row(modifier = Modifier.padding(vertical = 8.dp)) {
                                (1..5).forEach { star ->
                                    Text(
                                        text = if (star <= userRating) "★" else "☆",
                                        fontSize = 32.sp, color = StarGold,
                                        modifier = Modifier.clickable { userRating = star }.padding(end = 8.dp)
                                    )
                                }
                            }

                            OutlinedTextField(
                                value = reviewText,
                                onValueChange = { reviewText = it; networkError = false },
                                label = { Text("Поділіться враженнями") },
                                modifier = Modifier.fillMaxWidth(),
                                minLines = 2,
                                colors = OutlinedTextFieldDefaults.colors(focusedContainerColor = BgCream, unfocusedContainerColor = BgCream)
                            )

                            if (networkError) {
                                Text("Помилка підключення. Текст збережено.", color = CoralText, fontSize = 12.sp, modifier = Modifier.padding(top = 4.dp))
                            }

                            Row(modifier = Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.End) {
                                if (editingReviewId != null) {
                                    TextButton(onClick = { editingReviewId = null; reviewText = ""; userRating = 0 }) {
                                        Text("Скасувати", color = MutedText)
                                    }
                                }
                                Button(
                                    onClick = {
                                        if (userRating == 0) return@Button
                                        isSubmitting = true
                                        networkError = false
                                        coroutineScope.launch {
                                            delay(1000)
                                            if (Math.random() > 0.2) {
                                                val newRev = ReviewItem(
                                                    id = editingReviewId ?: (1000..9999).random(),
                                                    dishId = dishId,
                                                    authorName = currentSession.firstName,
                                                    rating = userRating,
                                                    text = reviewText,
                                                    tasteMatchScore = 100,
                                                    dateLabel = "Щойно",
                                                    createdAtTimestamp = System.currentTimeMillis()
                                                )
                                                // ЗБЕРІГАЄМО В MockRepository!
                                                MockRepository.saveReview(newRev)

                                                dishReviews = if (editingReviewId != null) {
                                                    dishReviews.map { if (it.id == editingReviewId) newRev else it }
                                                } else {
                                                    listOf(newRev) + dishReviews
                                                }
                                                reviewText = ""; userRating = 0; editingReviewId = null; isSubmitting = false
                                            } else {
                                                networkError = true; isSubmitting = false
                                            }
                                        }
                                    },
                                    enabled = !isSubmitting && userRating > 0,
                                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen)
                                ) {
                                    Text(if (isSubmitting) "Відправка..." else if (editingReviewId != null) "Оновити" else "Відправити")
                                }
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }

                if (dishReviews.isEmpty()) {
                    Text("Для цієї страви ще немає відгуків.", fontSize = 14.sp, color = MutedText)
                } else {
                    dishReviews.forEach { review ->
                        val isAuthor = currentSession != null && review.authorName == currentSession.firstName
                        ReviewCardItem(
                            review = review,
                            isAuthor = isAuthor,
                            onEdit = {
                                editingReviewId = review.id
                                reviewText = review.text
                                userRating = review.rating
                            },
                            onDelete = { reviewToDelete = review }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    OutlinedButton(onClick = { onBackToRestaurantMenu(dish.restaurantId) }, border = BorderStroke(1.dp, CardBorderCoral), shape = RoundedCornerShape(10.dp)) { Text("До закладу", color = CoralText, fontSize = 12.sp) }
                    OutlinedButton(onClick = onNavigateAllRestaurants, border = BorderStroke(1.dp, CardBorderCoral), shape = RoundedCornerShape(10.dp)) { Text("Усі заклади", color = CoralText, fontSize = 12.sp) }
                }
            }
        }
    }

    if (reviewToDelete != null) {
        AlertDialog(
            onDismissRequest = { reviewToDelete = null },
            title = { Text("Видалити відгук?") },
            text = { Text("Ви впевнені? Цю дію неможливо скасувати.") },
            confirmButton = {
                Button(onClick = {
                    // ВИДАЛЯЄМО З MockRepository!
                    MockRepository.deleteReview(reviewToDelete!!.id)

                    dishReviews = dishReviews.filter { it.id != reviewToDelete!!.id }
                    reviewToDelete = null
                }, colors = ButtonDefaults.buttonColors(containerColor = CoralText)) { Text("Видалити") }
            },
            dismissButton = { TextButton(onClick = { reviewToDelete = null }) { Text("Скасувати", color = ForestGreen) } }
        )
    }
}

@Composable
fun NutritionBadge(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = label, fontSize = 11.sp, color = MutedText)
        Text(text = value, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1C252C))
    }
}

@Composable
fun ReviewCardItem(
    review: ReviewItem,
    isAuthor: Boolean,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val initials = review.authorName.split(" ").mapNotNull { it.firstOrNull()?.toString() }.take(2).joinToString("")

    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Color(0xFFECE8E1)),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Box(modifier = Modifier.size(36.dp).clip(CircleShape).background(Color(0xFFEAF0EC)), contentAlignment = Alignment.Center) {
                        Text(initials, color = ForestGreen, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                    Column {
                        Text(review.authorName, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF1C252C))
                        Text(review.dateLabel, fontSize = 11.sp, color = MutedText)
                    }
                }
                Text("★".repeat(review.rating) + "☆".repeat(5 - review.rating), color = StarGold, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            }

            Text(review.text, fontSize = 14.sp, color = Color.DarkGray, lineHeight = 19.sp)

            // Кнопки для автора відгуку
            if (isAuthor) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = onEdit, contentPadding = PaddingValues(0.dp)) { Text("✏️ Редагувати", fontSize = 12.sp, color = ForestGreen) }
                    Spacer(modifier = Modifier.width(8.dp))
                    TextButton(onClick = onDelete, contentPadding = PaddingValues(0.dp)) { Text("🗑 Видалити", fontSize = 12.sp, color = CoralText) }
                }
            }
        }
    }
}

// ==========================================
// РЕЄСТРАЦІЯ ТА ВАЛІДАЦІЯ
// ==========================================
@Composable
fun RegisterScreen(
    onRegisterAttempt: (String, String, String, String) -> Result<Unit>,
    onNavigateToLogin: () -> Unit
) {
    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    var firstNameError by remember { mutableStateOf<String?>(null) }
    var lastNameError by remember { mutableStateOf<String?>(null) }
    var emailError by remember { mutableStateOf<String?>(null) }
    var passwordError by remember { mutableStateOf<String?>(null) }
    var formError by remember { mutableStateOf<String?>(null) }
    var registrationSuccess by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgCream)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = CardPinkBg),
            border = BorderStroke(1.dp, CardBorderCoral),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Реєстрація в SmartMenu",
                    fontFamily = FontFamily.Serif,
                    fontWeight = FontWeight.Bold,
                    fontSize = 24.sp
                )
                Text(
                    text = "Створіть обліковий запис, щоб оцінювати страви та отримувати персональні рекомендації.",
                    fontSize = 13.sp,
                    color = MutedText
                )

                if (registrationSuccess) {
                    Surface(
                        color = Color(0xFFEAF4EE),
                        border = BorderStroke(1.dp, ForestGreen),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                "✅ Обліковий запис успішно створено!",
                                color = ForestGreen,
                                fontWeight = FontWeight.Bold
                            )
                            Text("Тепер ви можете увійти до системи, використовуючи ваш email та пароль.", fontSize = 13.sp)
                            Button(
                                onClick = onNavigateToLogin,
                                colors = ButtonDefaults.buttonColors(containerColor = ForestGreen)
                            ) {
                                Text("Перейти до входу")
                            }
                        }
                    }
                } else {
                    OutlinedTextField(
                        value = firstName,
                        onValueChange = { firstName = it; firstNameError = null },
                        label = { Text("Ім'я *") },
                        isError = firstNameError != null,
                        supportingText = { firstNameError?.let { Text(it, color = MaterialTheme.colorScheme.error) } },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedContainerColor = Color.White, unfocusedContainerColor = Color.White)
                    )

                    OutlinedTextField(
                        value = lastName,
                        onValueChange = { lastName = it; lastNameError = null },
                        label = { Text("Прізвище *") },
                        isError = lastNameError != null,
                        supportingText = { lastNameError?.let { Text(it, color = MaterialTheme.colorScheme.error) } },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedContainerColor = Color.White, unfocusedContainerColor = Color.White)
                    )

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it; emailError = null; formError = null },
                        label = { Text("Електронна пошта *") },
                        isError = emailError != null,
                        supportingText = { emailError?.let { Text(it, color = MaterialTheme.colorScheme.error) } },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedContainerColor = Color.White, unfocusedContainerColor = Color.White)
                    )

                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it; passwordError = null },
                        label = { Text("Пароль (мін. 6 символів) *") },
                        visualTransformation = PasswordVisualTransformation(),
                        isError = passwordError != null,
                        supportingText = { passwordError?.let { Text(it, color = MaterialTheme.colorScheme.error) } },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedContainerColor = Color.White, unfocusedContainerColor = Color.White)
                    )

                    if (formError != null) {
                        Text(text = formError!!, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
                    }

                    Button(
                        onClick = {
                            var valid = true
                            if (firstName.isBlank()) {
                                firstNameError = "Введіть ім'я"
                                valid = false
                            }
                            if (lastName.isBlank()) {
                                lastNameError = "Введіть прізвище"
                                valid = false
                            }
                            if (email.isBlank() || !Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches()) {
                                emailError = "Введіть коректну адресу електронної пошти"
                                valid = false
                            }
                            if (password.length < 6) {
                                passwordError = "Пароль повинен містити щонайменше 6 символів"
                                valid = false
                            }

                            if (valid) {
                                val result = onRegisterAttempt(firstName, lastName, email, password)
                                if (result.isSuccess) {
                                    registrationSuccess = true
                                } else {
                                    formError = result.exceptionOrNull()?.message
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Зареєструватися")
                    }

                    TextButton(
                        onClick = onNavigateToLogin,
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    ) {
                        Text("Вже маєте акаунт? Увійти", color = CoralText)
                    }
                }
            }
        }
    }
}

// ==========================================
// ВХІД ДО СИСТЕМИ ЗА РОЛЯМИ
// ==========================================
@Composable
fun LoginScreen(
    onLoginAttempt: (String, String) -> Result<UserSession>,
    onLoginSuccess: () -> Unit,
    onNavigateToRegister: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgCream)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = CardPinkBg),
            border = BorderStroke(1.dp, CardBorderCoral),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Вхід до системи",
                    fontFamily = FontFamily.Serif,
                    fontWeight = FontWeight.Bold,
                    fontSize = 24.sp
                )

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it; errorMessage = null },
                    label = { Text("Електронна пошта") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedContainerColor = Color.White, unfocusedContainerColor = Color.White)
                )

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it; errorMessage = null },
                    label = { Text("Пароль") },
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedContainerColor = Color.White, unfocusedContainerColor = Color.White)
                )

                if (errorMessage != null) {
                    Text(
                        text = errorMessage!!,
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium
                    )
                }

                Button(
                    onClick = {
                        if (email.isBlank() || password.isBlank()) {
                            errorMessage = "Заповніть електронну пошту та пароль"
                        } else {
                            val res = onLoginAttempt(email, password)
                            if (res.isSuccess) {
                                onLoginSuccess()
                            } else {
                                errorMessage = res.exceptionOrNull()?.message
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Увійти")
                }

                OutlinedButton(
                    onClick = {
                        errorMessage = "Сервіс Google OAuth 2.0 тимчасово недоступний (Заглушка). Будь ласка, увійдіть за паролем."
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Увійти через Google OAuth", color = Color.DarkGray)
                }

                Divider(modifier = Modifier.padding(vertical = 4.dp))

                Text(
                    text = "Швидке заповнення тестових ролей:",
                    fontSize = 12.sp,
                    color = MutedText,
                    fontWeight = FontWeight.Bold
                )
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    AssistChip(
                        onClick = { email = "user@smartmenu.ua"; password = "123456"; errorMessage = null },
                        label = { Text("Користувач", fontSize = 11.sp) }
                    )
                    AssistChip(
                        onClick = { email = "admin@tartufo.ua"; password = "admin123"; errorMessage = null },
                        label = { Text("Адмін закладу", fontSize = 11.sp) }
                    )
                    AssistChip(
                        onClick = { email = "sysadmin@smartmenu.ua"; password = "sys123"; errorMessage = null },
                        label = { Text("Сисадмін", fontSize = 11.sp) }
                    )
                }

                TextButton(
                    onClick = onNavigateToRegister,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                ) {
                    Text("Немає акаунту? Зареєструватися", color = CoralText)
                }
            }
        }
    }
}

// ==========================================
// СЕКЦІЯ ВІДГУКІВ ПРО ЗАКЛАД
// ==========================================
@Composable
fun RestaurantReviewsSection(restaurantId: Int, currentSession: UserSession?) {
    var restReviews by remember(restaurantId, currentSession) {
        mutableStateOf(MockRepository.reviews.filter { it.restaurantId == restaurantId }.sortedByDescending { it.createdAtTimestamp })
    }

    var userRating by remember { mutableIntStateOf(0) }
    var reviewText by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }
    var networkError by remember { mutableStateOf(false) }
    var editingReviewId by remember { mutableStateOf<Int?>(null) }
    var reviewToDelete by remember { mutableStateOf<ReviewItem?>(null) }
    val coroutineScope = rememberCoroutineScope()

    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp)) {
        Divider(color = CardBorderCoral.copy(alpha = 0.4f), modifier = Modifier.padding(bottom = 16.dp))
        Text("Відгуки про заклад (${restReviews.size})", fontFamily = FontFamily.Serif, fontWeight = FontWeight.Bold, fontSize = 20.sp, color = Color(0xFF1C252C))

        if (currentSession != null) {
            Card(colors = CardDefaults.cardColors(containerColor = Color.White), border = BorderStroke(1.dp, CardBorderCoral), modifier = Modifier.fillMaxWidth().padding(top = 12.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(if (editingReviewId != null) "Редагування відгуку" else "Залишити відгук про заклад", fontWeight = FontWeight.Bold)

                    Row(modifier = Modifier.padding(vertical = 8.dp)) {
                        (1..5).forEach { star ->
                            Text(
                                text = if (star <= userRating) "★" else "☆",
                                fontSize = 32.sp, color = StarGold,
                                modifier = Modifier.clickable { userRating = star }.padding(end = 8.dp)
                            )
                        }
                    }

                    OutlinedTextField(
                        value = reviewText,
                        onValueChange = { reviewText = it; networkError = false },
                        label = { Text("Ваші враження від закладу") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                        colors = OutlinedTextFieldDefaults.colors(focusedContainerColor = BgCream, unfocusedContainerColor = BgCream)
                    )

                    if (networkError) {
                        Text("Помилка мережі. Текст збережено.", color = CoralText, fontSize = 12.sp, modifier = Modifier.padding(top = 4.dp))
                    }

                    Row(modifier = Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.End) {
                        if (editingReviewId != null) {
                            TextButton(onClick = { editingReviewId = null; reviewText = ""; userRating = 0 }) { Text("Скасувати", color = MutedText) }
                        }
                        Button(
                            onClick = {
                                if (userRating == 0) return@Button
                                isSubmitting = true
                                networkError = false
                                coroutineScope.launch {
                                    kotlinx.coroutines.delay(1000)
                                    if (Math.random() > 0.2) {
                                        val newRev = ReviewItem(
                                            id = editingReviewId ?: (1000..9999).random(),
                                            dishId = 0, // 0 означає, що це відгук НЕ про страву
                                            restaurantId = restaurantId, // Прив'язка до закладу
                                            authorName = currentSession.firstName,
                                            rating = userRating,
                                            text = reviewText,
                                            tasteMatchScore = 100,
                                            dateLabel = "Щойно",
                                            createdAtTimestamp = System.currentTimeMillis()
                                        )
                                        MockRepository.saveReview(newRev)
                                        restReviews = if (editingReviewId != null) {
                                            restReviews.map { if (it.id == editingReviewId) newRev else it }
                                        } else {
                                            listOf(newRev) + restReviews
                                        }
                                        reviewText = ""; userRating = 0; editingReviewId = null; isSubmitting = false
                                    } else {
                                        networkError = true; isSubmitting = false
                                    }
                                }
                            },
                            enabled = !isSubmitting && userRating > 0,
                            colors = ButtonDefaults.buttonColors(containerColor = ForestGreen)
                        ) {
                            Text(if (isSubmitting) "Відправка..." else if (editingReviewId != null) "Оновити" else "Відправити")
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
        } else {
            Text("Увійдіть у систему, щоб оцінити заклад.", color = MutedText, fontSize = 13.sp, modifier = Modifier.padding(vertical = 8.dp))
        }

        if (restReviews.isEmpty()) {
            Text("Поки що немає відгуків про цей заклад.", fontSize = 14.sp, color = MutedText, modifier = Modifier.padding(top = 8.dp))
        } else {
            restReviews.forEach { review ->
                val isAuthor = currentSession != null && review.authorName == currentSession.firstName
                Box(modifier = Modifier.padding(top = 8.dp)) {
                    ReviewCardItem(
                        review = review,
                        isAuthor = isAuthor,
                        onEdit = { editingReviewId = review.id; reviewText = review.text; userRating = review.rating },
                        onDelete = { reviewToDelete = review }
                    )
                }
            }
        }
    }

    if (reviewToDelete != null) {
        AlertDialog(
            onDismissRequest = { reviewToDelete = null },
            title = { Text("Видалити відгук?") },
            text = { Text("Цю дію неможливо скасувати.") },
            confirmButton = {
                Button(onClick = {
                    MockRepository.deleteReview(reviewToDelete!!.id)
                    restReviews = restReviews.filter { it.id != reviewToDelete!!.id }
                    reviewToDelete = null
                }, colors = ButtonDefaults.buttonColors(containerColor = CoralText)) { Text("Видалити") }
            },
            dismissButton = { TextButton(onClick = { reviewToDelete = null }) { Text("Скасувати", color = ForestGreen) } }
        )
    }
}