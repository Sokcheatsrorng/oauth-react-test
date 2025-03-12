import React, { useState } from 'react';
import { render } from '@react-email/components';
import { EmailParams, MailerSend, Recipient, Sender } from 'mailersend';
import { Email } from '../email'; 

const mailerSend = new MailerSend({
  apiKey: process.env.REACT_APP_MAILERSEND_API_KEY || '',
});

export const EmailComponent: React.FC = () => {
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = async () => {
    try {
      const emailHtml = await render(<Email url="https://api.mailersend.com/v1/email" />);
      
      const sentFrom = new Sender('sokcheatsrorng@gmail.com', 'Srorng Sokcheat');
      const recipients = [new Recipient('seameychanntha4@gmail.com', 'Seamey Channtha')];

      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject('This is a Subject')
        .setHtml(emailHtml);

      await mailerSend.email.send(emailParams);
      setEmailSent(true);
    } catch (err) {
      setError('Failed to send email. Please try again later.');
    }
  };

  return (
    <div>
      <h1>Email Sender</h1>
      <button onClick={sendEmail}>Send Email</button>
      {emailSent && <p>Email sent successfully!</p>}
      {error && <p>{error}</p>}
    </div>
  );
};