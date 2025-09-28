export function buildEmail(planName, downloadLink, licenseKey) {
  return {
    subject: `Your MergeMind ${planName} License`,
    text: `Thanks for purchasing MergeMind ${planName}!

Download your package here:
${downloadLink}

Your license key:
${licenseKey}

If you run into any issues, reply to this email and we’ll help you out.

– The MergeMind Team`,
    html: `
      <h2>Thanks for purchasing <strong>MergeMind ${planName}</strong>!</h2>
      <p>Here are your details:</p>
      <ul>
        <li><strong>Download:</strong> <a href="${downloadLink}">${downloadLink}</a></li>
        <li><strong>License Key:</strong> <code>${licenseKey}</code></li>
      </ul>
      <p>If you run into any issues, just reply to this email and we’ll help you out.</p>
      <br/>
      <em>– The MergeMind Team</em>
    `,
  };
}
