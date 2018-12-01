#!/bin/bash

aws s3 sync sourceforts-server-build-notification-handler.zip s3://$AWS_S3_BUCKET/sourceforts-server-build-notification-handler.zip
