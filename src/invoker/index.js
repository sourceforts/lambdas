'use strict';

const axios = require('axios');

exports.handler = async (event, context) => {
    const config = {
        headers: {
            Authorization: `token ${process.env.TRAVIS_TOKEN}`,
            'Travis-API-Version': 3,
        },
    };

    try {
        await axios.post('https://api.travis-ci.org/repo/sourceforts/server/requests', {
            request: {
                branch: 'master',
            },
        }, config);   
    } catch (error) {
        console.log(error);
        context.done(null, error);
    }

    console.log('Done!');
};
