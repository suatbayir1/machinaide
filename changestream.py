import os

import pymongo

from bson.json_util import dumps


client = pymongo.MongoClient("mongodb://machinaide:erste2020@localhost:27017/machineLearning?authSource=admin&readPreference=primary&directConnection=true&ssl=false")

change_stream = client.changestream.collection.watch()

for change in change_stream:

    print(dumps(change))

    print('') # for readability only