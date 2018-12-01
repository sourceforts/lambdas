'use strict';

const AWS = require('aws-sdk');
const axios = require('axios');

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

exports.handler = async (event, context) => {
    const addresses = [
        ...(await getAddresses('eu-west-2')),
        ...(await getAddresses('us-east-1')),
        ...(await getAddresses('ap-southeast-2')),
    ];

    const message = event.Records[0].Sns.Message;

    console.log('Sending updates to ', addresses);
    console.log(`Update: ${message}`);

    try {
        for (const addr of addresses) {
            await axios.post(`http://${addr}/api/v1/request-update`, { message });
        }
    } catch (error) {
        console.log(error);
        context.done(null, error);
    }

    console.log('Done!');
};
