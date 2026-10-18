package in.satyavoice.sdk.models

data class AnalysisResult(
    val callId: String,
    val alertId: String?,
    val verdict: String, // "AI_CLONE" | "REAL" | "INCONCLUSIVE"
    val riskScore: Int,   // 0..100
    val riskBand: String, // "low" | "elevated" | "high" | "critical"
    val windowScores: List<Float>,
    val transcript: String?,
    val transcriptLang: String?,
    val claimedIdentity: ClaimedIdentity?,
    val scamWords: List<String>,
    val scamType: String?,
    val advice: String?,
    val evidenceSha256: String?,
    val notified: NotificationStatus?
)

data class ClaimedIdentity(
    val memberId: String?,
    val text: String?,
    val source: String?
)

data class NotificationStatus(
    val userTelegram: Boolean,
    val impersonatedTelegram: Boolean
)

data class RadarResult(
    val number: String,
    val level: String, // "none" | "caution" | "potential_scam"
    val distinctReporters24h: Int,
    val distinctReporters7d: Int,
    val topScamType: String?,
    val topClaim: String?,
    val lastReportedAt: String?
)
