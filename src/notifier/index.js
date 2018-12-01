'use strict';

const AWS = require('aws-sdk');
const Rcon = require('srcds-rcon');

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

exports.handler = async (event, context, callback) => {
    const password = await getPassword();

    const addresses = [
        ...(await getAddresses('eu-west-2')),
        ...(await getAddresses('us-east-1')),
        ...(await getAddresses('ap-southeast-2')),
    ];

    console.log('Sending updates to ', addresses);

    addresses.forEach(addr => {
        const rcon = Rcon({
            address: addr,
            password
        });
        
        rcon.connect()
            .then(() => rcon.command(`say "New server version detected. ${event.Sns.Message}"`).catch(err => {
                throw err;
            }))
            .then(() => rcon.disconnect())
            .catch(err => {
                throw err;
            });
    });
};
