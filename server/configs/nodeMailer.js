import nodemailer from "nodemailer";

if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SENDER_EMAIL) {
  console.error("❌ SMTP config must include SMTP_USER, SMTP_PASS, and SENDER_EMAIL");
}

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // ✅ required for port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP transport verification failed:", error);
  } else {
    console.log("✅ SMTP transporter ready");
  }
});

const sendEmail = async ({ to, subject, body }) => {
  try {
    if (!to || !/^\S+@\S+\.\S+$/.test(to)) {
      throw new Error(`Invalid recipient email: ${to}`);
    }

    const response = await transporter.sendMail({
      from: `"QuickShow" <${process.env.SENDER_EMAIL}>`,
      to,
      subject,
      html: body,
    });
    

    console.log("✅ Email sent:", response.messageId);
    return response;

  } catch (error) {
    console.error("❌ Email failed:", error);
    throw error;
  }
};

export default sendEmail;