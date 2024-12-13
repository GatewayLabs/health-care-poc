"use server";

const LAMBDA_URL =
  "https://g74uycczphoqsuyfbw4lbfdg2e0kmrcp.lambda-url.ap-south-1.on.aws/";

export type AnalysisResult = {
  success: boolean;
  message: string;
  risk_level?: number;
  risk_category?: string;
  variant: "default" | "destructive";
};

export async function analyzeHealthData(formData: {
  heartRate: number;
  bloodPressure: number;
  oxygenLevel: number;
  balance: string;
}): Promise<AnalysisResult> {
  const { heartRate, bloodPressure, oxygenLevel, balance } = formData;

  // Check the passed balance
  if (parseFloat(balance) < 1) {
    return {
      success: false,
      message:
        "You need at least 1 OWN token to perform analysis. Please get more tokens from the faucet.",
      variant: "destructive",
    };
  }

  try {
    const response = await fetch(LAMBDA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        heart_rate: parseInt(heartRate.toString()),
        blood_pressure: parseInt(bloodPressure.toString()),
        oxygen_level: parseInt(oxygenLevel.toString()),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.risk_level !== undefined) {
      return {
        success: true,
        message: `Risk Category: ${data.risk_category} (Level ${data.risk_level})`,
        risk_level: data.risk_level,
        risk_category: data.risk_category,
        variant: "default",
      };
    }

    return {
      success: false,
      message: "Risk level could not be determined.",
      variant: "destructive",
    };
  } catch (error) {
    console.error("Analysis failed:", error);
    return {
      success: false,
      message: "Failed to analyze your health data. Please try again.",
      variant: "destructive",
    };
  }
}
