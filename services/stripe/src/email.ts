import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true, // 465 = true, 587 = false
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendLicenseEmail(to: string, licenseKey: string, plan: string) {
  const templatePath = path.join(__dirname, "templates", "emailTemplate.js");
  let template = fs.readFileSync(templatePath, "utf8");

  // Replace placeholders in template
  template = template
    .replace(/{{LICENSE_KEY}}/g, licenseKey)
    .replace(/{{PLAN}}/g, plan)
    .replace(/{{DOWNLOAD_LINK}}/g, getDownloadLink(plan));

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject: `Your MergeMind ${plan} License`,
    html: template,
  });
}

function getDownloadLink(plan: string): string {
  switch (plan.toLowerCase()) {
    case "pro":
      return process.env.DOWNLOAD_LINK_PRO || "";
    case "startup":
      return process.env.DOWNLOAD_LINK_STARTUP || "";
    case "enterprise":
      return process.env.DOWNLOAD_LINK_ENTERPRISE || "";
    default:
      return "";
  }
}
