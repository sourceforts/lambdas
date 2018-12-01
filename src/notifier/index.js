'use strict';

const AWS = require('aws-sdk');
const axios = require('axios');

const getPassword = async () => {
    return 'changeme';
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
    console.log(`Getting elastic ips for region ${region}`);
    const ec2 = new AWS.EC2({
        region,
    });

    return new Promise((resolve, reject) => {
        ec2.describeAddresses({}, (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            const result = data.Addresses.map(a => a.PublicIp);
            console.log(`Success. Returning addresses ${result}`);
            resolve(result);
        });
    });
}

exports.handler = async (event, context, callback) => {
    const password = await getPassword();
    const addresses = [
        ...(await getAddresses('eu-west-2')),
        ...(await getAddresses('us-east-1')),
        ...(await getAddresses('ap-southeast-2')),
    ];

    console.log('Sending updates to ', addresses);
    console.log(`Update: ${event.Sns.Message}`);

    addresses.forEach(async addr => {
        axios.post(`${addr}/api/v1/command`, {
            command: `say [BOT] New server version detected. ${event.Sns.Message}`,
            password,
        })
        then(console.log)
        .catch(err => {
            throw err;
        });
    });
};
