package in.satyavoice.app.ui.overlay

import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.net.Uri
import android.os.Build
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

object WarningOverlay {

    private var activeView: View? = null
    private var windowManager: WindowManager? = null

    fun showWarning(
        context: Context,
        riskScore: Int,
        claimedIdentity: String,
        advice: String,
        alertId: String?,
        scamWords: List<String>
    ) {
        if (activeView != null) return

        windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = 120
        }

        val layout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(0xFFDC3D43.toInt()) // High-visibility security red
            setPadding(40, 32, 40, 32)
            elevation = 20f

            val header = TextView(context).apply {
                text = "⚠️ AI VOICE CLONING DETECTED"
                setTextColor(0xFFFFFFFF.toInt())
                textSize = 16f
                setTypeface(null, android.graphics.Typeface.BOLD)
            }
            addView(header)

            val details = TextView(context).apply {
                val wordsStr = if (scamWords.isNotEmpty()) scamWords.joinToString(", ") else "Urgent money transfer"
                text = "Risk: $riskScore/100 (Critical)\nClaimed: $claimedIdentity\nKeywords: $wordsStr\nAdvice: $advice"
                setTextColor(0xFFFFF0F0.toInt())
                textSize = 13.5f
                setPadding(0, 10, 0, 16)
            }
            addView(details)

            val buttonRow = LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL

                val call1930Btn = Button(context).apply {
                    text = "Dial 1930"
                    setOnClickListener {
                        val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:1930")).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        }
                        context.startActivity(dialIntent)
                    }
                }
                addView(call1930Btn)

                val dismissBtn = Button(context).apply {
                    text = "Dismiss"
                    setOnClickListener {
                        dismiss()
                    }
                }
                addView(dismissBtn)
            }
            addView(buttonRow)
        }

        try {
            activeView = layout
            windowManager?.addView(layout, layoutParams)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun dismiss() {
        activeView?.let {
            try {
                windowManager?.removeView(it)
            } catch (e: Exception) {}
            activeView = null
        }
    }
}
