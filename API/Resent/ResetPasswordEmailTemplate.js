// 密码重置邮件模板
function generateResetPasswordEmailHTML(resetLink) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>重置密码 - CanLifeHub</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">🔐 重置密码</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                您好，
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                我们收到了您的密码重置请求。请点击下方按钮重置您的 CanLifeHub 账户密码：
              </p>
              
              <!-- Reset Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      重置密码
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; font-size: 14px; line-height: 20px; color: #666666;">
                或复制以下链接到浏览器中打开：
              </p>
              
              <div style="padding: 12px; background-color: #f8f9fa; border-radius: 4px; border-left: 4px solid #667eea; word-break: break-all;">
                <a href="${resetLink}" style="color: #667eea; text-decoration: none; font-size: 14px;">
                  ${resetLink}
                </a>
              </div>
              
              <!-- Warning -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 30px; background-color: #fff3cd; border-radius: 6px; border: 1px solid #ffeaa7;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; font-size: 14px; line-height: 20px; color: #856404;">
                      ⚠️ <strong>重要提示：</strong>
                    </p>
                    <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 14px; line-height: 20px; color: #856404;">
                      <li>此链接将在 <strong>1小时</strong> 后失效</li>
                      <li>如果您没有请求重置密码，请忽略此邮件</li>
                      <li>请勿将此链接分享给他人</li>
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

module.exports = { generateResetPasswordEmailHTML };
