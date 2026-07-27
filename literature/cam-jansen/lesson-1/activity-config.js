/*
 * Temporary activity collection settings.
 * Web3Forms access keys are designed to be used in browser forms.
 * Never put an OpenAI/API secret in this file. AI requests must go through
 * a protected serverless or backend endpoint.
 */
window.ONCUVATE_ACTIVITY_CONFIG = Object.freeze({
  submissionEnabled: true,
  web3formsAccessKey: "819bc038-aadc-4d6d-8dcb-127ff776cc4d",
  classroomCode: "CAM-L01",
  aiTutorEndpoint: "",
  aiTutorTimeoutMs: 12000
});
