package in.satyavoice.app.services

import android.content.Context
import android.graphics.PixelFormat
import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import in.satyavoice.sdk.SatyaVoice
import in.satyavoice.sdk.models.RadarResult
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull

class CallScreeningService : CallScreeningService() {

    private val serviceScope = CoroutineScope(Dispatchers.Main)
    private var overlayView: View? = null
    private var windowManager: WindowManager? = null

    override fun onScreenCall(callDetails: Call.Details) {
        val rawHandle = callDetails.handle?.schemeSpecificPart ?: ""
        val normalizedNumber = if (!rawHandle.startsWith("+") && rawHandle.length == 10) {
            "+91$rawHandle"
        } else {
            rawHandle
        }

        // Always allow the call to ring (SatyaVoice never blocks without user choice)
        val response = CallResponse.Builder()
            .setDisallowCall(false)
            .setRejectCall(false)
            .setSkipCallLog(false)
            .setSkipNotification(false)
            .build()
        respondToCall(callDetails, response)

        if (normalizedNumber.isBlank()) return

        serviceScope.launch {
            val radar = withTimeoutOrNull(1500) {
                try {
                    SatyaVoice.lookupNumber(normalizedNumber)
                } catch (e: Exception) {
                    null
                }
            }

            if (radar != null && radar.level != "none") {
                showRadarOverlay(radar)
            }
        }
    }

    private fun showRadarOverlay(radar: RadarResult) {
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = 100
        }

        // Programmatic overlay view for ringing scam radar banner
        val context = this
        val view = android.widget.LinearLayout(context).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(40, 36, 40, 36)
            setBackgroundColor(
                if (radar.level == "potential_scam") 0xEECC2A2A.toInt() else 0xEEB4690E.toInt()
            )

            val titleText = TextView(context).apply {
                text = if (radar.level == "potential_scam") {
                    "⚠️ POTENTIAL SCAM CALL (Reported by ${radar.distinctReporters24h} users today)"
                } else {
                    "⚠️ CAUTION: Reported by ${radar.distinctReporters24h} user recently"
                }
                setTextColor(0xFFFFFFFF.toInt())
                textSize = 15f
                setTypeface(null, android.graphics.Typeface.BOLD)
            }
            addView(titleText)

            val claimText = TextView(context).apply {
                text = radar.topClaim ?: "Callers from this number frequently use AI voice cloning."
                setTextColor(0xFFEEEEEE.toInt())
                textSize = 13f
                setPadding(0, 10, 0, 16)
            }
            addView(claimText)

            val dismissBtn = Button(context).apply {
                text = "Dismiss Warning"
                setOnClickListener {
                    removeOverlay()
                }
            }
            addView(dismissBtn)
        }

        try {
            overlayView = view
            windowManager?.addView(view, layoutParams)
        } catch (e: Exception) {
            // Overlay permission might not be granted
        }
    }

    private fun removeOverlay() {
        overlayView?.let {
            try {
                windowManager?.removeView(it)
            } catch (e: Exception) {}
            overlayView = null
        }
    }

    override fun onDestroy() {
        removeOverlay()
        super.onDestroy()
    }
}
