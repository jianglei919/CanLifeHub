// Generate HTML template for email verification
function generateVerificationEmailHTML(verificationCode) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification - CanLifeHub</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">📧 Verify Email</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                Hello,
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                Thank you for registering with CanLifeHub! Please use the following code to complete your email verification:
              </p>
              
              <!-- Verification Code Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 30px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 8px;">
                    <p style="margin: 0 0 15px 0; font-size: 14px; font-weight: 600; color: #555555; text-transform: uppercase; letter-spacing: 1px;">
                      Your Verification Code
                    </p>
                    <p style="margin: 0; font-size: 42px; font-weight: bold; color: #667eea; letter-spacing: 12px; text-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);">
                      ${verificationCode}
                    </p>
                    <p style="margin: 15px 0 0 0; font-size: 14px; color: #666666;">
                      This code is valid for 10 minutes
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Security Notice -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 30px; background-color: #e8f4fd; border-radius: 6px; border: 1px solid #b3d9f2;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; font-size: 14px; line-height: 20px; color: #0066a1;">
                      🔒 <strong>Security Notice:</strong>
                    </p>
                    <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 14px; line-height: 20px; color: #0066a1;">
                      <li>If this was not you, please ignore this email</li>
                      <li>Do not share this code with anyone</li>
                      <li>CanLifeHub will never ask for your password or banking information</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0 0; font-size: 14px; line-height: 20px; color: #999999;">
                If you have any questions, please contact our support team.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #999999;">
                This is an automated message from CanLifeHub, please do not reply directly
              </p>
              <p style="margin: 0; font-size: 12px; color: #bbbbbb;">
                © 2025 CanLifeHub. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

module.exports = { generateVerificationEmailHTML };
