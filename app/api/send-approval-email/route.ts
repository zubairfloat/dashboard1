import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const body = await request.json();

  const { email, username } = body;

  try {
    const result = await resend.emails.send({
      from: "LinkedUp AI <noreply@linkedupai.xyz>",
      to: email,
      subject: "Your Axnetix Account Has Been Approved",
      html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Account Approved</title>
</head>

<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table
  width="800"
  cellpadding="0"
  cellspacing="0"
  style="
    background:#ffffff;
    margin:40px auto;
    border-radius:12px;
    padding:50px;
  "
>
<tr>
<td>

<h1
  style="
    color:#1e40af;
    font-size:42px;
    margin-bottom:30px;
  "
>
  Welcome to Axnetix Network
</h1>

<p style="font-size:20px;">
  Dear ${username},
</p>

<p style="font-size:18px;line-height:1.8;">
  Congratulations! Your Axnetix Network account has been successfully approved.
</p>

<p style="font-size:18px;line-height:1.8;">
  Your account review has been completed and you now have full access to the platform.
</p>

<div
  style="
    text-align:center;
    margin:40px 0;
  "
>
  <a
    href="https://dashboard1-seven-pink.vercel.app/login"
    style="
      background:#2563eb;
      color:white;
      padding:16px 40px;
      text-decoration:none;
      border-radius:8px;
      font-size:18px;
      font-weight:bold;
      display:inline-block;
    "
  >
    Login To Your Account
  </a>
</div>

<h3>
  Your account is now active and you can:
</h3>

<ul
  style="
    font-size:18px;
    line-height:2;
  "
>
  <li>Access the Axnetix dashboard</li>
  <li>View your assigned tokens</li>
  <li>Monitor token balances</li>
  <li>Access platform features</li>
</ul>

<p style="font-size:18px;line-height:1.8;">
  If you have any questions or require assistance, please contact our support team.
</p>

<p style="font-size:18px;">
  Email:
  <a href="mailto:info@axnetix.com">
    info@axnetix.com
  </a>
</p>

<br />

<p style="font-size:18px;">
  Best Regards,
</p>

<p
  style="
    font-size:20px;
    font-weight:bold;
  "
>
  The Axnetix Network Team
</p>

<p>
  Email:
  <a href="mailto:info@axnetix.com">
    info@axnetix.com
  </a>
</p>

<p>
  Website:
  <a href="https://axnetix.com">
    www.axnetix.com
  </a>
</p>

</td>
</tr>
</table>

</td>
</tr>
</table>

</body>
</html>
`,
    });

    console.log("RESEND RESPONSE:", result);

    return Response.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("EMAIL ERROR:", error);

    return Response.json(
      {
        success: false,
        error,
      },
      {
        status: 500,
      },
    );
  }
}
