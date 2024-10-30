import * as cdk from 'aws-cdk-lib';
import * as lambdanode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { Construct } from 'constructs';

export class GameStoreAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const gamestoreFn = new lambdanode.NodejsFunction(this, "GameStoreFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/gamestore.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
    });

    const gamestoreFnURL = gamestoreFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.AWS_IAM,
      cors: {
        allowedOrigins: ["*"],
      },
    });

    new cdk.CfnOutput(this, "GameStore Function Url", { value: gamestoreFnURL.url });

  }
}