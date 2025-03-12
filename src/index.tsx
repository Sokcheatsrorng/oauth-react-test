import { render } from '@react-email/components';
import { EmailParams, MailerSend, Recipient, Sender } from 'mailersend';
import { Email } from './email';

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || '',
});

const emailHtml = await render(<Email url="https://api.mailersend.com/v1/email" />);

const sentFrom = new Sender('sokcheatsrorng@gmail.com', 'Srorng Sokcheat');
const recipients = [new Recipient('seameychanntha4@gmail.com', 'Seamey Channtha')];

const emailParams = new EmailParams()
  .setFrom(sentFrom)
  .setTo(recipients)
  .setSubject('This is a Subject')
  .setHtml(emailHtml);

await mailerSend.email.send(emailParams);
