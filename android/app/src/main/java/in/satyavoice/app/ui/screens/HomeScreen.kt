package in.satyavoice.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import in.satyavoice.app.ui.theme.*

data class CallHistoryItem(
    val id: String,
    val callerNumber: String,
    val claimedName: String,
    val verdict: String, // "AI_CLONE" | "REAL"
    val riskScore: Int,
    val time: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onNavigateToDemo: () -> Unit,
    onNavigateToFamily: () -> Unit,
    onNavigateToTelegram: () -> Unit,
    onNavigateToAlertDetail: (String) -> Unit
) {
    var liveCheckEnabled by remember { mutableStateOf(true) }
    var radarEnabled by remember { mutableStateOf(true) }
    var paymentGuardEnabled by remember { mutableStateOf(true) }

    val recentCalls = remember {
        listOf(
            CallHistoryItem("1", "+91 98765 43210", "Rahul (Son)", "AI_CLONE", 87, "10 mins ago"),
            CallHistoryItem("2", "+91 98111 22334", "Priya (Daughter)", "REAL", 12, "Yesterday"),
            CallHistoryItem("3", "+91 90123 45678", "Bank Officer", "AI_CLONE", 92, "2 days ago")
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("SatyaVoice", fontWeight = FontWeight.Bold, color = NavyPrimary) },
                actions = {
                    IconButton(onClick = onNavigateToDemo) {
                        Icon(Icons.Default.PlayCircle, contentDescription = "Demo Mode", tint = TealAccent)
                    }
                    IconButton(onClick = onNavigateToFamily) {
                        Icon(Icons.Default.Group, contentDescription = "Family Group", tint = NavyPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceWhite)
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(LightBackground)
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Status Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = NavyPrimary),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(12.dp)
                                    .clip(CircleShape)
                                    .background(SafeGreen)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                "ACTIVE PROTECTION",
                                color = Color.White.copy(alpha = 0.8f),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            "SatyaVoice is protecting your calls",
                            color = Color.White,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            "Scanning caller reputation, verifying seconds 5–15, and guarding UPI payments.",
                            color = Color.White.copy(alpha = 0.85f),
                            fontSize = 13.5.sp
                        )
                    }
                }
            }

            // Quick Actions: Demo & Family
            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Button(
                        onClick = onNavigateToDemo,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = DangerRed),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.Warning, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Simulate Call")
                    }
                    OutlinedButton(
                        onClick = onNavigateToTelegram,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(18.dp), tint = TealAccent)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Telegram", color = NavyPrimary)
                    }
                }
            }

            // Protection Modules Toggles
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Protection Features", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = NavyPrimary)
                        
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text("Live 10-Second Voice Check", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                                Text("Scans seconds 5–15 using Nes2Net-X", fontSize = 12.sp, color = TextMuted)
                            }
                            Switch(checked = liveCheckEnabled, onCheckedChange = { liveCheckEnabled = it })
                        }
                        Divider()
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text("Scam Radar Pop-up", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                                Text("Ringing warning if flagged by 3+ users", fontSize = 12.sp, color = TextMuted)
                            }
                            Switch(checked = radarEnabled, onCheckedChange = { radarEnabled = it })
                        }
                        Divider()
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text("30-Minute Payment Guard", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                                Text("Pauses UPI & bank apps after scam calls", fontSize = 12.sp, color = TextMuted)
                            }
                            Switch(checked = paymentGuardEnabled, onCheckedChange = { paymentGuardEnabled = it })
                        }
                    }
                }
            }

            // Recent Calls Section
            item {
                Text("Recently Screened Calls", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = NavyPrimary)
            }

            items(recentCalls) { call ->
                Card(
                    onClick = { onNavigateToAlertDetail(call.id) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(call.claimedName, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Text(call.callerNumber, fontSize = 13.sp, color = TextMuted)
                            Text(call.time, fontSize = 11.sp, color = TextMuted)
                        }

                        if (call.verdict == "AI_CLONE") {
                            Surface(
                                color = DangerRed.copy(alpha = 0.12f),
                                shape = RoundedCornerShape(20.dp)
                            ) {
                                Text(
                                    "AI CLONE (${call.riskScore})",
                                    color = DangerRed,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                )
                            }
                        } else {
                            Surface(
                                color = SafeGreen.copy(alpha = 0.12f),
                                shape = RoundedCornerShape(20.dp)
                            ) {
                                Text(
                                    "GENUINE",
                                    color = SafeGreen,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
