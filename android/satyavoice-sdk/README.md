# SatyaVoice Android SDK

Embed real-time AI voice-clone scam detection and payment guard signals directly into your banking, UPI, or telecom dialer application.

## Quick Integration (Bank / UPI App)

Add dependency to your app's `build.gradle.kts`:
```kotlin
implementation(project(":satyavoice-sdk"))
```

In your Application class:
```kotlin
SatyaVoice.init(context = this, apiKey = "YOUR_BANK_API_KEY", baseUrl = "https://api.satyavoice.in")
```

Check for an active scam call before authorizing high-value transfers or OTP entry:
```kotlin
class PaymentConfirmationActivity : AppCompatActivity() {
    fun onInitiatePaymentClicked() {
        // Step 1: Check if victim was targeted by an AI voice-clone scam in the last 30 minutes
        if (SatyaVoice.hasRecentScamCall(withinMinutes = 30)) {
            showScamInterventionDialog(
                title = "Payment Warning ✋",
                message = "An AI voice impersonation call was detected on this device in the last 30 minutes. Please verify recipient before proceeding.",
                onContinueWithCooldown = { proceedToPayment() }
            )
            return
        }
        proceedToPayment()
    }
}
```

## Features
- `SatyaVoice.hasRecentScamCall(withinMinutes = 30)`: Checks if device had an active `AI_CLONE` call.
- `SatyaVoice.lookupNumber(e164)`: Queries crowd-sourced Scam Radar in < 300ms.
- `SatyaVoice.analyze(wavFile, callerNumber)`: Server-side Nes2Net-X voice forensics.
