package in.satyavoice.app.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import in.satyavoice.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AlertDetailScreen(
    alertId: String,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    var isGenuineDismissed by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Call Forensics & Report", fontWeight = FontWeight.Bold, color = NavyPrimary) },
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
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Risk Card
            Card(
                colors = CardDefaults.cardColors(containerColor = DangerRed),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text("RISK ASSESSMENT", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White.copy(alpha = 0.8f))
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("AI-Cloned Voice (87 / 100)", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("Caller claimed to be Rahul (Son) · Origin: +91 98765 43210", color = Color.White.copy(alpha = 0.9f), fontSize = 13.sp)
                }
            }

            // Transcript Card
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Audio Transcript (Seconds 5–15)", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = NavyPrimary)
                    Text(
                        "\"Mummy, main Rahul बोल रहा हूँ. Mera accident ho gaya hai police ne pakad liya hai. Jaldi 50,000 rupaye is UPI pe bhejo. Papa ko mat batana.\"",
                        fontSize = 14.sp,
                        color = NavyPrimary,
                        lineHeight = 22.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Scam keywords: accident, upi, jaldi, kisi ko mat batana", fontSize = 12.sp, color = DangerRed, fontWeight = FontWeight.SemiBold)
                }
            }

            // Evidence Hash
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Forensic Cryptographic Evidence", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = NavyPrimary)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("SHA-256 Digest:", fontSize = 12.sp, color = TextMuted)
                    Text("9f2c7a3b4e18d6f5c2a1e9b8d7f4a2c1e8b7d6f5a3c2e1b9d8f7a6c5e4b3a210", fontSize = 11.sp, fontWeight = FontWeight.Medium, color = NavyPrimary)
                }
            }

            // One-Tap Reporting Action Buttons
            Text("One-Tap Actions", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = NavyPrimary)

            Button(
                onClick = {
                    val emailIntent = Intent(Intent.ACTION_SENDTO).apply {
                        data = Uri.parse("mailto:")
                        putExtra(Intent.EXTRA_SUBJECT, "Complaint: AI voice-clone fraud call from +91 98765 43210")
                        putExtra(
                            Intent.EXTRA_TEXT,
                            "Respected Cyber Cell,\n\nI am reporting an AI voice cloning impersonation call targeting my family.\n\nDate: 18 Oct 2026\nCaller: +91 98765 43210\nClaimed: Rahul (Son)\nSatyaVoice AI Risk: 87/100 (Critical)\nEvidence SHA-256: 9f2c7a3b4e18d6f5c2a1e9b8d7f4a2c1e8b7d6f5a3c2e1b9d8f7a6c5e4b3a210"
                        )
                    }
                    context.startActivity(Intent.createChooser(emailIntent, "Send Cyber Crime Report"))
                },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = DangerRed),
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(Icons.Default.Security, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("🚨 Report to State Cyber Crime Cell")
            }

            Button(
                onClick = {
                    val emailIntent = Intent(Intent.ACTION_SENDTO).apply {
                        data = Uri.parse("mailto:")
                        putExtra(Intent.EXTRA_SUBJECT, "Urgent Fraud Alert: AI Impersonation Attempt on Account")
                        putExtra(
                            Intent.EXTRA_TEXT,
                            "To Bank Fraud Desk,\n\nPlease place a security hold on suspicious outgoing UPI transfers initiated under duress from an AI voice cloning attack.\n\nTime: 18 Oct 2026\nSatyaVoice Alert ID: $alertId"
                        )
                    }
                    context.startActivity(Intent.createChooser(emailIntent, "Send Bank Report"))
                },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = TealAccent),
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(Icons.Default.AccountBalance, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("🏦 Report & Freeze at Bank")
            }

            OutlinedButton(
                onClick = {
                    val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:1930"))
                    context.startActivity(dialIntent)
                },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(Icons.Default.Call, contentDescription = null, tint = NavyPrimary)
                Spacer(modifier = Modifier.width(8.dp))
                Text("📞 Call National 1930 Helpline", color = NavyPrimary)
            }

            TextButton(
                onClick = {
                    isGenuineDismissed = true
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    if (isGenuineDismissed) "✅ Feedback Received: Marked Genuine" else "This is genuine (False Alarm)",
                    color = if (isGenuineDismissed) SafeGreen else TextMuted
                )
            }
        }
    }
}
