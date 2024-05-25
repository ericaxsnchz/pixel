const mongoose = require('mongoose');
const Channel = require('../server/models/Channel');

const channels = [
    {
        name: 'Playstation',
        description: 'the playstation channel'
    },
    {
        name: 'Xbox',
        description: 'the xbox channel'
    },
    {
        name: 'Nintendo',
        description: 'the nintendo channel'
    },
    {
        name: 'PC',
        description: 'the pc channel'
    }
]

const initChannels = async () => {
    await mongoose.connect('mongodb+srv://ericasanchez2835:qgXfbpL1jmVhAjYV@pixel.4dds8xv.mongodb.net/forum',({
        useNewUrlParser: true,
        useUnifiedTopology: true
    }));
    for (let channelData of channels) {
        const existingChannel = await Channel.findOne({
            name: channelData.name
        });
        if (!existingChannel) {
            const newChannel = new Channel(channelData);
            await newChannel.save();
        }
    }
    mongoose.disconnect();
}

initChannels().catch(err => console.log(err));