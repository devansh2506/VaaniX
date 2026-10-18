package in.satyavoice.app.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import in.satyavoice.app.ui.overlay.PaymentGuardOverlay
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class PaymentGuardService : Service() {

    private val scope = CoroutineScope(Dispatchers.IO)
    private var isRunning = false
    private val suppressedPackages = mutableMapOf<String, Long>()

    private val monitoredApps = setOf(
        "com.google.android.apps.nbu.paisa.user", // Google Pay
        "com.phonepe.app",                       // PhonePe
        "net.one97.paytm",                       // Paytm
        "in.org.npci.upiapp",                    // BHIM UPI
        "com.sbi.lotusintouch",                  // SBI YONO
        "com.csam.icici.bank.imobile",           // ICICI iMobile
        "com.snapwork.hdfc",                     // HDFC Mobile
        "com.axis.mobile",                       // Axis Mobile
        "in.satyavoice.app.paydemo"              // Demo App
    )

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val callerNumber = intent?.getStringExtra("CALLER_NUMBER") ?: "Unknown"
        val claimedText = intent?.getStringExtra("CLAIMED_TEXT") ?: "Impersonator"
        val alertId = intent?.getStringExtra("ALERT_ID")

        createNotificationChannel()

        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SatyaVoice Payment Guard Active")
            .setContentText("Monitoring financial transactions for 30 minutes post-scam.")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        startForeground(NOTIFICATION_ID, notification)

        if (!isRunning) {
            isRunning = true
            scope.launch {
                val guardEndTime = System.currentTimeMillis() + (30 * 60 * 1000L) // 30 minutes

                while (System.currentTimeMillis() < guardEndTime && isRunning) {
                    checkForegroundApp(callerNumber, claimedText, alertId)
                    delay(1000)
                }

                stopSelf()
            }
        }

        return START_NOT_STICKY
    }

    private fun checkForegroundApp(callerNumber: String, claimedText: String, alertId: String?) {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager ?: return
        val endTime = System.currentTimeMillis()
        val startTime = endTime - 3000

        val usageEvents = usageStatsManager.queryEvents(startTime, endTime)
        val event = UsageEvents.Event()

        var currentPackage: String? = null
        while (usageEvents.hasNextEvent()) {
            usageEvents.getNextEvent(event)
            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
                currentPackage = event.packageName
            }
        }

        if (currentPackage != null && monitoredApps.contains(currentPackage)) {
            val lastSuppressed = suppressedPackages[currentPackage] ?: 0L
            val cooldown5Min = 5 * 60 * 1000L

            if (System.currentTimeMillis() - lastSuppressed > cooldown5Min) {
                // Show Payment Guard full screen intervention
                PaymentGuardOverlay.show(
                    context = applicationContext,
                    packageName = currentPackage,
                    callerNumber = callerNumber,
                    claimedText = claimedText,
                    alertId = alertId,
                    onDismissed = {
                        suppressedPackages[currentPackage] = System.currentTimeMillis()
                    }
                )
            }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SatyaVoice Payment Guard",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Guards UPI and banking transfers for 30 minutes following a voice scam call"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        isRunning = false
        super.onDestroy()
    }

    companion object {
        private const val CHANNEL_ID = "satyavoice_payment_guard_channel"
        private const val NOTIFICATION_ID = 1002
    }
}
