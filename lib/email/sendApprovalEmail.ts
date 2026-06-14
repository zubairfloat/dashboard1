export const sendApprovalEmail = async (
  email: string,
  username: string
) => {
  const response = await fetch(
    "/api/send-approval-email",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        username,
      }),
    }
  );

  const result = await response.json();

  if (!result.success) {
    throw new Error(
      result.error || "Failed to send email"
    );
  }

  return result;
};