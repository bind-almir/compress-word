import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class FargateRestApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr('192.168.0.0/16'),
      natGateways: 0,
    });

    const securityGroup = new ec2.SecurityGroup(this, 'CustomCSG', {
      vpc,
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3333), 'Allow inbound traffic on port 3333');

    vpc.addInterfaceEndpoint('ECREndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
    });

    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'CRestALB', {
      vpc,
      internetFacing: true,
      securityGroup,
    });

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
    });

    const taskRole = new iam.Role(this, 'CRestTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    (taskRole as iam.Role).addToPolicy(new iam.PolicyStatement({
      actions: [
        'ecr:GetAuthorizationToken',
        'ecr:BatchCheckLayerAvailability',
        'ecr:GetDownloadUrlForLayer',
        'ecr:DescribeRepositories',
        'ecr:ListImages',
        'ecr:BatchGetImage',
      ],
      resources: [`arn:aws:ecr:${this.region}:${this.account}:repository/c-rest`], 
    }));

    const executionRole = new iam.Role(this, 'CRestExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'CRestTaskDefinition', {
      memoryLimitMiB: 512, 
      cpu: 256, 
      taskRole: taskRole,
      executionRole: executionRole,
    });

    taskDefinition.addContainer('CApiContainer', {
      image: ecs.ContainerImage.fromRegistry(`${this.account}.dkr.ecr.${this.region}.amazonaws.com/c-rest:latest`),
      containerName: 'CApi',
      environment: {
        ALB_DNS_NAME: loadBalancer.loadBalancerDnsName,
      },
      logging: ecs.LogDrivers.awsLogs({ 
        streamPrefix: 'CApiLogs',
        logGroup: new logs.LogGroup(this, 'CApiLogGroup', {
          logGroupName: '/ecs/c-rest-api',
          retention: logs.RetentionDays.ONE_DAY,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
      }),
      portMappings: [
        { containerPort: 3333, protocol: ecs.Protocol.TCP },
      ],
    });
  
    const service = new ecs.FargateService(this, 'CApiFargateService', {
      cluster,
      taskDefinition,
      securityGroups: [securityGroup],
      desiredCount: 1, 
      assignPublicIp: true,
    });

    loadBalancer.addListener('CRestCApiListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      open: true,
    }).addTargets('CRestTarget', {
      port: 3333,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [
        service
      ],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
      },
    });

    new cdk.CfnOutput(this, 'RunCProgramEndpoint', {
      value: `http://${loadBalancer.loadBalancerDnsName}/run`,
    });
    
  }
}