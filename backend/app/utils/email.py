import os
from datetime import datetime

EMAIL_FOLDER = "mock_emails"
os.makedirs(EMAIL_FOLDER, exist_ok=True)

def send_email(to_email, subject, body):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{EMAIL_FOLDER}/{to_email}_{timestamp}.txt"
    with open(filename, "w") as f:
        f.write(f"To: {to_email}\nSubject: {subject}\n\n{body}")
    print(f"Mock email sent to {to_email} with subject '{subject}'")
