package in.satyavoice.sdk

import android.content.Context
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import com.google.gson.Gson
import in.satyavoice.sdk.models.AnalysisResult
import in.satyavoice.sdk.models.RadarResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import java.io.FileOutputStream
import java.io.RandomAccessFile
import java.util.concurrent.TimeUnit

object SatyaVoice {
    private var context: Context? = null
    private var apiKey: String? = null
    private var baseUrl: String = "http://10.0.2.2:8000"
    private var lastScamCallTimestamp: Long = 0L

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()

    fun init(context: Context, apiKey: String, baseUrl: String = "http://10.0.2.2:8000") {
        this.context = context.applicationContext
        this.apiKey = apiKey
        this.baseUrl = baseUrl.trimEnd('/')
    }

    fun markScamCallDetected() {
        lastScamCallTimestamp = System.currentTimeMillis()
    }

    fun hasRecentScamCall(withinMinutes: Int = 30): Boolean {
        if (lastScamCallTimestamp == 0L) return false
        val windowMs = withinMinutes * 60 * 1000L
        return (System.currentTimeMillis() - lastScamCallTimestamp) < windowMs
    }

    suspend fun lookupNumber(e164: String): RadarResult = withContext(Dispatchers.IO) {
        val url = "$baseUrl/v1/radar/lookup?number=${java.net.URLEncoder.encode(e164, "UTF-8")}"
        val request = Request.Builder()
            .url(url)
            .apply { apiKey?.let { addHeader("X-API-Key", it) } }
            .get()
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IllegalStateException("Radar lookup failed: HTTP ${response.code}")
            }
            val body = response.body?.string() ?: throw IllegalStateException("Empty body")
            gson.fromJson(body, RadarResult::class.java)
        }
    }

    suspend fun analyze(wav: File, callerNumber: String?): AnalysisResult = withContext(Dispatchers.IO) {
        val requestBody = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart(
                "audio",
                wav.name,
                wav.asRequestBody("audio/wav".toMediaTypeOrNull())
            )
            .apply {
                callerNumber?.let { addFormDataPart("caller_number", it) }
                addFormDataPart("direction", "incoming")
            }
            .build()

        val request = Request.Builder()
            .url("$baseUrl/v1/analyze")
            .apply { apiKey?.let { addHeader("X-API-Key", it) } }
            .post(requestBody)
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IllegalStateException("Voice analysis failed: HTTP ${response.code}")
            }
            val body = response.body?.string() ?: throw IllegalStateException("Empty body")
            val result = gson.fromJson(body, AnalysisResult::class.java)
            if (result.verdict == "AI_CLONE") {
                markScamCallDetected()
            }
            result
        }
    }

    fun recordClip(durationSec: Int = 10, sampleRate: Int = 16000): File {
        val appContext = context ?: throw IllegalStateException("SatyaVoice SDK not initialized. Call SatyaVoice.init(...) first.")
        val outputFile = File(appContext.cacheDir, "satyavoice_clip_${System.currentTimeMillis()}.wav")

        val minBufferSize = AudioRecord.getMinBufferSize(
            sampleRate,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        )
        val bufferSize = maxOf(minBufferSize, sampleRate * 2)
        val audioRecord = AudioRecord(
            MediaRecorder.AudioSource.VOICE_RECOGNITION,
            sampleRate,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
            bufferSize
        )

        val rawFile = File(appContext.cacheDir, "temp_raw.pcm")
        val outputStream = FileOutputStream(rawFile)
        val buffer = ByteArray(2048)

        try {
            audioRecord.startRecording()
            val startTime = System.currentTimeMillis()
            val maxTime = durationSec * 1000L

            while (System.currentTimeMillis() - startTime < maxTime) {
                val read = audioRecord.read(buffer, 0, buffer.size)
                if (read > 0) {
                    outputStream.write(buffer, 0, read)
                }
            }
        } finally {
            audioRecord.stop()
            audioRecord.release()
            outputStream.close()
        }

        // Convert PCM to proper 16-bit 16kHz mono WAV file
        writeWavHeader(rawFile, outputFile, sampleRate, 1, 16)
        rawFile.delete()
        return outputFile
    }

    private fun writeWavHeader(rawFile: File, wavFile: File, sampleRate: Int, channels: Int, bitDepth: Int) {
        val rawData = rawFile.readBytes()
        val totalAudioLen = rawData.size.toLong()
        val totalDataLen = totalAudioLen + 36
        val byteRate = (sampleRate * channels * bitDepth / 8).toLong()

        val header = ByteArray(44)
        // RIFF chunk descriptor
        header[0] = 'R'.code.toByte()
        header[1] = 'I'.code.toByte()
        header[2] = 'F'.code.toByte()
        header[3] = 'F'.code.toByte()
        header[4] = (totalDataLen and 0xff).toByte()
        header[5] = ((totalDataLen shr 8) and 0xff).toByte()
        header[6] = ((totalDataLen shr 16) and 0xff).toByte()
        header[7] = ((totalDataLen shr 24) and 0xff).toByte()
        header[8] = 'W'.code.toByte()
        header[9] = 'A'.code.toByte()
        header[10] = 'V'.code.toByte()
        header[11] = 'E'.code.toByte()
        // fmt sub-chunk
        header[12] = 'f'.code.toByte()
        header[13] = 'm'.code.toByte()
        header[14] = 't'.code.toByte()
        header[15] = ' '.code.toByte()
        header[16] = 16 // SubChunk1Size for PCM
        header[17] = 0
        header[18] = 0
        header[19] = 0
        header[20] = 1 // AudioFormat 1 = PCM
        header[21] = 0
        header[22] = channels.toByte()
        header[23] = 0
        header[24] = (sampleRate and 0xff).toByte()
        header[25] = ((sampleRate shr 8) and 0xff).toByte()
        header[26] = ((sampleRate shr 16) and 0xff).toByte()
        header[27] = ((sampleRate shr 24) and 0xff).toByte()
        header[28] = (byteRate and 0xff).toByte()
        header[29] = ((byteRate shr 8) and 0xff).toByte()
        header[30] = ((byteRate shr 16) and 0xff).toByte()
        header[31] = ((byteRate shr 24) and 0xff).toByte()
        header[32] = ((channels * bitDepth) / 8).toByte() // BlockAlign
        header[33] = 0
        header[34] = bitDepth.toByte() // BitsPerSample
        header[35] = 0
        // data sub-chunk
        header[36] = 'd'.code.toByte()
        header[37] = 'a'.code.toByte()
        header[38] = 't'.code.toByte()
        header[39] = 'a'.code.toByte()
        header[40] = (totalAudioLen and 0xff).toByte()
        header[41] = ((totalAudioLen shr 8) and 0xff).toByte()
        header[42] = ((totalAudioLen shr 16) and 0xff).toByte()
        header[43] = ((totalAudioLen shr 24) and 0xff).toByte()

        wavFile.outputStream().use { out ->
            out.write(header)
            out.write(rawData)
        }
    }
}
