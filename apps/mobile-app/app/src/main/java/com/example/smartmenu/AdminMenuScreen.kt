package com.example.smartmenu

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// Тимчасові перемикачі для перевірки локальних сценаріїв помилок.
// У звичайному режимі обидва мають залишатися false.
private const val FORCE_AVAILABILITY_ERROR = false
private const val FORCE_DISH_SAVE_ERROR = false


@Composable
fun AdminMenuScreen(restaurantId: Int?, onBack: () -> Unit) {
    var selectedTabIndex by remember { mutableIntStateOf(0) }

    Column(modifier = Modifier.fillMaxSize().background(BgCream)) {
        // Шапка адміністратора
        Surface(color = ForestGreen, modifier = Modifier.fillMaxWidth()) {
            Row(modifier = Modifier.padding(16.dp).statusBarsPadding(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Панель керування меню", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                TextButton(onClick = onBack) { Text("Вийти", color = Color.White) }
            }
        }

        TabRow(selectedTabIndex = selectedTabIndex, containerColor = Color.White, contentColor = ForestGreen) {
            Tab(selected = selectedTabIndex == 0, onClick = { selectedTabIndex = 0 }, text = { Text("Категорії") })
            Tab(selected = selectedTabIndex == 1, onClick = { selectedTabIndex = 1 }, text = { Text("Страви") })
        }

        when (selectedTabIndex) {
            0 -> CategoriesManager()
            1 -> DishesManager(restaurantId)
        }
    }
}

// =====================================
// ЗАВДАННЯ 1: Керування категоріями
// =====================================
// =====================================
// ЗАВДАННЯ 1: Керування категоріями (з порядком та видаленням)
// =====================================
// =====================================
// ЗАВДАННЯ 1: Керування категоріями (Оновлений дизайн, без залежності від Icons)
// =====================================
@Composable
fun CategoriesManager() {
    var newCategoryName by remember { mutableStateOf("") }
    var categoryToDelete by remember { mutableStateOf<String?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    var categoriesList by remember { mutableStateOf(MockRepository.categories.filter { it != "Усі" }) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Охайний блок додавання
        Surface(
            color = Color.White,
            shape = RoundedCornerShape(12.dp),
            shadowElevation = 2.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(text = "Додати нову категорію", fontWeight = FontWeight.Bold, color = ForestGreen, fontSize = 16.sp)

                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = newCategoryName,
                        onValueChange = { newCategoryName = it; errorMessage = null },
                        placeholder = { Text("Назва категорії", fontSize = 14.sp) },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        shape = RoundedCornerShape(8.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = ForestGreen,
                            unfocusedBorderColor = Color.LightGray,
                            focusedContainerColor = Color.White,
                            unfocusedContainerColor = Color.White
                        )
                    )

                    Button(
                        onClick = {
                            if (newCategoryName.isBlank()) {
                                errorMessage = "Введіть назву"
                            } else if (categoriesList.contains(newCategoryName.trim())) {
                                errorMessage = "Вже існує"
                            } else {
                                MockRepository.addCategory(newCategoryName.trim())
                                categoriesList = MockRepository.categories.filter { it != "Усі" }
                                newCategoryName = ""
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp)
                    ) {
                        Text("➕", color = Color.White, fontSize = 16.sp)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Додати", fontWeight = FontWeight.Bold)
                    }
                }

                if (errorMessage != null) {
                    Text(text = errorMessage!!, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
                }
            }
        }

        // Охайний список
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(bottom = 80.dp)
        ) {
            itemsIndexed(categoriesList) { index, category ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(10.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = category,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFF1C252C),
                            modifier = Modifier.weight(1f)
                        )

                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            // Кнопка вгору
                            IconButton(
                                onClick = {
                                    val mutList = categoriesList.toMutableList()
                                    val temp = mutList[index]
                                    mutList[index] = mutList[index - 1]
                                    mutList[index - 1] = temp
                                    categoriesList = mutList
                                },
                                enabled = index > 0,
                                modifier = Modifier.size(36.dp)
                            ) {
                                Text("⬆️", color = if (index > 0) ForestGreen else Color.Transparent, fontSize = 16.sp)
                            }

                            // Кнопка вниз
                            IconButton(
                                onClick = {
                                    val mutList = categoriesList.toMutableList()
                                    val temp = mutList[index]
                                    mutList[index] = mutList[index + 1]
                                    mutList[index + 1] = temp
                                    categoriesList = mutList
                                },
                                enabled = index < categoriesList.size - 1,
                                modifier = Modifier.size(36.dp)
                            ) {
                                Text("⬇️", color = if (index < categoriesList.size - 1) ForestGreen else Color.Transparent, fontSize = 16.sp)
                            }

                            // Вертикальний розділювач
                            HorizontalDivider(modifier = Modifier.height(24.dp).width(1.dp), color = Color.LightGray)

                            // Кнопка видалення
                            IconButton(
                                onClick = { categoryToDelete = category },
                                modifier = Modifier.size(36.dp)
                            ) {
                                Text("🗑", color = CoralText, fontSize = 16.sp)
                            }
                        }
                    }
                }
            }
        }
    }

    if (categoryToDelete != null) {
        AlertDialog(
            onDismissRequest = { categoryToDelete = null },
            title = { Text("Видалити категорію?", fontWeight = FontWeight.Bold) },
            text = { Text("Ви дійсно хочете видалити категорію '$categoryToDelete'?\nУвага: Страви у цій категорії залишаться без категорії.") },
            confirmButton = {
                Button(
                    onClick = {
                        MockRepository.removeCategory(categoryToDelete!!)
                        categoriesList = MockRepository.categories.filter { it != "Усі" }
                        categoryToDelete = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CoralText)
                ) {
                    Text("Видалити")
                }
            },
            dismissButton = {
                TextButton(onClick = { categoryToDelete = null }) {
                    Text("Скасувати", color = ForestGreen)
                }
            },
            containerColor = Color.White
        )
    }
}

