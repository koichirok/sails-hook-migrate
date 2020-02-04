'use strict';

const DBMigrate = require('db-migrate');

module.exports = function(sails) {

  var adapters = [
    {driver: 'sqlite3', regex: /sqlite/i},
    {driver: 'mysql', regex: /mysql/i},
    {driver: 'pg', regex: /postgre|pg/i},
    {driver: 'mongodb', regex: /mongo/i},
  ]

  return {
    defaults: {
      __configKey__:{
        _hookTimeout: 30000 // 30 seconds to migrate
      }
    },
    configure: function(){

    },
    initialize: function(done){
      //console.log('>>>>>> sails.hooks.migrate.initialize() called.');
      // Try to read settings from old Sails then from the new.
      // 0.12: sails.config.connections & sails.config.models.connection
      // 1.00: sails.config.datastores & sails.config.models.datastore
      const datastores = sails.config.connections || sails.config.datastores;
      const datastoreName = sails.config.models.connection || sails.config.models.datastore || 'default';
      var connection;
      try{
        connection = datastores[datastoreName];
      }catch(e){}

      if( !connection || !connection.adapter){
        sails.log.warn('Connection not supported or missing adapter');
        return done();
      }

      let driver = adapters.filter(adapter => adapter.regex.test(connection.adapter))
        .reduce((o, n) => n.driver || o, false);

      if( !driver ){
        sails.log.warn('adapter %s not supported for sails-hook-migrate', connection.adapter);
        return done();
      }

      var migrate = DBMigrate.getInstance(true, {
          config: {
            // db-migrate internally will use dev as default config - set dev config to our actual environment connection
            ['dev']: Object.assign({
              driver: driver,
            }, connection)
          }
        });

      migrate.up(function(err){
        //console.log('done', arguments.length);
        //console.log('arguments', Array.prototype.slice.call(arguments))
        return done(err);
      });


    }
  };
}
