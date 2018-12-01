'use strict';

const DEV = process.env.DEV_MODE == 'true';

const AWS = require('aws-sdk');
const Rcon = require('srcds-rcon');

if (DEV) {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'aaa',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'bbb',
    region: process.env.AWS_REGION || 'us-west-2',
    endpoint: process.env.AWS_DYNAMODB_ENDPOINT
  });
}

const getPassword = async () => {
    return new Promise((resolve, reject) => {
        const client = new AWS.SecretsManager({
            region: 'eu-west-2',
        });
    
        client.getSecretValue({
            SecretId: 'sourceforts/rcon',
        }, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
    
            if ('SecretString' in data) {
                secret = data.SecretString;
                resolve(secret);
                return;
            }

            let buff = new Buffer(data.SecretBinary, 'base64');
            decodedBinarySecret = buff.toString('ascii');
            resolve(decodedBinarySecret);
        });
    });
};

const getAddresses = async region => {
    const ec2 = new AWS.EC2({
        region,
    });

    return new Promise((resolve, reject) => {
        ec2.describeAddresses({}, (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(data.Addresses.map(a => a.PublicIp));
        });
    });
}

const getRconConnection = (address, password) => {
    return Rcon({
        address,
        password
    }).connect();
};

exports.handler = async (event, context, callback) => {
    // TODO; get the message from the SNS topic
    console.log(event);

    const password = 'changeme'// await getPassword();

    const addresses = [
        ...(await getAddresses('eu-west-2')),
        ...(await getAddresses('us-east-1')),
        ...(await getAddresses('ap-southeast-2')),
    ];

    addresses.forEach(addr => {
        const conn = getRconConnection(addr, password);

        conn.then(() => {
            conn.command('say "New server version detected."')  
        });
    });
};
