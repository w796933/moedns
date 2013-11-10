var config = require('../config.js'),
    MongoClient = require('mongodb'),
    hat = require('hat');

function User(user) {
    this.name = user.name;
    this.email = user.email;
    this.password = user.password;
    this.activekey = user.activekey;
    this.role = user.role;
}

module.exports = User;


MongoClient.connect('mongodb://' + config.mongohost + '/' + config.mongodb, {w : 1}, function(err, db) {

    if(err) {
        console.log(err);
    }
    var collection = db.collection('users');

// save user data.
    User.prototype.save = function(callback) {
        // user infomation to save.
        var user = {
            name: this.name,
            email: this.email,
            password: this.password,
            activekey: this.activekey,
            role: this.role
        };

        collection.count('users', function(err, count) {
            if (err) {
                
                return callback(err, null);
            }
            if (count === 0) {
                user.role = 'admin';
            }
            collection.insert(user, {safe: true}, function(err, user) {
                
                callback(err, user); // return user data if success.
            });
        });
    };

    User.checkActivekey = function(activekey, callback) {
        collection.findOne({
            "activekey": activekey,
            "role": 'inactive'
        }, function(err, doc) {
            
            if (err) {
                return callback(err, null);
            }
            if (doc) {
                callback(err, doc);
            } else {
                callback(err, null);
            }
        });
    };

    User.activate = function(activekey, callback) {
        collection.update({"activekey": activekey}, {$set : {
            "role": 'user',
            "activekey": null
        }}, function(err) {
            
            if (err) {
                return callback(err);
            }
            callback(null);
        });
    };

// read user data.
    User.get = function(name, callback) {
        collection.findOne({
            "name": name
        }, function(err, doc) {
            
            if (err) {
                return callback(err, null);
            }
            if (doc) {
                var user = new User(doc);
                callback(null, user);
            } else {
                callback(null, null);
            }
        });
    };

    User.check = function(name, email, callback) {
        collection.findOne({ $or : [
            {"name": name},
            {"email": email}
        ]}, function(err, doc) {
            
            if (err) {
                return callback(err, null);
            }
            if (doc) {
                var user = new User(doc);
                callback(null, user);
            } else {
                callback(null, null);
            }
        });
    };

    User.edit = function(user, callback) {
        // console.log(user);
        collection.update({"name": user.name}, { $set: {
            "name": user.name,
            "password": user.password,
            "email": user.email
        }}, function(err) {
            
            if (err) {
                return callback(err);
            }
            callback(null);
        });
    };

    User.delete = function(username, callback) {
        collection.remove({"name": username}, function(err) {
            
            if (err) {
                return callback(err);
            }
            callback(null);
        });
    };

    User.createApi = function(username, callback) {
        collection.update({"name": username}, { $set: {
            "apikey": hat()
        }}, function(err, apikey) {
            
            if (err) {
                return callback(err, null);
            }
            callback(null, apikey);
        });
    };

    User.getApi = function(username, callback) {
        collection.findOne({
            "name": username
        }, function(err, doc) {
            
            if (err) {
                return callback(err, null);
            }
            if (doc) {
                callback(null, doc.apikey);
            } else {
                callback(null, null);
            }
        });
    };

    User.checkApi = function(apikey, callback) {
        collection.findOne({
            "apikey": apikey
        }, function(err, doc) {
            
            if (err) {
                return callback(err, null);
            }
            if (doc) {
                callback(null, doc);
            } else {
                callback(null, null);
            }
        });
    };

    User.createResetkey = function(username, email, callback) {
        var resetkey = hat(),
            resetTime = new Date().getTime();
        collection.update({
            "name":username,
            "email":email
        }, { $set : {
            "resetkey": resetkey,
            "resetTime": resetTime
        }}, function(err) {
            
            if (err) {
                return callback(err);
            }
            callback(err, resetkey);
        });
    };

    User.clearResetkey = function(resetkey) {
        setTimeout(function () {
            collection.update({"resetkey": resetkey}, { $set: {
                "resetkey": null
            }}, function(err) {
                
                if (err) {
                    return console.log(err);
                }
                console.log('Resetkey ' + resetkey + ' Cleared.');
            });
        }, 3600000)
    };

    User.checkResetkey = function(resetkey, callback) {
        collection.findOne({
            "resetkey": resetkey
        }, function(err, doc) {
            
            if (err) {
                return callback(err, null);
            }
            if(doc) {
                var date = new Date().getTime();
                if (date - doc.resetTime > 3600000) {
                    return callback('RESETKEY_INVALID', null);
                }
                callback(null, doc); // query success, return user data.
            } else {
                callback(null, null); // query failed, return null.
            }
        });
    };
});

