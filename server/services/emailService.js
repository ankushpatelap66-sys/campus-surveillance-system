const nodemailer = require("nodemailer");

const smtpPort = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure:
    String(process.env.SMTP_SECURE).toLowerCase() === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const getFromAddress = () => {
  return (
    process.env.EMAIL_FROM ||
    process.env.SMTP_USER
  );
};

const sendEmail = async ({
  to,
  subject,
  text,
  html,
}) => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.warn(
      "EMAIL CONFIGURATION MISSING. Email was not sent."
    );

    return {
      success: false,
      skipped: true,
      message: "SMTP configuration is missing",
    };
  }

  try {
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject,
      text,
      html,
    });

    console.log(
      `EMAIL SENT SUCCESSFULLY: ${to} | ${info.messageId}`
    );

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error(
      `EMAIL SEND FAILED: ${to}`,
      error.message
    );

    return {
      success: false,
      error: error.message,
    };
  }
};

/*
========================================
EMAIL VERIFICATION CODE
========================================
*/

const sendEmailVerificationCode = async (
  user,
  verificationCode
) => {
  return sendEmail({
    to: user.email,

    subject:
      "CVRU Campus Surveillance - Verify Your Email",

    text: `Hello ${user.name},

Your CVRU Campus Surveillance System verification code is:

${verificationCode}

This code is valid for 10 minutes.

Please enter this code in the registration verification screen to verify your email address.

If you did not create this account, you can safely ignore this email.

Regards,
CVRU Campus Surveillance System`,

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          line-height: 1.6;
          max-width: 600px;
          margin: auto;
          padding: 20px;
        "
      >
        <h2 style="color:#174a8b;">
          CVRU Campus Surveillance System
        </h2>

        <p>
          Hello <strong>${user.name}</strong>,
        </p>

        <p>
          Your email verification code is:
        </p>

        <div
          style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            text-align: center;
            padding: 18px;
            margin: 20px 0;
            background: #f1f5f9;
            border-radius: 10px;
            color: #174a8b;
          "
        >
          ${verificationCode}
        </div>

        <p>
          This code is valid for
          <strong>10 minutes</strong>.
        </p>

        <p>
          Enter this code in the registration
          verification screen to verify your email address.
        </p>

        <p>
          If you did not create this account,
          you can safely ignore this email.
        </p>

        <p>
          Regards,<br>
          <strong>
            CVRU Campus Surveillance System
          </strong>
        </p>
      </div>
    `,
  });
};

/*
========================================
STUDENT WELCOME EMAIL
========================================
*/

const sendStudentWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,

    subject:
      "Welcome to CVRU Campus Surveillance System",

    text: `Hello ${user.name},

Your student account for the CVRU Campus Surveillance System has been created successfully.

You can now log in using your registered email address.

Regards,
CVRU Campus Surveillance System`,

    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Welcome to CVRU Campus Surveillance System</h2>

        <p>Hello <strong>${user.name}</strong>,</p>

        <p>
          Your student account has been created successfully.
        </p>

        <p>
          You can now log in using your registered email address.
        </p>

        <p>
          Regards,<br>
          <strong>CVRU Campus Surveillance System</strong>
        </p>
      </div>
    `,
  });
};

/*
========================================
PENDING APPROVAL EMAIL
========================================
*/

const sendPendingApprovalEmail = async (user) => {
  return sendEmail({
    to: user.email,

    subject:
      "CVRU Campus Surveillance - Registration Pending Approval",

    text: `Hello ${user.name},

Your ${user.role} registration request has been received.

Your account is currently pending Admin approval.

You will receive another email when the Admin reviews your request.

Regards,
CVRU Campus Surveillance System`,

    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Registration Received</h2>

        <p>Hello <strong>${user.name}</strong>,</p>

        <p>
          Your <strong>${user.role}</strong>
          registration request has been received successfully.
        </p>

        <p>
          Your account is currently
          <strong>pending Admin approval</strong>.
        </p>

        <p>
          You will receive another email when the Admin
          reviews your request.
        </p>

        <p>
          Regards,<br>
          <strong>CVRU Campus Surveillance System</strong>
        </p>
      </div>
    `,
  });
};

/*
========================================
APPROVAL EMAIL
========================================
*/

const sendApprovalEmail = async (user) => {
  return sendEmail({
    to: user.email,

    subject:
      "CVRU Campus Surveillance - Account Approved",

    text: `Hello ${user.name},

Your ${user.role} account has been approved by the Admin.

You can now log in to the CVRU Campus Surveillance System.

Regards,
CVRU Campus Surveillance System`,

    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Account Approved</h2>

        <p>Hello <strong>${user.name}</strong>,</p>

        <p>
          Your <strong>${user.role}</strong>
          account has been approved by the Admin.
        </p>

        <p>
          You can now log in to the
          <strong>CVRU Campus Surveillance System</strong>.
        </p>

        <p>
          Regards,<br>
          <strong>CVRU Campus Surveillance System</strong>
        </p>
      </div>
    `,
  });
};

/*
========================================
REJECTION EMAIL
========================================
*/

const sendRejectionEmail = async (user) => {
  return sendEmail({
    to: user.email,

    subject:
      "CVRU Campus Surveillance - Account Request Update",

    text: `Hello ${user.name},

Your ${user.role} account request has been rejected by the Admin.

If you believe this was done in error, please contact the campus administration.

Regards,
CVRU Campus Surveillance System`,

    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Account Request Update</h2>

        <p>Hello <strong>${user.name}</strong>,</p>

        <p>
          Your <strong>${user.role}</strong>
          account request has been rejected by the Admin.
        </p>

        <p>
          If you believe this was done in error,
          please contact the campus administration.
        </p>

        <p>
          Regards,<br>
          <strong>CVRU Campus Surveillance System</strong>
        </p>
      </div>
    `,
  });
};

/*
========================================
VERIFY SMTP CONNECTION
========================================
*/

const verifyEmailTransport = async () => {
  try {
    await transporter.verify();

    console.log("=================================");
    console.log("SMTP EMAIL SERVER CONNECTED");
    console.log("=================================");

    return true;
  } catch (error) {
    console.error(
      "SMTP EMAIL CONNECTION FAILED:",
      error.message
    );

    return false;
  }
};

module.exports = {
  sendStudentWelcomeEmail,
  sendPendingApprovalEmail,
  sendApprovalEmail,
  sendRejectionEmail,
  sendEmailVerificationCode,
  verifyEmailTransport,
};