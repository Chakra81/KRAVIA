import os
from twilio.rest import Client

def send_whatsapp_message(to_number, message):
    """
    Sends a WhatsApp message using Twilio API.
    to_number: e.g. "+919876543210"
    """
    account_sid = os.getenv('TWILIO_ACCOUNT_SID')
    auth_token = os.getenv('TWILIO_AUTH_TOKEN')
    from_whatsapp_number = os.getenv('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886') # Twilio Sandbox Number

    if not account_sid or not auth_token:
        print(f"[WhatsApp Mock] Would have sent to {to_number}: {message}")
        print("[WhatsApp] Twilio credentials not found in .env. Skipping real SMS.")
        return False

    try:
        client = Client(account_sid, auth_token)
        
        # Twilio requires numbers to be prefixed with 'whatsapp:'
        if not to_number.startswith('whatsapp:'):
            # Check if it has a plus sign, if not assume +91 (India) for demo purposes
            if not to_number.startswith('+'):
                to_number = f"+91{to_number}"
            to_number = f"whatsapp:{to_number}"
            
        message = client.messages.create(
            body=message,
            from_=from_whatsapp_number,
            to=to_number
        )
        print(f"[WhatsApp] Message sent successfully! SID: {message.sid}")
        return True
    except Exception as e:
        print(f"[WhatsApp] Error sending message to {to_number}: {e}")
        return False
