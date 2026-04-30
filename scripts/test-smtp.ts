import nodemailer from 'nodemailer';

const cfg = {
  host: process.env.SMTP_HOST ?? 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT ?? '587'),
  user: process.env.SMTP_USER ?? '',
  pass: process.env.SMTP_PASS ?? '',
  from: process.env.SMTP_FROM_EMAIL ?? '',
};

console.log('Config:', { host: cfg.host, port: cfg.port, user: cfg.user, from: cfg.from });

async function main() {
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
  });

  try {
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✓ SMTP connection OK');
  } catch (err: any) {
    console.error('✗ SMTP verify failed:', err.message);
    console.error('  Code:', err.code);
    console.error('  Response:', err.response);
    process.exit(1);
  }

  try {
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Oracle Gym" <${cfg.from}>`,
      to: 'rtjhay21@gmail.com',
      subject: 'SMTP Test',
      text: 'This is a test email from Oracle Gym.',
    });
    console.log('✓ Email sent:', info.messageId, info.response);
  } catch (err: any) {
    console.error('✗ Send failed:', err.message);
    console.error('  Code:', err.code);
    console.error('  Response:', err.response);
  }
}

main();
