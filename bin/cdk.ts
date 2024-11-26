#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FargateRestApiStack } from '../lib/cdk-stack';

const app = new cdk.App();
new FargateRestApiStack(app, 'CdkStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});