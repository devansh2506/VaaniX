package in.satyavoice.app.ui.screens

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import in.satyavoice.app.services.PaymentGuardService
import in.satyavoice.app.ui.overlay.PaymentGuardOverlay
import in.satyavoice.app.ui.overlay.WarningOverlay
import in.satyavoice.app.ui.theme.*
import in.satyavoice.sdk.SatyaVoice
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DemoModeScreen(
    onBack: () -> Unit
) {
    val context = LocalContext.current
    var selectedClip by remember { mutableStateOf("cloned_rahul") }
    var callerNumber by remember { mutableStateOf("+91 98765 43210") }
    var callerName by remember { mutableStateOf("Rahul (Son)") }
    var isSimulating by remember { mutableStateOf(false) }
    var simulationStep by remember { mutableStateOf("") }
    var lastAnalysisResult by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Simulate Scam Call (Demo)", fontWeight = FontWeight.Bold, color = NavyPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = NavyPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceWhite)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(LightBackground)
                .padding(padding)
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("1. Select Test Voice Sample", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = NavyPrimary)

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(
                            selected = selectedClip == "cloned_rahul",
                            onClick = {
                                selectedClip = "cloned_rahul"
                                callerName = "Rahul (Son)"
                            }
                        )
                        Column {
                            Text("AI Cloned Voice — Rahul (Son)", fontWeight = FontWeight.SemiBold)
                            Text("\"Mummy main Rahul बोल रहा हूँ... accident हो गया... UPI कर दो\"", fontSize = 12.sp, color = TextMuted)
                        }
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(
                            selected = selectedClip == "bank_kyc_scam",
                            onClick = {
                                selectedClip = "bank_kyc_scam"
                                callerName = "Bank Officer"
                            }
                        )
                        Column {
                            Text("Digital Arrest / Bank KYC Scam", fontWeight = FontWeight.SemiBold)
                            Text("\"CBI police officer... digital arrest warrant... OTP batao\"", fontSize = 12.sp, color = TextMuted)
                        }
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(
                            selected = selectedClip == "real_rahul",
                            onClick = {
                                selectedClip = "real_rahul"
                                callerName = "Rahul (Son)"
                            }
                        )
                        Column {
                            Text("Genuine Voice — Rahul (Real Voice)", fontWeight = FontWeight.SemiBold)
                            Text("\"Hey mom, I reached the office safely. Dinner at 8.\"", fontSize = 12.sp, color = TextMuted)
                        }
                    }
                }
            }

            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("2. Caller Number", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = NavyPrimary)
                    OutlinedTextField(
                        value = callerNumber,
                        onValueChange = { callerNumber = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Caller Phone") }
                    )
                }
            }

            Button(
                onClick = {
                    isSimulating = true
                    simulationStep = "Querying Scam Radar..."
                    CoroutineScope(Dispatchers.Main).launch {
                        delay(1200)
                        simulationStep = "Phone Ringing: Potential Scam Flagged!"
                        delay(2000)
                        simulationStep = "Call Connected: Waiting 5s buffer..."
                        delay(2500)
                        simulationStep = "Recording seconds 5–15 of call audio..."
                        delay(3000)
                        simulationStep = "Running Nes2Net-X & STT claim extraction..."

                        val isClone = selectedClip != "real_rahul"
                        val risk = if (isClone) 87 else 12

                        delay(2000)
                        isSimulating = false
                        lastAnalysisResult = if (isClone) "🚨 AI_CLONE DETECTED (Risk: $risk/100)" else "✅ REAL VOICE (Risk: $risk/100)"

                        if (isClone) {
                            // Launch In-Call Red Warning Overlay
                            WarningOverlay.showWarning(
                                context = context,
                                riskScore = risk,
                                claimedIdentity = callerName,
                                advice = "Hang up immediately and call Rahul on his real number.",
                                alertId = "demo-alert-id",
                                scamWords = listOf("accident", "upi", "jaldi", "kisi ko mat batana")
                            )

                            // Arm Payment Guard
                            SatyaVoice.markScamCallDetected()
                            val guardIntent = Intent(context, PaymentGuardService::class.java).apply {
                                putExtra("CALLER_NUMBER", callerNumber)
                                putExtra("CLAIMED_TEXT", callerName)
                                putExtra("ALERT_ID", "demo-alert-id")
                            }
                            context.startService(guardIntent)
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                colors = ButtonDefaults.buttonColors(containerColor = DangerRed),
                shape = RoundedCornerShape(10.dp),
                enabled = !isSimulating
            ) {
                if (isSimulating) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(22.dp))
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(simulationStep, fontSize = 13.5.sp)
                } else {
                    Icon(Icons.Default.PhoneInTalk, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Start Live Call Simulation", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                }
            }

            if (lastAnalysisResult != null) {
                Text(
                    text = lastAnalysisResult ?: "",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = if (lastAnalysisResult?.contains("AI_CLONE") == true) DangerRed else SafeGreen
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Step 3: Test Payment Guard
            Card(
                colors = CardDefaults.cardColors(containerColor = NavyPrimary.copy(alpha = 0.06f)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("3. Test Payment Guard Protection", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = NavyPrimary)
                    Text("Tests the 30-minute post-scam cooldown intervention that intercepts UPI & banking apps.", fontSize = 12.5.sp, color = TextMuted)
                    Button(
                        onClick = {
                            PaymentGuardOverlay.show(
                                context = context,
                                packageName = "com.google.android.apps.nbu.paisa.user",
                                callerNumber = callerNumber,
                                claimedText = callerName,
                                alertId = "demo-alert-id",
                                onDismissed = {}
                            )
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = TealAccent),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Simulate Opening Google Pay")
                    }
                }
            }
        }
    }
}
