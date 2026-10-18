/**
 * SatyaVoice / VaaniX - Email Complaint Link Builder
 * Roadmap Section 9.2, 9.3 & 14 (Gmail compose URLs <= 2,000 chars)
 */

export interface CyberComplaintDetails {
  alertId: string;
  checkId: string;
  dateStr: string;
  callerNumber?: string | null;
  riskScore: number;
  voiceScore: number;
  textScore: number;
  claimLabel?: string | null;
  transcript?: string | null;
  audioSha256?: string | null;
  downloadUrl?: string | null;
  userName?: string | null;
  userPhone?: string | null;
  toEmail: string;
}

export interface BankComplaintDetails {
  alertId: string;
  checkId: string;
  dateStr: string;
  callerNumber?: string | null;
  bankName: string;
  toEmail: string;
  userName?: string | null;
  userPhone?: string | null;
  claimLabel?: string | null;
}

export interface ComplaintLinkResult {
  subject: string;
  body: string;
  gmailUrl: string;
  mailtoUrl: string;
}

export function buildCyberCrimeEmail(details: CyberComplaintDetails): ComplaintLinkResult {
  const subject = `[URGENT] AI Voice Clone Scam Report - ${details.callerNumber || 'Unknown Caller'}`;

  // Build the email body skeleton without transcript first
  const buildBody = (transcriptSnippet: string) => {
    return [
      'Respected Cyber Crime Officer,',
      '',
      'I am reporting an attempted financial fraud via an AI-synthesized voice clone.',
      '',
      '--- INCIDENT SUMMARY ---',
      `Date & Time: ${details.dateStr}`,
      `Caller Phone Number: ${details.callerNumber || 'Unknown'}`,
      `Overall Threat Score: ${details.riskScore}/100`,
      `Acoustic Spoof Probability: ${details.voiceScore}/100`,
      `Transcript Scam Keywords Score: ${details.textScore}/100`,
      `Impersonation Claim: ${details.claimLabel || 'None'}`,
      details.audioSha256 ? `Audio Evidence SHA-256: ${details.audioSha256}` : null,
      details.downloadUrl ? `Evidence Audio Recording (Expires in 7 days): ${details.downloadUrl}` : null,
      '',
      '--- TRANSCRIPT EXCERPT ---',
      transcriptSnippet ? `"${transcriptSnippet}"` : '(No speech detected)',
      '',
      '--- COMPLAINANT CONTACT ---',
      `Name: ${details.userName || '[Your Name]'}`,
      `Phone: ${details.userPhone || '[Your Contact Number]'}`,
      '',
      'Generated via SatyaVoice (VaaniX) Scam Prevention Platform.',
    ]
      .filter((line) => line !== null)
      .join('\n');
  };

  const rawTranscript = (details.transcript || '').trim();
  let transcriptExcerpt = rawTranscript;

  const makeGmailUrl = (bodyText: string) =>
    `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(details.toEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

  let body = buildBody(transcriptExcerpt);
  let gmailUrl = makeGmailUrl(body);

  // If the total URL exceeds 2000 characters, iteratively trim transcript excerpt
  const MAX_GMAIL_URL_LENGTH = 2000;
  if (gmailUrl.length > MAX_GMAIL_URL_LENGTH && transcriptExcerpt.length > 0) {
    const overflow = gmailUrl.length - MAX_GMAIL_URL_LENGTH;
    const targetLength = Math.max(0, transcriptExcerpt.length - overflow - 20);
    transcriptExcerpt = transcriptExcerpt.slice(0, targetLength) + '... [trimmed]';
    body = buildBody(transcriptExcerpt);
    gmailUrl = makeGmailUrl(body);

    // If still slightly over, truncate more aggressively
    while (gmailUrl.length > MAX_GMAIL_URL_LENGTH && transcriptExcerpt.length > 15) {
      transcriptExcerpt = transcriptExcerpt.slice(0, transcriptExcerpt.length - 20) + '...';
      body = buildBody(transcriptExcerpt);
      gmailUrl = makeGmailUrl(body);
    }
  }

  const mailtoUrl = `mailto:${details.toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { subject, body, gmailUrl, mailtoUrl };
}

export function buildBankFreezeEmail(details: BankComplaintDetails): ComplaintLinkResult {
  const subject = `[EMERGENCY FREEZE REQUEST] Fraudulent AI Voice Call - ${details.callerNumber || 'Unknown'}`;

  const body = [
    `To: Fraud Risk Management / Customer Support, ${details.bankName}`,
    '',
    'Dear Support Team,',
    '',
    'I received an incoming call utilizing an AI-synthesized voice clone attempting unauthorized bank transfers and credential harvesting.',
    '',
    '--- CALL INCIDENT DETAILS ---',
    `Date & Time: ${details.dateStr}`,
    `Suspect Phone Number: ${details.callerNumber || 'Unknown'}`,
    `Claimed Entity / Person: ${details.claimLabel || 'Family Impersonation'}`,
    '',
    '--- REQUESTED ACTION ---',
    'Please flag my accounts for heightened fraud monitoring and temporarily verify any high-value debit or UPI requests made within the last 2 hours.',
    '',
    '--- ACCOUNT HOLDER DETAILS ---',
    `Name: ${details.userName || '[Your Account Name]'}`,
    `Registered Phone: ${details.userPhone || '[Your Registered Phone]'}`,
    '',
    'Generated via SatyaVoice (VaaniX) Incident Protection.',
  ].join('\n');

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(details.toEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const mailtoUrl = `mailto:${details.toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { subject, body, gmailUrl, mailtoUrl };
}

export const buildBankComplaintEmail = buildBankFreezeEmail;
