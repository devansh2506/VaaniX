package in.satyavoice.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import in.satyavoice.app.ui.screens.*
import in.satyavoice.app.ui.theme.SatyaVoiceTheme
import in.satyavoice.sdk.SatyaVoice

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize SatyaVoice Android SDK singleton
        SatyaVoice.init(
            context = applicationContext,
            apiKey = "satyavoice-dev-android-api-key",
            baseUrl = BuildConfig.API_BASE_URL
        )

        setContent {
            SatyaVoiceTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    SatyaVoiceApp()
                }
            }
        }
    }
}

@Composable
fun SatyaVoiceApp() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "home") {
        composable("home") {
            HomeScreen(
                onNavigateToDemo = { navController.navigate("demo") },
                onNavigateToFamily = { navController.navigate("family") },
                onNavigateToTelegram = { navController.navigate("family") },
                onNavigateToAlertDetail = { alertId -> navController.navigate("alert/$alertId") }
            )
        }
        composable("demo") {
            DemoModeScreen(
                onBack = { navController.popBackStack() }
            )
        }
        composable("family") {
            FamilyGroupScreen(
                onBack = { navController.popBackStack() }
            )
        }
        composable("alert/{alertId}") { backStackEntry ->
            val alertId = backStackEntry.arguments?.getString("alertId") ?: "1"
            AlertDetailScreen(
                alertId = alertId,
                onBack = { navController.popBackStack() }
            )
        }
    }
}
