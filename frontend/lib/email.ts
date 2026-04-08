import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;

  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("EMAIL_USER and EMAIL_PASS environment variables must be set");
  }

  transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  return transporter;
}

export async function sendVerificationEmail(to: string, message: string) {
  if (!to) {
    throw new Error("No recipient email provided");
  }

  const EMAIL_USER = process.env.EMAIL_USER;
  const mailOptions = {
    from: EMAIL_USER,
    to,
    subject: "Verification Code",
    text: `Your verification code is: ${message}. Please enter this code on the verification page.`,
    html: `
      <div style="background-color: #ffffff; padding: 20px; max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background-color: #4B0082; color: #ffffff; padding: 10px; text-align: center;">
          <h1>Verification Code</h1>
        </div>
        <div style="padding: 20px;">
          <p>Hello,</p>
          <p>Please use the following verification code:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; color: #800080; border: 2px solid #800080; padding: 10px 20px; border-radius: 5px;">${message}</span>
          </div>
          <p>Enter this code on the verification page to complete the process.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
        <div style="text-align: center; padding: 10px; font-size: 12px; color: #666;">
          <p>&copy; 2025 All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log("Email sent successfully:", info.response, "to:", to);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send verification email");
  }
}

export async function sendApprovalEmail(to: string) {
  const EMAIL_USER = process.env.EMAIL_USER;
  const hostName = process.env.hostName || "https://usbanking.icu";

  const mailOptions = {
    from: EMAIL_USER,
    to,
    subject: "Account Approved",
    text: "Your account has been approved by the admin. You can now log in.",
    html: `<p>Your account has been approved by the admin. You can now <a href='${hostName}/login'>log in</a>.</p>`,
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log("Approval email sent:", info.response, "to:", to);
    return info;
  } catch (error) {
    console.error("Error sending approval email:", error);
    throw new Error("Failed to send approval email");
  }
}
