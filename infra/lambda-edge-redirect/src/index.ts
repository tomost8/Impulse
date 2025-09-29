import { CloudFrontRequestHandler } from "aws-lambda";

export const handler: CloudFrontRequestHandler = async (event) => {
  const request = event.Records[0].cf.request;
  const uri = request.uri; // e.g. "/r/ABC123"
  const referralCode = uri.split("/").pop();

  const userAgent = request.headers["user-agent"]?.[0]?.value || "";
  let redirectUrl: string;

  if (/android/i.test(userAgent)) {
    redirectUrl = `https://play.google.com/store/apps/details?id=com.impluse&referrer=${referralCode}`;
  } else if (/iphone|ipad/i.test(userAgent)) {
    const isTestFlight = /TestFlight/i.test(userAgent); // optional if you can detect
    if (isTestFlight) {
      // Deep link for TestFlight
      redirectUrl = `myapp://signup?referral=${referralCode}`;
    } else {
      // Production App Store
      redirectUrl = `https://apps.apple.com/us/app/impulse-achieve-more-together/id6502073364?referral=${referralCode}`;
    }
  } else {
    redirectUrl = `https://your-landing-page.com?referral=${referralCode}`;
  }


  return {
    status: "302",
    statusDescription: "Found",
    headers: {
      location: [{ key: "Location", value: redirectUrl }],
    },
  };
};
