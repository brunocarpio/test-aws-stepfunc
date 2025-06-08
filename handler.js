//@ts-check

import AWS from "aws-sdk";
const sfn = new AWS.StepFunctions();

/**
 * 1. API Gateway -> This Lambda
 *
 * This function is correct and does NOT need changes. It starts the
 * synchronous Step Function and returns its result.
 */
export async function startSyncExecution(event) {
  console.log("Received API request:", event.body);

  const params = {
    stateMachineArn: process.env.STATE_MACHINE_ARN,
    input: event.body, // The input is passed directly
  };

  try {
    const result = await sfn.startSyncExecution(params).promise();

    if (result.status === "FAILED") {
      const error = JSON.parse(result.error);
      console.error("State machine execution failed:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Computation failed.",
          error: error.Cause,
        }),
      };
    }

    let output = result.output;
    console.log(output);
    let body = JSON.parse(output);
    let payload = body.Payload;

    // The final result of the execution is in the output property
    return {
      statusCode: 200,
      body: JSON.stringify(payload),
    };
  } catch (error) {
    console.error("Error starting state machine execution:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error." }),
    };
  }
}

/**
 * 2. Step Function -> This Lambda
 *
 * THE FIX: This function is now much simpler. It no longer knows about
 * Step Functions or task tokens. It just performs a calculation and returns a result.
 */
export async function processComputation(input) {
  console.log("Received task with input:", input);

  // --- Your Computation Logic Goes Here ---
  const computationResult = {
    product: input.number1 * input.number2,
    receivedAt: new Date().toISOString(),
  };
  // --- End of Computation Logic ---

  // Simply return the result. The Step Function will capture this
  // and pass it on as the state's output.
  return computationResult;
}
