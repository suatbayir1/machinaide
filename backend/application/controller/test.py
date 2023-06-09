import email, smtplib, ssl
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def send_mail(sender, receivers, subject, body, password):
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
       
    # Email Headers
    message = MIMEMultipart()
    message["From"] = sender
    message["To"] = ", ".join(receivers)
    message["Subject"] = subject
    
    # # Message Body
    message.attach(MIMEText(body, "plain"))

    text = message.as_string()

    # Log in to server using secure context and send email
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(sender, password)
        server.sendmail(sender, receivers, text)

send_mail(
    sender = "email.machinaide@gmail.com",
    receivers = ["suatbayir1@gmail.com", "suat@iotiq.net"],
    subject = "test subject",
    body = "test content",
    password = "erste2020",
)