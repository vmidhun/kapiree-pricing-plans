const getPasswordResetEmailTemplate = (resetLink) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                padding-bottom: 20px;
                border-bottom: 1px solid #eeeeee;
            }
            .header h1 {
                color: #333333;
            }
            .content {
                padding: 20px 0;
                text-align: center;
            }
            .content p {
                color: #555555;
                line-height: 1.6;
            }
            .button-container {
                text-align: center;
                padding: 20px 0;
            }
            .button {
                display: inline-block;
                padding: 10px 20px;
                margin: 10px 0;
                background-color: #007bff;
                color: #ffffff;
                text-decoration: none;
                border-radius: 5px;
            }
            .footer {
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #eeeeee;
                color: #aaaaaa;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            <div class="content">
                <p>You have requested to reset your password for your Kapiree account.</p>
                <p>Please click the button below to reset your password. This link is valid for <strong>1 hour</strong>.</p>
                <div class="button-container">
                    <a href="${resetLink}" class="button">Reset Password</a>
                </div>
                <p>If you did not request a password reset, please ignore this email.</p>
                <p>For security reasons, do not share this link with anyone.</p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Kapiree. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

module.exports = { getPasswordResetEmailTemplate };