/* 
// save user data.
User.prototype.save = function(callback) {
    // user infomation to save.
    var user = {
        name: this.name,
        email: this.email,
        password: this.password,
        activekey: this.activekey,
        role: this.role
    };
    // open database.
    mongoclient.open(function(err, mongoclient) {
        var db = mongoclient.db(config.mongodb);
        if(err) {
            return callback(err);
        }

        // read user collection.
        db.collection('users', function(err, collection) {
            if(err) {
                mongoclient.close;
                return callback(err);
            }

            collection.count(function (err, count) {
                if(err) {
                    mongoclient.close;
                    return callback(err);
                }
                // Check if user is first one
                if (count === 0) {
                    user.role = "admin";
                }
                // insert user data to collection.
                collection.insert(user, {safe: true}, function(err, user) {
                    mongoclient.close();
                    callback(err, user); // return user data if success.
                });
            });

        });
    });
};

User.checkActivekey = function(activekey, callback) {
    mongoclient.open(function(err, mongoclient) {
        var db = mongoclient.db(config.mongodb);
        if(err) {
            return callback(err);
        }
        // read users collection.
        db.collection('users', function(err, collection) {
            if(err) {
                mongoclient.close();
                return callback(err);
            }
            collection.findOne({
                "activekey": activekey,
                "role": 'inactive'
            }, function(err, doc) {
                mongoclient.close();
                // console.log(doc);
                if(doc) {
                    // console.log(doc.apikey);
                    callback(err, doc); // query success, return user data.
                } else {
                    callback(err, null); // query failed, return null.
                }
            });
        });
    });
}

User.activate = function(activekey, callback) {
    mongoclient.open(function(err, mongoclient) {
        var db = mongoclient.db(config.mongodb);
        if (err) {
            return callback(err);
        }
        db.collection('users', function(err, collection) {
            if (err) {
                mongoclient.close();
                return callback(err);
            }
            collection.update({"activekey":activekey}, {$set : {
                "role": 'user',
                "activekey": null
            }}, function(err) {
                if (err) {
                    mongoclient.close();
                    return callback(err);
                }
                mongoclient.close();
                callback(null);
            });
        });
    });
};

// read user data.
User.get = function(name, callback) {
    //open database.
    mongoclient.open(function(err, mongoclient) {
        var db = mongoclient.db(config.mongodb);
        if(err) {
            return callback(err);
        }
        // read users collection.
        db.collection('users', function(err, collection) {
            if(err) {
                mongoclient.close();
                return callback(err);
            }
            collection.findOne({
                name: name
            }, function(err, doc) {
                // console.log(doc);
                mongoclient.close();
                if(doc) {
                    var user = new User(doc);
                    callback(err, user); // query success, return user data.
                } else {
                    callback(err, null); // query failed, return null.
                }
            });
        });
    });
};

User.check = function(name, email, callback) {
    //open database.
    mongoclient.open(function(err, mongoclient) {
        var db = mongoclient.db(config.mongodb);
        if(err) {
            return callback(err);
        }
        // read users collection.
        db.collection('users', function(err, collection) {
            if(err) {
                mongoclient.close();
                return callback(err);
            }
            collection.findOne({ $or : [
                {name: name},
                {email: email}
            ]}, function(err, doc) {
                mongoclient.close();
                if(doc) {
                    var user = new User(doc);
                    // console.log(user);
                    callback(null, user); // query success, return user data.
                } else {
                    callback(err, null); // query failed, return null.
                }
            });
        });
    });
};

User.edit = function(user, callback) {
    mongoclient.open(function(err, mongoclient) {
        var db = mongoclient.db(config.mongodb);
        if (err) {
            return callback(err);
        }
        db.collection('users', function(err, collection) {
            if (err) {
                mongoclient.close();
                return callback(err);
            }
            collection.update({"name":user.name}, {$set : {
                "name": user.name,
                "password": user.password,
                "email": user.email
                // "role": user.role
            }}, function(err) {
                if (err) {
                    mongoclient.close();
                    return callback(err);
                }
                mongoclient.close();
                callback(err, user);
            });
        });
    });
};

User.delete = function(username, callback) {
    mongoclient.open(function(err, mongoclient) {
        var db = mongoclient.db(config.mongodb);
        if (err) {
            return callback(err);
        }
        db.collection('users', function(err, collection) {
            if (err) {
                mongoclient.close();
                return callback(err);
            }
            collection.remove({"name":username}, function(err) {
                if (err) {
                    mongoclient.close();
                    return callback(err);
                }
                mongoclient.close();
                callback(null);
            });
        });
    });
}

User.createApi = function(username, callback) {
    mongoclient.open(function(err, mongoclient) {
        var db = mongoclient.db(config.mongodb);
        if (err) {
            return callback(err);
        }
        db.collection('users', function(err, collection) {
            if (err) {
                mongoclient.close();
                return callback(err);
            }
            collection.update({"name":username}, {$set : {
                "apikey": hat()
            }}, function(err, apikey) {
                if (err) {
                    mongoclient.close();
                    return callback(err);
                }
                mongoclient.close();
                callback(err, apikey);
            });
        });
    });
}

User.getApi = function(username, callback) {
    mongoclient.open(function(err, mongoclient) {
        var db = mongoclient.db(config.mongodb);
        if(err) {
            return callback(err);
        }
        // read users collection.
        db.collection('users', function(err, collection) {
            if(err) {
                mongoclient.close();
                return callback(err);
            }
            collection.findOne({
                "name": username
            }, function(err, doc) {
                // console.log(doc);
                mongoclient.close();
                if(doc) {
                    // console.log(doc.apikey);
                    callback(err, doc.apikey); // query success, return user data.
                } else {
                    callback(err, null); // query failed, return null.
                }
            });
        });
    });
}

User.checkApi = function(apikey, callback) {
    // console.log(apikey);
    mongoclient.open(function(err, mongoclient) {
        var db = mongoclient.db(config.mongodb);
        if(err) {
            return callback(err);
        }
        // read users collection.
        db.collection('users', function(err, collection) {
            if(err) {
                mongoclient.close();
                return callback(err);
            }
            collection.findOne({
                "apikey": apikey
            }, function(err, doc) {
                mongoclient.close();
                // console.log(doc);
                if(doc) {
                    // console.log(doc.apikey);
                    callback(err, doc); // query success, return user data.
                } else {
                    callback(err, null); // query failed, return null.
                }
            });
        });
    });
}

User.createResetkey = function(username, email, callback) {
    mongoclient.open(function(err, mongoclient) {
        var db = mongoclient.db(config.mongodb);
        if (err) {
            mongoclient.close();
            return callback(err);
        }
        db.collection('users', function(err, collection) {
            if (err) {
                mongoclient.close();
                return callback(err);
            }
            var resetkey = hat(),
                resetTime = new Date().getTime();
            collection.update({
                "name":username,
                "email":email
            }, {$set : {
                "resetkey": resetkey,
                "resetTime": resetTime
            }}, function(err) {
                if (err) {
                    mongoclient.close();
                    return callback(err);
                }
                mongoclient.close();
                callback(err, resetkey);
            });
        });
    });
}

User.clearResetkey = function(resetkey) {
    setTimeout(function () {
        mongoclient.open(function(err, mongoclient) {
            var db = mongoclient.db(config.mongodb);
            if (err) {
                mongoclient.close();
            }
            db.collection('users', function(err, collection) {
                if (err) {
                    mongoclient.close();
                }
                collection.update({"resetkey":resetkey}, {$set : {
                    "resetkey": null
                }}, function(err) {
                    if (err) {
                        mongoclient.close();
                        console.log(err);
                    }
                    mongoclient.close();
                    console.log('Resetkey ' + resetkey + ' Cleared.')
                });
            });
        });
    }, 3600000)
}

User.checkResetkey = function(resetkey, callback) {
    // console.log(apikey);
    mongoclient.open(function(err, mongoclient) {
        var db = mongoclient.db(config.mongodb);
        if(err) {
            return callback(err);
        }
        // read users collection.
        db.collection('users', function(err, collection) {
            if(err) {
                mongoclient.close();
                return callback(err);
            }
            collection.findOne({
                "resetkey": resetkey
            }, function(err, doc) {
                mongoclient.close();
                // console.log(doc);
                if(doc) {
                    var date = new Date().getTime();
                    if (date - doc.resetTime > 3600000) {
                        return callback('RESETKEY_INVALID', null);
                    }
                    callback(err, doc); // query success, return user data.
                } else {
                    callback(err, null); // query failed, return null.
                }
            });
        });
    });
}
*/