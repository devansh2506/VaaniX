package in.satyavoice.app.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.core.app.NotificationCompat
import in.satyavoice.app.ui.overlay.WarningOverlay
import in.satyavoice.sdk.SatyaVoice
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.io.File

class CallGuardService : Service() {

    private val scope = CoroutineScope(Dispatchers.IO)
    private var callerNumber: String? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        callerNumber = intent?.getStringExtra("CALLER_NUMBER") ?: "+919876543210"
        createNotificationChannel()

        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SatyaVoice Guard Active")
            .setContentText("Checking live voice authenticity…")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        startForeground(NOTIFICATION_ID, notification)

        scope.launch {
            try {
                // Step 1: Wait 5 seconds after call connects
                delay(5000)

                // Step 2: Record 10 seconds of call audio
                val recordedWav = SatyaVoice.recordClip(durationSec = 10, sampleRate = 16000)

                // Step 3: Analyze audio against Nes2Net-X model & STT
                val result = SatyaVoice.analyze(recordedWav, callerNumber)

                // Step 4: If AI_CLONE, trigger in-call overlay, vibration, and Payment Guard
                if (result.verdict == "AI_CLONE") {
                    triggerVibration()
                    WarningOverlay.showWarning(
                        context = applicationContext,
                        riskScore = result.riskScore,
                        claimedIdentity = result.claimedIdentity?.text ?: "Unknown Caller",
                        advice = result.advice ?: "Hang up immediately",
                        alertId = result.alertId,
                        scamWords = result.scamWords
                    )

                    // Arm Payment Guard for 30 minutes
                    val guardIntent = Intent(applicationContext, PaymentGuardService::class.java).apply {
                        putExtra("CALLER_NUMBER", callerNumber)
                        putExtra("ALERT_ID", result.alertId)
                        putExtra("CLAIMED_TEXT", result.claimedIdentity?.text)
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        startForegroundService(guardIntent)
                    } else {
                        startService(guardIntent)
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                stopSelf()
            }
        }

        return START_NOT_STICKY
    }

    private fun triggerVibration() {
        val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val timings = longArrayOf(0, 400, 200, 400, 200, 800)
            val amplitudes = intArrayOf(0, 255, 0, 255, 0, 255)
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(1000)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SatyaVoice Call Protection",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Monitors live calls for synthetic voice cloning"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    companion object {
        private const val CHANNEL_ID = "satyavoice_call_guard_channel"
        private const val NOTIFICATION_ID = 1001
    }
}
