package com.example.smartmenu

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.example.smartmenu.*
import com.example.smartmenu.ui.theme.SmartMenuTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val sessionManager = SessionManager(applicationContext)

        setContent {
            SmartMenuTheme {
                var currentSession by remember { mutableStateOf(sessionManager.getActiveSession()) }
                var currentScreen by remember { mutableStateOf("home") }
                var selectedRestaurantId by remember { mutableStateOf<Int?>(null) }
                var selectedDishId by remember { mutableIntStateOf(1) }

                Column(modifier = Modifier.fillMaxSize()) {
                    SmartMenuTopBar(
                        currentSession = currentSession,
                        onNavigateHome = { currentScreen = "home" },
                        onNavigateRestaurants = { currentScreen = "restaurants" },
                        onNavigateLogin = { currentScreen = "login" },
                        onNavigateRegister = { currentScreen = "register" },
                        onLogout = {
                            sessionManager.clearSession()
                            currentSession = null
                            currentScreen = "home"
                        }
                    )

                    if (currentSession?.email == "admin@tartufo.ua" && currentScreen != "admin_menu") {
                        Button(
                            onClick = { currentScreen = "admin_menu" },
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E4631)) // ForestGreen
                        ) {
                            Text("⚙️ Відкрити панель керування закладом", color = Color.White)
                        }
                    }

                    when (currentScreen) {
                        "home" -> HomeScreen(
                            currentSession = currentSession,
                            onOpenRestaurants = { currentScreen = "restaurants" },
                            onOpenDishDetails = { dishId ->
                                selectedDishId = dishId
                                currentScreen = "dish_details"
                            }
                        )
                        "restaurants" -> RestaurantsListScreen(
                            onSelectRestaurant = { restId ->
                                selectedRestaurantId = restId
                                currentScreen = "menu"
                            },
                            onViewAllDishes = {
                                selectedRestaurantId = null
                                currentScreen = "menu"
                            },
                            onNavigateHome = { currentScreen = "home" }
                        )
                        "menu" -> MenuSearchScreen(
                            restaurantId = selectedRestaurantId,
                            currentSession = currentSession,
                            onDishClick = { dishId ->
                                selectedDishId = dishId
                                currentScreen = "dish_details"
                            },
                            onBackToRestaurants = { currentScreen = "restaurants" },
                            onNavigateHome = { currentScreen = "home" }
                        )
                        "dish_details" -> DishDetailsScreen(
                            dishId = selectedDishId,
                            currentSession = currentSession,
                            onBackToRestaurantMenu = { restId ->
                                selectedRestaurantId = restId
                                currentScreen = "menu"
                            },
                            onNavigateAllRestaurants = { currentScreen = "restaurants" },
                            onNavigateHome = { currentScreen = "home" }
                        )
                        "admin_menu" -> AdminMenuScreen(restaurantId = 1, onBack = { currentScreen = "home" })
                        "register" -> RegisterScreen(
                            onRegisterAttempt = { fName, lName, email, pass ->
                                sessionManager.registerNewUser(fName, lName, email, pass)
                            },
                            onNavigateToLogin = { currentScreen = "login" }
                        )
                        "login" -> LoginScreen(
                            onLoginAttempt = { email, pass ->
                                val res = sessionManager.authenticate(email, pass)
                                if (res.isSuccess) {
                                    currentSession = res.getOrNull()
                                }
                                res
                            },
                            onLoginSuccess = { currentScreen = "home" },
                            onNavigateToRegister = { currentScreen = "register" }
                        )
                    }
                }
            }
        }
    }
}