// =====================================
// ЗАВДАННЯ 2: Керування стравами (Додавання/Редагування)
// =====================================
@Composable
fun DishesManager(restaurantId: Int?) {
    var dishToEdit by remember { mutableStateOf<DishItem?>(null) }
    var isAddingNew by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()
    var pendingDishId by remember(restaurantId) { mutableStateOf<Int?>(null) }
    val availabilityErrors = remember(restaurantId) { mutableStateMapOf<Int, String>() }
    val dishes = MockRepository.dishes.filter { restaurantId == null || it.restaurantId == restaurantId }

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            contentPadding = PaddingValues(start = 16.dp, top = 16.dp, end = 16.dp, bottom = 88.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(dishes, key = { it.id }) { dish ->
                val isUpdating = pendingDishId == dish.id
                Card(colors = CardDefaults.cardColors(containerColor = Color.White), border = BorderStroke(1.dp, CardBorderCoral)) {
                    Column(modifier = Modifier.fillMaxWidth().padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(dish.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Text("${dish.price} грн • ${dish.category}", fontSize = 13.sp, color = MutedText)
                                Text("Статус: ${dish.status.label}", fontSize = 12.sp, color = if (dish.status == DishStatus.AVAILABLE) ForestGreen else CoralText)
                            }
                            Switch(
                                checked = dish.status == DishStatus.AVAILABLE,
                                enabled = pendingDishId == null && restaurantId != null &&
                                        dish.restaurantId == restaurantId && dish.status != DishStatus.ARCHIVED,
                                onCheckedChange = { isAvailable ->
                                    if (pendingDishId == null && restaurantId != null &&
                                        dish.restaurantId == restaurantId && dish.status != DishStatus.ARCHIVED) {
                                        pendingDishId = dish.id
                                        availabilityErrors.remove(dish.id)
                                        coroutineScope.launch {
                                            try {
                                                delay(800) // Імітація запиту, без реального API.
                                                if (FORCE_AVAILABILITY_ERROR) {
                                                    availabilityErrors[dish.id] = "Не вдалося змінити доступність страви. Спробуйте ще раз."
                                                } else {
                                                    val currentDish = MockRepository.dishes.find {
                                                        it.id == dish.id && it.restaurantId == restaurantId
                                                    }
                                                    if (currentDish == null || currentDish.status == DishStatus.ARCHIVED) {
                                                        availabilityErrors[dish.id] = "Страва недоступна для зміни статусу."
                                                    } else {
                                                        // Оновлюємо лише статус і тільки після успіху.
                                                        MockRepository.saveDish(currentDish.copy(
                                                            status = if (isAvailable) DishStatus.AVAILABLE else DishStatus.UNAVAILABLE
                                                        ))
                                                    }
                                                }
                                            } catch (cancelled: kotlinx.coroutines.CancellationException) {
                                                throw cancelled
                                            } catch (error: Exception) {
                                                availabilityErrors[dish.id] = "Не вдалося змінити доступність страви. Спробуйте ще раз."
                                            } finally {
                                                pendingDishId = null
                                            }
                                        }
                                    }
                                },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Color.White,
                                    checkedTrackColor = ForestGreen
                                ),
                                modifier = Modifier.semantics {
                                    contentDescription = "Доступність страви ${dish.name}"
                                }
                            )
                            IconButton(onClick = { dishToEdit = dish }, enabled = pendingDishId == null) {
                                Text("✏️")
                            }
                        }
                        if (isUpdating) {
                            Row(
                                modifier = Modifier.padding(top = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = ForestGreen, strokeWidth = 2.dp)
                                Text("Оновлення доступності...", fontSize = 12.sp, color = MutedText)
                            }
                        }
                        availabilityErrors[dish.id]?.let { message ->
                            Text(message, modifier = Modifier.padding(top = 8.dp), fontSize = 12.sp, color = MaterialTheme.colorScheme.error)
                        }
                    }
                }
            }
        }

        FloatingActionButton(
            onClick = { isAddingNew = true },
            containerColor = ForestGreen,
            modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp)
        ) { Text("➕", color = Color.White) }
    }

    if (isAddingNew || dishToEdit != null) {
        DishFormModal(
            restaurantId = restaurantId ?: 1,
            initialDish = dishToEdit,
            onDismiss = { isAddingNew = false; dishToEdit = null },
            onSave = { savedDish ->
                MockRepository.saveDish(savedDish)
                isAddingNew = false
                dishToEdit = null
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DishFormModal(restaurantId: Int, initialDish: DishItem?, onDismiss: () -> Unit, onSave: (DishItem) -> Unit) {
    val coroutineScope = rememberCoroutineScope()
    var name by remember { mutableStateOf(initialDish?.name ?: "") }
    var priceStr by remember { mutableStateOf(initialDish?.price?.toString() ?: "") }
    var category by remember { mutableStateOf(initialDish?.category ?: MockRepository.categories.filter { it != "Усі" }.firstOrNull() ?: "") }
    var imageUrl by remember { mutableStateOf(initialDish?.imageUrl ?: "") }

    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    ModalBottomSheet(onDismissRequest = { if (!isLoading) onDismiss() }) {
        Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 10.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Text(if (initialDish == null) "Нова страва" else "Редагування", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = ForestGreen)

            OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Назва *") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = priceStr, onValueChange = { priceStr = it }, label = { Text("Ціна (грн) *") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = imageUrl, onValueChange = { imageUrl = it }, label = { Text("URL фотографії") }, modifier = Modifier.fillMaxWidth())

            Text("Категорія *:", fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            Row(modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                MockRepository.categories.filter { it != "Усі" }.forEach { cat ->
                    FilterChip(
                        selected = category == cat, onClick = { category = cat },
                        label = { Text(cat) }, colors = FilterChipDefaults.filterChipColors(selectedContainerColor = ForestGreen, selectedLabelColor = Color.White)
                    )
                }
            }

            if (errorMessage != null) {
                Text(errorMessage!!, color = MaterialTheme.colorScheme.error, fontSize = 14.sp, fontWeight = FontWeight.Medium)
            }

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                OutlinedButton(onClick = onDismiss, modifier = Modifier.weight(1f), enabled = !isLoading) { Text("Скасувати", color = CoralText) }
                Button(
                    onClick = {
                        if (name.isBlank() || priceStr.toDoubleOrNull() == null || category.isBlank()) {
                            errorMessage = "Заповніть коректно всі обов'язкові поля"
                            return@Button
                        }
                        isLoading = true
                        errorMessage = null
                        coroutineScope.launch {
                            delay(1200) // Імітація запиту до сервера
                            if (FORCE_DISH_SAVE_ERROR) {
                                // Дані у формі зберігаються, користувач може спробувати знову
                                errorMessage = "Не вдалося зберегти страву. Спробуйте ще раз."
                                isLoading = false
                            } else {
                                val newDish = initialDish?.copy(name = name.trim(), price = priceStr.toDouble(), category = category, imageUrl = imageUrl.takeIf { it.isNotBlank() })
                                    ?: DishItem(
                                        id = (MockRepository.dishes.maxOfOrNull { it.id } ?: 0) + 1,
                                        restaurantId = restaurantId, restaurantName = MockRepository.restaurants.find { it.id == restaurantId }?.name ?: "Заклад",
                                        name = name.trim(), category = category, price = priceStr.toDouble(),
                                        status = DishStatus.AVAILABLE, imageUrl = imageUrl.takeIf { it.isNotBlank() }, ingredients = emptyList(),
                                        weightGrams = null, calories = null, proteins = null, fats = null, carbohydrates = null, averageRating = 0.0, ratingsCount = 0
                                    )
                                onSave(newDish)
                            }
                        }
                    },
                    modifier = Modifier.weight(1f),
                    enabled = !isLoading,
                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen)
                ) {
                    Text(if (isLoading) "Збереження..." else "Зберегти")
                }
            }
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}
