// 生成邮箱验证码的 HTML 模板
function generateVerificationEmailHTML(verificationCode) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>邮箱验证 - CanLifeHub</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">📧 验证邮箱</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                您好，
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                感谢您注册 CanLifeHub！请使用以下验证码完成邮箱验证：
              </p>
              
              <!-- Verification Code Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 30px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 8px;">
                    <p style="margin: 0 0 15px 0; font-size: 14px; font-weight: 600; color: #555555; text-transform: uppercase; letter-spacing: 1px;">
                      您的验证码
                    </p>
                    <p style="margin: 0; font-size: 42px; font-weight: bold; color: #667eea; letter-spacing: 12px; text-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);">
                      ${verificationCode}
                    </p>
                    <p style="margin: 15px 0 0 0; font-size: 14px; color: #666666;">
                      此验证码10分钟内有效
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Security Notice -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 30px; background-color: #e8f4fd; border-radius: 6px; border: 1px solid #b3d9f2;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; font-size: 14px; line-height: 20px; color: #0066a1;">
                      🔒 <strong>安全提示：</strong>
                    </p>
                    <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 14px; line-height: 20px; color: #0066a1;">
                      <li>如果这不是您的操作，请忽略此邮件</li>
                      <li>请勿将验证码分享给任何人</li>
                      <li>CanLifeHub 不会要求您提供密码或银行信息</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0 0; font-size: 14px; line-height: 20px; color: #999999;">
                如有任何问题，请联系我们的客服团队。
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #999999;">
                此邮件由 CanLifeHub 系统自动发送，请勿直接回复
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
