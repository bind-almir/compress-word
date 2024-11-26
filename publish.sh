# !/bin/bash

accountId=$(aws sts get-caller-identity --query Account --output text)
region="eu-west-1"
docker buildx build --platform=linux/amd64 -t c-rest .
docker tag c-rest:latest ${accountId}.dkr.ecr.${region}.amazonaws.com/c-rest:latest
aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${accountId}.dkr.ecr.${region}.amazonaws.com
docker build -t ${accountId}.dkr.ecr.${region}.amazonaws.com/c-rest:latest .
aws ecr describe-repositories --repository-names c-rest --region ${region} || aws ecr create-repository --repository-name c-rest --region ${region}
docker push ${accountId}.dkr.ecr.${region}.amazonaws.com/c-rest:latest