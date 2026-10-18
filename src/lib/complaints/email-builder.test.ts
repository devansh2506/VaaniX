import { describe, it, expect } from 'vitest';
import {
  buildCyberCrimeEmail,
  buildBankComplaintEmail,
} from './email-builder';

describe('Email Complaint Link Builder', () => {
  it('generates valid cyber crime complaint with normal transcript', () => {
    const result = buildCyberCrimeEmail({
      alertId: 'a1111111-1111-1111-1111-111111111111',
      checkId: 'c2222222-2222-2222-2222-222222222222',
      dateStr: '2026-10-18 19:30 IST',
      callerNumber: '+919876543210',
      riskScore: 92,
      voiceScore: 95,
      textScore: 85,
      claimLabel: 'Rohan (Son)',
      transcript: 'Papa please send twenty thousand rupees urgently to this UPI ID.',
      audioSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      downloadUrl: 'https://example.com/evidence/download?token=xyz',
      userName: 'Amit Sharma',
      userPhone: '+919812345678',
      toEmail: 'cybercrime@example.gov.in',
    });

    expect(result.subject).toContain('[URGENT] AI Voice Clone Scam Report - +919876543210');
    expect(result.body).toContain('Rohan (Son)');
    expect(result.body).toContain('Papa please send twenty thousand rupees');
    expect(result.body).toContain('92/100');
    expect(result.gmailUrl).toContain('mail.google.com');
    expect(result.mailtoUrl).toContain('mailto:cybercrime@example.gov.in');
    expect(result.gmailUrl.length).toBeLessThanOrEqual(2000);
  });

  it('strictly limits Gmail compose URL to <= 2000 characters with extremely long transcripts', () => {
    // Generate an enormous transcript (5,000 characters)
    const longTranscript = 'Emergency! ' + 'Send money now immediately police arrest bail court fine urgent '.repeat(80);

    const result = buildCyberCrimeEmail({
      alertId: 'a1111111-1111-1111-1111-111111111111',
      checkId: 'c2222222-2222-2222-2222-222222222222',
      dateStr: '2026-10-18 19:30 IST',
      callerNumber: '+919876543210',
      riskScore: 98,
      voiceScore: 99,
      textScore: 95,
      claimLabel: 'Inspector Sharma',
      transcript: longTranscript,
      audioSha256: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      downloadUrl: 'https://storage.supabase.co/evidence/very-long-signed-url-with-many-params?signature=abc',
      userName: 'Vandit Bajaj',
      userPhone: '+919999999999',
      toEmail: 'cybercell.delhi@police.gov.in',
    });

    expect(result.gmailUrl.length).toBeLessThanOrEqual(2000);
    expect(result.body).toContain('--- TRANSCRIPT EXCERPT ---');
    expect(result.body).toContain('... [trimmed]');
  });

  it('builds bank complaint email correctly', () => {
    const result = buildBankComplaintEmail({
      alertId: 'a1111111-1111-1111-1111-111111111111',
      checkId: 'c2222222-2222-2222-2222-222222222222',
      dateStr: '2026-10-18 19:30 IST',
      callerNumber: '+919876543210',
      bankName: 'Sample Bank (Demo)',
      toEmail: 'fraud@samplebank.example',
      userName: 'Vandit Bajaj',
      userPhone: '+919999999999',
      claimLabel: 'Bank Manager',
    });

    expect(result.subject).toContain('[EMERGENCY FREEZE REQUEST] Fraudulent AI Voice Call');
    expect(result.body).toContain('Sample Bank (Demo)');
    expect(result.gmailUrl).toContain('fraud%40samplebank.example');
    expect(result.mailtoUrl).toContain('mailto:fraud@samplebank.example');
    expect(result.gmailUrl.length).toBeLessThanOrEqual(2000);
  });
});
