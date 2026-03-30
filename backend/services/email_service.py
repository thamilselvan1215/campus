"""
services/email_service.py — Sends HTML email notifications to staff on task assignment.
Uses Gmail SMTP (TLS). Falls back to console print if SMTP is not configured.
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from config import settings


PRIORITY_COLOR = {
    "Critical": "#dc2626",
    "High":     "#ea580c",
    "Medium":   "#d97706",
    "Low":      "#16a34a",
}

PRIORITY_EMOJI = {
    "Critical": "🚨",
    "High":     "⚠️",
    "Medium":   "📋",
    "Low":      "📝",
}


def _build_html(staff_name: str, complaint: dict) -> str:
    priority    = complaint.get("priority", "Medium")
    color       = PRIORITY_COLOR.get(priority, "#d97706")
    emoji       = PRIORITY_EMOJI.get(priority, "📋")
    ticket_id   = complaint.get("id", "???")
    issue_type  = complaint.get("issue_type", "Unknown")
    location    = complaint.get("location", "Unknown")
    description = complaint.get("description", "")
    ai_notes    = complaint.get("ai_reasoning", "No AI notes provided.")

    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.4);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f 0%,#1e293b 100%);padding:30px 36px;border-bottom:1px solid #334155;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:28px;">🤖</span>
                    <span style="font-size:20px;font-weight:800;color:#ffffff;margin-left:10px;vertical-align:middle;">AutoFix Campus</span>
                    <br>
                    <span style="font-size:11px;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;">AI Complaint Resolution System</span>
                  </td>
                  <td align="right">
                    <span style="background:{color};color:#fff;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:700;">
                      {emoji} {priority} Priority
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#f1f5f9;">
                Hello, {staff_name}! 👋
              </p>
              <p style="margin:0 0 24px 0;font-size:15px;color:#94a3b8;line-height:1.6;">
                The <strong style="color:#f97316;">AutoFix AI Coordinator</strong> has automatically assigned you a new maintenance ticket.
                Please review the details below and begin work as soon as possible.
              </p>

              <!-- Ticket Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;border:1px solid #334155;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #1e293b;">
                    <span style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;">Ticket Details</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr style="margin-bottom:12px;">
                        <td style="color:#64748b;font-size:13px;width:140px;padding:8px 0;">🎫 Ticket ID</td>
                        <td style="color:#f1f5f9;font-size:13px;font-weight:600;padding:8px 0;">#{ticket_id}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748b;font-size:13px;padding:8px 0;">🔧 Issue Type</td>
                        <td style="color:#f1f5f9;font-size:13px;font-weight:600;padding:8px 0;">{issue_type}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748b;font-size:13px;padding:8px 0;">📍 Location</td>
                        <td style="color:#f1f5f9;font-size:13px;font-weight:600;padding:8px 0;">{location}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748b;font-size:13px;padding:8px 0;vertical-align:top;">📝 Description</td>
                        <td style="color:#cbd5e1;font-size:13px;padding:8px 0;line-height:1.5;">"{description}"</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- AI Notes -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#172033;border-radius:12px;border:1px solid #1d4ed8;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 8px 0;font-size:12px;color:#60a5fa;text-transform:uppercase;letter-spacing:1.5px;">🤖 AI Agent Notes</p>
                    <p style="margin:0;font-size:13px;color:#93c5fd;line-height:1.6;font-style:italic;">"{ai_notes}"</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="http://localhost:5173" style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.5px;">
                      Open Staff Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:20px 36px;border-top:1px solid #1e293b;text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">
                AutoFix Campus © 2025 — Powered by Autonomous Multi-Agent AI Engine<br>
                This is an automated notification. Do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def send_assignment_email(staff_email: str, staff_name: str, complaint_dict: dict):
    """
    Sends a rich HTML assignment notification email to the assigned staff.
    Uses Gmail SMTP if configured in .env, otherwise prints to console.
    """
    priority   = complaint_dict.get("priority", "Medium")
    ticket_id  = complaint_dict.get("id", "???")
    subject    = f"[AutoFix] {PRIORITY_EMOJI.get(priority,'📋')} New {priority} Ticket #{ticket_id} Assigned to You"

    html_body  = _build_html(staff_name, complaint_dict)

    # Build fallback plain text
    plain_body = (
        f"Hello {staff_name},\n\n"
        f"You have been assigned Ticket #{ticket_id}.\n"
        f"Priority : {priority}\n"
        f"Issue    : {complaint_dict.get('issue_type')}\n"
        f"Location : {complaint_dict.get('location')}\n"
        f"Details  : {complaint_dict.get('description')}\n\n"
        f"AI Notes : {complaint_dict.get('ai_reasoning', 'N/A')}\n\n"
        f"Please open your Staff Dashboard to begin work.\n"
    )

    if not staff_email:
        _console_log(staff_name, subject, plain_body, reason="No email address set for staff")
        return

    if not (settings.smtp_server and settings.smtp_username and settings.smtp_password):
        _console_log(staff_name, subject, plain_body, reason="SMTP not configured in .env")
        return

    # --- Send via Gmail SMTP ---
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"AutoFix Campus <{settings.sender_email}>"
        msg["To"]      = staff_email

        msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.smtp_server, settings.smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.sendmail(settings.sender_email, staff_email, msg.as_string())

        print(f"[EMAIL] ✅ Email sent to {staff_name} <{staff_email}> — Ticket #{ticket_id}")

    except Exception as e:
        print(f"[EMAIL] ❌ Failed to send email to {staff_email}: {e}")


def _console_log(staff_name: str, subject: str, body: str, reason: str = ""):
    print(f"\n{'='*60}")
    print(f"[EMAIL MOCK] {reason}")
    print(f"TO      : {staff_name}")
    print(f"SUBJECT : {subject}")
    print(f"BODY    :\n{body}")
    print(f"{'='*60}\n")
