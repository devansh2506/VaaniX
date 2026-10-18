package in.satyavoice.app.ui.overlay

import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.CountDownTimer
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

object PaymentGuardOverlay {

    private var activeView: View? = null
    private var windowManager: WindowManager? = null
    private var timer: CountDownTimer? = null

    fun show(
        context: Context,
        packageName: String,
        callerNumber: String,
        claimedText: String,
        alertId: String?,
        onDismissed: () -> Unit
    ) {
        if (activeView != null) return

        windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.CENTER
        }

        val layout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(0xF90F2A44.toInt()) // Deep protective navy background
            setPadding(50, 80, 50, 80)
            gravity = Gravity.CENTER

            val emoji = TextView(context).apply {
                text = "✋"
                textSize = 64f
                gravity = Gravity.CENTER
            }
            addView(emoji)

            val title = TextView(context).apply {
                text = "WAIT! Potential Voice Clone Scam"
                setTextColor(0xFFDC3D43.toInt())
                textSize = 22f
                setTypeface(null, android.graphics.Typeface.BOLD)
                gravity = Gravity.CENTER
                setPadding(0, 16, 0, 16)
            }
            addView(title)

            val desc = TextView(context).apply {
                text = "You recently received an incoming call from an AI-generated cloned voice posing as $claimedText ($callerNumber).\n\nScammers use synthetic urgency to force immediate UPI transactions. Please verify independently before transferring any money."
                setTextColor(0xFFFFFFFF.toInt())
                textSize = 14.5f
                lineSpacingMultiplier = 1.3f
                gravity = Gravity.CENTER
                setPadding(0, 0, 0, 32)
            }
            addView(desc)

            val cancelBtn = Button(context).apply {
                text = "🛡️ Cancel Payment & Go to Home"
                setBackgroundColor(0xFF0E9F9A.toInt()) // Teal
                setTextColor(0xFFFFFFFF.toInt())
                setOnClickListener {
                    val homeIntent = Intent(Intent.ACTION_MAIN).apply {
                        addCategory(Intent.CATEGORY_HOME)
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    context.startActivity(homeIntent)
                    dismiss()
                    onDismissed()
                }
            }
            addView(cancelBtn)

            val continueBtn = Button(context).apply {
                text = "Continue anyway (60s cooldown)"
                isEnabled = false
                setBackgroundColor(0xFF334455.toInt())
                setTextColor(0xFFAAAAAA.toInt())
                setOnClickListener {
                    dismiss()
                    onDismissed()
                }
            }
            addView(continueBtn)

            // Start 60-second cooldown timer
            timer = object : CountDownTimer(60000, 1000) {
                override fun onTick(millisUntilFinished: Long) {
                    val sec = millisUntilFinished / 1000
                    continueBtn.text = "Continue anyway (${sec}s cooldown)"
                }

                override fun onFinish() {
                    continueBtn.text = "Continue to Payment App"
                    continueBtn.isEnabled = true
                    continueBtn.setBackgroundColor(0xFF556677.toInt())
                    continueBtn.setTextColor(0xFFFFFFFF.toInt())
                }
            }.start()
        }

        try {
            activeView = layout
            windowManager?.addView(layout, layoutParams)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun dismiss() {
        timer?.cancel()
        timer = null
        activeView?.let {
            try {
                windowManager?.removeView(it)
            } catch (e: Exception) {}
            activeView = null
        }
    }
}
