import html
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Alert, Call, Complaint, GroupMember, User
from app.db.session import get_db
from app.services.email_builder import build_complaint_email
from app.services.radar import add_radar_report
from app.services.telegram_bot import verify_redirect_signature

router = APIRouter(prefix="/r", tags=["Telegram Redirects"])


def render_redirect_html(
    title: str,
    target_url: str,
    button_label: str,
    copy_text: str | None = None,
    badge_label: str = "SatyaVoice Secure Action",
) -> str:
    escaped_url = html.escape(target_url)
    escaped_title = html.escape(title)
    escaped_badge = html.escape(badge_label)
    escaped_button = html.escape(button_label)
    escaped_copy = html.escape(copy_text or "").replace("\n", "\\n").replace("'", "\\'")

    copy_btn_html = ""
    if copy_text:
        copy_btn_html = f"""
        <button onclick="navigator.clipboard.writeText('{escaped_copy}'); alert('Complaint text copied to clipboard!');" 
                class="btn-secondary">
          📋 Copy Complaint Text
        </button>
        """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escaped_title} - SatyaVoice</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0c0c11;
      color: #ededf2;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
      text-align: center;
    }}
    .card {{
      background: #171720;
      border: 1px solid #2b2b36;
      border-radius: 16px;
      padding: 32px 24px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 12px 32px rgba(0,0,0,0.4);
    }}
    .badge {{
      display: inline-block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      background: rgba(220, 61, 67, 0.15);
      color: #ea5a5a;
      border: 1px solid rgba(220, 61, 67, 0.3);
      margin-bottom: 16px;
    }}
    h1 {{
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 12px;
    }}
    p {{
      font-size: 14px;
      color: #9a9aa5;
      line-height: 1.5;
      margin: 0 0 24px;
    }}
    .btn-primary {{
      display: block;
      width: 100%;
      background: #dc3d43;
      color: #ffffff;
      padding: 14px;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      border-radius: 10px;
      border: none;
      box-sizing: border-box;
      cursor: pointer;
      margin-bottom: 12px;
      transition: background 0.2s;
    }}
    .btn-primary:hover {{
      background: #c22a2a;
    }}
    .btn-secondary {{
      display: block;
      width: 100%;
      background: #23232e;
      color: #ededf2;
      padding: 12px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 10px;
      border: 1px solid #363645;
      cursor: pointer;
      margin-bottom: 12px;
    }}
    .footer-note {{
      font-size: 12px;
      color: #6c6c78;
      margin-top: 16px;
    }}
  </style>
  <script>
    window.addEventListener("DOMContentLoaded", function() {{
      setTimeout(function() {{
        window.location.href = "{escaped_url}";
      }}, 300);
    }});
  </script>
</head>
<body>
  <div class="card">
    <div class="badge">{escaped_badge}</div>
    <h1>{escaped_title}</h1>
    <p>Opening your communication app... If it does not launch automatically, tap the button below.</p>
    <a href="{escaped_url}" class="btn-primary">{escaped_button}</a>
    {copy_btn_html}
    <div class="footer-note">SatyaVoice AI Impersonation Shield</div>
  </div>
</body>
</html>"""


@router.get("/{alert_id}/cyber", response_class=HTMLResponse)
async def redirect_cyber(
    alert_id: str,
    sig: str = Query(..., description="HMAC signature"),
    db: AsyncSession = Depends(get_db),
):
    if not verify_redirect_signature(alert_id, "cyber", sig):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or expired signature")

    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    call = await db.get(Call, alert.call_id)
    user = await db.get(User, alert.user_id)
    impersonated = await db.get(GroupMember, alert.impersonated_member_id) if alert.impersonated_member_id else None

    email_data = build_complaint_email(
        target="cyber_cell",
        alert=alert,
        call=call,
        user=user,
        impersonated_member=impersonated,
    )

    # Log report to radar and complaint table
    if call:
        await add_radar_report(
            db=db,
            number_e164=call.caller_e164,
            reporter_user_id=user.id,
            source="user_report",
            call_id=call.id,
            scam_type=call.scam_type,
        )

    db.add(
        Complaint(
            alert_id=alert.id,
            user_id=user.id,
            target="cyber_cell",
            payload={"subject": email_data["subject"], "body": email_data["body"]},
        )
    )
    await db.commit()

    return render_redirect_html(
        title="Report to Cyber Crime",
        target_url=email_data["mailto_url"],
        button_label="Open Email App Now",
        copy_text=email_data["body"],
    )


@router.get("/{alert_id}/bank", response_class=HTMLResponse)
async def redirect_bank(
    alert_id: str,
    sig: str = Query(..., description="HMAC signature"),
    db: AsyncSession = Depends(get_db),
):
    if not verify_redirect_signature(alert_id, "bank", sig):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or expired signature")

    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    call = await db.get(Call, alert.call_id)
    user = await db.get(User, alert.user_id)
    impersonated = await db.get(GroupMember, alert.impersonated_member_id) if alert.impersonated_member_id else None

    email_data = build_complaint_email(
        target="bank",
        alert=alert,
        call=call,
        user=user,
        impersonated_member=impersonated,
    )

    if call:
        await add_radar_report(
            db=db,
            number_e164=call.caller_e164,
            reporter_user_id=user.id,
            source="user_report",
            call_id=call.id,
            scam_type=call.scam_type,
        )

    db.add(
        Complaint(
            alert_id=alert.id,
            user_id=user.id,
            target="bank",
            payload={"subject": email_data["subject"], "body": email_data["body"]},
        )
    )
    await db.commit()

    return render_redirect_html(
        title="Report to Bank Fraud Desk",
        target_url=email_data["mailto_url"],
        button_label="Open Banking Email Draft",
        copy_text=email_data["body"],
    )


@router.get("/{alert_id}/call1930", response_class=HTMLResponse)
async def redirect_call_1930(
    alert_id: str,
    sig: str = Query(..., description="HMAC signature"),
    db: AsyncSession = Depends(get_db),
):
    if not verify_redirect_signature(alert_id, "call1930", sig):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or expired signature")

    return render_redirect_html(
        title="Call 1930 National Helpline",
        target_url="tel:1930",
        button_label="Dial 1930 Helpline Now",
        badge_label="National Cyber Crime Reporting",
    )
