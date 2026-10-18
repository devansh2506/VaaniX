package in.satyavoice.app.ui.screens

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import in.satyavoice.app.ui.theme.*

data class FamilyMemberUi(
    val id: String,
    val name: String,
    val relationship: String,
    val phone: String,
    val telegramJoined: Boolean,
    val inviteLink: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FamilyGroupScreen(
    onBack: () -> Unit
) {
    val context = LocalContext.current
    var showAddDialog by remember { mutableStateOf(false) }

    var members by remember {
        mutableStateOf(
            listOf(
                FamilyMemberUi("1", "Rahul", "Son", "+91 98111 22334", true, "https://t.me/Prevent_Scambot?start=m_1"),
                FamilyMemberUi("2", "Priya", "Daughter", "+91 98222 33445", false, "https://t.me/Prevent_Scambot?start=m_2"),
                FamilyMemberUi("3", "Suresh", "Husband", "+91 98333 44556", true, "https://t.me/Prevent_Scambot?start=m_3")
            )
        )
    }

    var newName by remember { mutableStateOf("") }
    var newPhone by remember { mutableStateOf("") }
    var newRel by remember { mutableStateOf("Son") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Family Protection Group", fontWeight = FontWeight.Bold, color = NavyPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = NavyPrimary)
                    }
                },
                actions = {
                    IconButton(onClick = { showAddDialog = true }) {
                        Icon(Icons.Default.Add, contentDescription = "Add Member", tint = TealAccent)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceWhite)
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = TealAccent,
                contentColor = SurfaceWhite
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Member")
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(LightBackground)
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = NavyPrimary.copy(alpha = 0.05f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Protect Family from Cloned Voice Scams",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = NavyPrimary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            "When an attacker attempts to impersonate your family members, SatyaVoice notifies them instantly via Telegram to verify identity.",
                            fontSize = 13.sp,
                            color = TextMuted
                        )
                    }
                }
            }

            items(members) { member ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(member.name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Surface(
                                    color = NavyPrimary.copy(alpha = 0.1f),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text(
                                        member.relationship,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = NavyPrimary,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(member.phone, fontSize = 13.sp, color = TextMuted)
                        }

                        if (member.telegramJoined) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = SafeGreen, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Protected", color = SafeGreen, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        } else {
                            OutlinedButton(
                                onClick = {
                                    val sendIntent = Intent(Intent.ACTION_SEND).apply {
                                        type = "text/plain"
                                        putExtra(
                                            Intent.EXTRA_TEXT,
                                            "Join my SatyaVoice Family Protection group to protect our calls from AI voice cloning: ${member.inviteLink}"
                                        )
                                    }
                                    context.startActivity(Intent.createChooser(sendIntent, "Invite via"))
                                },
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text("Invite", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }

        if (showAddDialog) {
            AlertDialog(
                onDismissRequest = { showAddDialog = false },
                title = { Text("Add Family Member", fontWeight = FontWeight.Bold) },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedTextField(
                            value = newName,
                            onValueChange = { newName = it },
                            label = { Text("Name (e.g. Rahul)") }
                        )
                        OutlinedTextField(
                            value = newRel,
                            onValueChange = { newRel = it },
                            label = { Text("Relationship (Son, Daughter, etc.)") }
                        )
                        OutlinedTextField(
                            value = newPhone,
                            onValueChange = { newPhone = it },
                            label = { Text("Mobile (+91...)") }
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            if (newName.isNotBlank() && newPhone.isNotBlank()) {
                                members = members + FamilyMemberUi(
                                    id = System.currentTimeMillis().toString(),
                                    name = newName,
                                    relationship = newRel,
                                    phone = newPhone,
                                    telegramJoined = false,
                                    inviteLink = "https://t.me/Prevent_Scambot?start=m_${System.currentTimeMillis()}"
                                )
                                newName = ""
                                newPhone = ""
                                showAddDialog = false
                            }
                        }
                    ) {
                        Text("Add Member")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showAddDialog = false }) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}
